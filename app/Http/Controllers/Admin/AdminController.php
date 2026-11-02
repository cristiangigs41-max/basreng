<?php
namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductSize;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AdminController extends Controller
{
    public function stats()
    {
        $valid = Order::where('status', '!=', 'Dibatalkan');
        $from = now()->subDays(6)->startOfDay();
        $byDay = (clone $valid)->where('created_at', '>=', $from)->get(['total', 'created_at'])
            ->groupBy(fn ($o) => $o->created_at->format('Y-m-d'))->map->sum('total');
        $sales = collect(range(6, 0))->map(function ($i) use ($byDay) {
            $d = now()->subDays($i)->format('Y-m-d');
            return ['date' => $d, 'total' => (int) ($byDay[$d] ?? 0)];
        })->values();
        $top = OrderItem::whereHas('order', fn ($q) => $q->where('status', '!=', 'Dibatalkan'))
            ->select('product_name', 'size_label', DB::raw('SUM(qty) as qty'))
            ->groupBy('product_name', 'size_label')->orderByDesc('qty')->limit(5)->get()
            ->map(fn ($t) => ['name' => "{$t->product_name} {$t->size_label}", 'qty' => (int) $t->qty]);

        return response()->json([
            'products' => Product::count(),
            'customers' => User::where('role', 'customer')->count(),
            'orders' => Order::count(),
            'revenue' => (int) (clone $valid)->sum('total'),
            'sales' => $sales,
            'latest' => Order::with(['items', 'payment', 'user'])->latest()->limit(5)->get()->map->toApi(),
            'top' => $top,
        ]);
    }

    /* ---- Pesanan ---- */
    public function orders()
    {
        return response()->json(Order::with(['items', 'payment', 'user'])->latest()->get()->map->toApi());
    }

    public function setStatus(Request $r, Order $order)
    {
        $data = $r->validate(['status' => 'required|in:' . implode(',', Order::STATUSES)]);
        $to = $data['status'];
        if ($to !== $order->status) {
            if ($order->status === 'Selesai') abort(422, 'Pesanan yang sudah selesai tidak bisa diubah.');
            if ($order->status !== 'Dibatalkan' && $to !== 'Dibatalkan' && (Order::NEXT[$order->status] ?? null) !== $to) {
                abort(422, 'Urutan status: Pending → Diproses → Dikirim → Selesai.');
            }
            if ($to === 'Selesai' && $order->isCod() && !$order->payment?->delivery_proof) {
                abort(422, 'Pelanggan wajib mengunggah bukti pembayaran ke pengantar dulu.');
            }
        }
        DB::transaction(function () use ($order, $data) {
            if ($data['status'] === 'Dibatalkan' && $order->status !== 'Dibatalkan') {
                foreach ($order->items as $it) { // kembalikan stok
                    if ($it->product_size_id) ProductSize::where('id', $it->product_size_id)->increment('stock', $it->qty);
                }
            }
            if ($order->status === 'Dibatalkan' && $data['status'] !== 'Dibatalkan') {
                abort(422, 'Pesanan yang dibatalkan tidak bisa dibuka kembali.');
            }
            $order->update(['status' => $data['status']]);
            if ($data['status'] === 'Selesai' && $order->payment) {
                $order->payment->update(['status' => 'Dibayar', 'paid_at' => now()]);
            }
        });
        return response()->json($order->fresh(['items', 'payment', 'user'])->toApi());
    }

    /* ---- Pelanggan & laporan ---- */
    public function customers()
    {
        return response()->json(User::where('role', 'customer')->withCount('orders')->latest()
            ->get(['id', 'name', 'email', 'phone', 'created_at']));
    }

    public function report(Request $r)
    {
        $d = $r->validate(['from' => 'required|date', 'to' => 'required|date|after_or_equal:from']);
        $orders = Order::with(['items', 'payment', 'user'])->where('status', 'Selesai')
            ->whereDate('created_at', '>=', $d['from'])->whereDate('created_at', '<=', $d['to'])->latest()->get();
        return response()->json(['count' => $orders->count(), 'total' => (int) $orders->sum('total'), 'orders' => $orders->map->toApi()]);
    }

    /* ---- Kategori ---- */
    public function categories() { return response()->json(Category::withCount('products')->orderBy('name')->get()); }

    public function storeCategory(Request $r)
    {
        $d = $r->validate(['name' => 'required|string|max:80|unique:categories,name']);
        return response()->json(Category::create(['name' => $d['name'], 'slug' => Str::slug($d['name'])]), 201);
    }

    public function updateCategory(Request $r, Category $category)
    {
        $d = $r->validate(['name' => 'required|string|max:80|unique:categories,name,' . $category->id]);
        $category->update(['name' => $d['name'], 'slug' => Str::slug($d['name'])]);
        return response()->json($category);
    }

    public function destroyCategory(Category $category)
    {
        abort_if($category->products()->exists(), 422, 'Kategori masih memiliki produk.');
        $category->delete();
        return response()->json(['message' => 'ok']);
    }

    /* ---- Produk ---- */
    public function storeProduct(Request $r)
    {
        $d = $r->validate([
            'name' => 'required|string|max:120', 'description' => 'nullable|string|max:1000',
            'category_id' => 'required|exists:categories,id', 'is_active' => 'boolean',
            'image' => 'nullable|image|max:2048',
        ]);
        if ($r->hasFile('image')) $d['image'] = $r->file('image')->store('products', 'public');
        $p = Product::create($d);
        foreach (Product::DEFAULT_SIZES as [$label, $price]) $p->sizes()->create(['label' => $label, 'price' => $price, 'stock' => 0]);
        return response()->json($p->load('sizes'), 201);
    }

    public function updateProduct(Request $r, Product $product)
    {
        $d = $r->validate([
            'name' => 'required|string|max:120', 'description' => 'nullable|string|max:1000',
            'category_id' => 'required|exists:categories,id', 'is_active' => 'boolean',
            'image' => 'nullable|image|max:2048',
        ]);
        if ($r->hasFile('image')) $d['image'] = $r->file('image')->store('products', 'public');
        $product->update($d);
        return response()->json($product->load('sizes'));
    }

    public function destroyProduct(Product $product)
    {
        $product->delete(); // ukuran ikut terhapus; riwayat pesanan tetap (snapshot nama)
        return response()->json(['message' => 'ok']);
    }

    public function updateSize(Request $r, ProductSize $size)
    {
        $d = $r->validate(['price' => 'required|integer|min:0|max:100000000', 'stock' => 'required|integer|min:0|max:1000000']);
        $size->update($d);
        return response()->json($size);
    }
}
