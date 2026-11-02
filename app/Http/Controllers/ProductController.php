<?php
namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;

class ProductController extends Controller
{
    // Publik: pengunjung boleh melihat produk
    public function index()
    {
        $products = Product::with(['category', 'sizes' => fn ($q) => $q->orderBy('price')])->orderBy('id')->get();
        return response()->json([
            'flavors' => Product::FLAVORS,
            'categories' => Category::orderBy('name')->get(['id', 'name', 'slug']),
            'products' => $products->map(fn ($p) => [
                'id' => $p->id, 'name' => $p->name, 'description' => $p->description, 'is_active' => $p->is_active,
                'category_id' => $p->category_id, 'category' => $p->category?->slug,
                'sizes' => $p->sizes->map(fn ($s) => ['id' => $s->id, 'label' => $s->label, 'price' => $s->price, 'stock' => $s->stock]),
            ]),
        ]);
    }
}
