<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    protected $fillable = ['order_id', 'method', 'amount', 'status', 'paid_at', 'proof', 'delivery_proof'];
    protected $casts = ['paid_at' => 'datetime'];
    public function order(): BelongsTo { return $this->belongsTo(Order::class); }
}
