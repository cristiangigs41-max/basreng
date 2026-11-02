<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CartItem extends Model
{
    protected $fillable = ['cart_id', 'product_size_id', 'flavor', 'qty'];
    public function cart(): BelongsTo { return $this->belongsTo(Cart::class); }
    public function size(): BelongsTo { return $this->belongsTo(ProductSize::class, 'product_size_id'); }
}
