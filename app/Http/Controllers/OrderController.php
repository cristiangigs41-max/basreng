<?php
namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\Order;
use App\Models\ProductSize;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    public function index(Request $r)
    {
        $orders = Order::with(['items', 'payment'])->where('user_id', $r->user()->id)->latest()->get();
        return response()->json($orders->map->toApi());
    }

    // Pelanggan mengunggah bukti bayar kepada pengantar (saat pesanan Dikirim)
    public function deliveryProof(Request $r, Order $order)
    {
        abort_unless($order->user_id === $r->user()->id, 403, 'Bukan pesanan Anda.');
        abort_unless($order->status === 'Dikirim', 422, 'Bukti bayar ke pengantar bisa diunggah saat pesanan sedang dikirim.');
        $r->validate(['proof' => 'required|image|max:3072'], ['proof.required' => 'Pilih foto bukti pembayaran.', 'proof.image' => 'Bukti harus berupa gambar.', 'proof.max' => 'Ukuran maksimal 3 MB.']);
        $order->payment()->update(['delivery_proof' => $r->file('proof')->store('delivery-proofs', 'public')]);
        return response()->json($order->fresh(['items', 'payment', 'user'])->toApi());
    }

    public function checkout(Request $r)
    {
        $data = $r->validate([
            'phone' => ['required', 'regex:/^[0-9+]{9,15}$/'],
            'address' => 'required|string|min:10|max:500',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'payment_method' => ['required', Rule::in(['Transfer Bank', 'QRIS', 'COD (Bayar di Tempat)'])],
            // Transfer Bank & QRIS wajib bukti bayar; COD tidak perlu.
            'proof' => ['nullable', 'required_unless:payment_method,COD (Bayar di Tempat)', 'image', 'max:3072'],
        ], [
            'proof.required_unless' => 'Bukti pembayaran wajib diunggah.',
            'proof.image' => 'Bukti pembayaran harus berupa gambar.',
            'proof.max' => 'Ukuran bukti pembayaran maksimal 3 MB.',
        ]);
        $proofPath = $r->hasFile('proof') && $data['payment_method'] !== 'COD (Bayar di Tempat)'
            ? $r->file('proof')->store('proofs', 'public') : null;

        $order = DB::transaction(function () use ($r, $data, $proofPath) {
            $cart = Cart::with('items')->where('user_id', $r->user()->id)->first();
            abort_if(! $cart || $cart->items->isEmpty(), 422, 'Keranjang kosong.');

            $total = 0;
            $lines = [];
            foreach ($cart->items as $ci) {
                $size = ProductSize::with('product')->lockForUpdate()->find($ci->product_size_id);
                abort_if(! $size || ! $size->product->is_active, 422, 'Ada produk yang sudah tidak tersedia.');
                abort_if($size->stock < $ci->qty, 422, "Stok {$size->product->name} {$size->label} tidak cukup.");
                $size->decrement('stock', $ci->qty);
                $sub = $size->price * $ci->qty;
                $total += $sub;
                $lines[] = [
                    'product_size_id' => $size->id, 'product_name' => $size->product->name, 'size_label' => $size->label,
                    'flavor' => $ci->flavor, 'qty' => $ci->qty, 'price' => $size->price, 'subtotal' => $sub,
                ];
            }

            $order = Order::create([
                'code' => 'TMP', 'user_id' => $r->user()->id, 'phone' => $data['phone'],
                'address' => $data['address'], 'latitude' => $data['latitude'] ?? null, 'longitude' => $data['longitude'] ?? null, 'status' => 'Pending', 'total' => $total,
            ]);
            $order->update(['code' => 'A3-' . str_pad((string) $order->id, 4, '0', STR_PAD_LEFT)]);
            $order->items()->createMany($lines);
            $order->payment()->create(['method' => $data['payment_method'], 'amount' => $total, 'status' => 'Belum Dibayar', 'proof' => $proofPath]);
            $cart->items()->delete();
            return $order;
        });

        return response()->json($order->load(['items', 'payment', 'user'])->toApi(), 201);
    }
}
