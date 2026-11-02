<?php
namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\ProductSize;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CartController extends Controller
{
    public function show(Request $r) { return response()->json($this->payload($r)); }

    public function add(Request $r)
    {
        $data = $r->validate([
            'product_size_id' => 'required|integer|exists:product_sizes,id',
            'flavor' => ['required', Rule::in(Product::FLAVORS)],
            'qty' => 'required|integer|min:1|max:99',
        ]);
        $size = ProductSize::with('product')->findOrFail($data['product_size_id']);
        abort_unless($size->product->is_active, 422, 'Produk tidak tersedia.');
        $cart = Cart::firstOrCreate(['user_id' => $r->user()->id]);
        $item = CartItem::firstOrNew(['cart_id' => $cart->id, 'product_size_id' => $size->id, 'flavor' => $data['flavor']]);
        $item->qty = min(($item->qty ?? 0) + $data['qty'], 99);
        if ($item->qty > $size->stock) abort(422, 'Stok tidak cukup.');
        $item->save();
        return response()->json($this->payload($r), 201);
    }

    public function update(Request $r, CartItem $item)
    {
        $this->own($r, $item);
        $data = $r->validate(['qty' => 'required|integer|min:1|max:99']);
        if ($data['qty'] > $item->size->stock) abort(422, 'Stok tidak cukup.');
        $item->update($data);
        return response()->json($this->payload($r));
    }

    public function destroy(Request $r, CartItem $item)
    {
        $this->own($r, $item);
        $item->delete();
        return response()->json($this->payload($r));
    }

    private function own(Request $r, CartItem $item): void
    {
        abort_unless($item->cart->user_id === $r->user()->id, 403);
    }

    // Harga selalu dari database, bukan dari browser.
    public function payload(Request $r): array
    {
        $cart = Cart::with('items.size.product')->where('user_id', $r->user()->id)->first();
        $items = ($cart?->items ?? collect())->map(fn ($i) => [
            'id' => $i->id, 'product_size_id' => $i->product_size_id, 'flavor' => $i->flavor, 'qty' => $i->qty,
            'product_name' => $i->size->product->name, 'size_label' => $i->size->label,
            'price' => $i->size->price, 'stock' => $i->size->stock, 'subtotal' => $i->size->price * $i->qty,
        ])->values();
        return ['items' => $items, 'total' => $items->sum('subtotal'), 'count' => $items->sum('qty')];
    }
}
