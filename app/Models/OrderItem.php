<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    protected $fillable = ['order_id', 'product_size_id', 'product_name', 'size_label', 'flavor', 'qty', 'price', 'subtotal'];
    public function order(): BelongsTo { return $this->belongsTo(Order::class); }
}
