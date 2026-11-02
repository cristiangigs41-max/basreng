<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Order extends Model
{
    public const STATUSES = ['Pending', 'Diproses', 'Dikirim', 'Selesai', 'Dibatalkan'];
    protected $fillable = ['code', 'user_id', 'phone', 'address', 'latitude', 'longitude', 'status', 'total'];

    // Alur status: Pending -> Diproses -> Dikirim -> Selesai (Dibatalkan boleh sebelum Selesai)
    public const NEXT = ['Pending' => 'Diproses', 'Diproses' => 'Dikirim', 'Dikirim' => 'Selesai'];
    public function isCod(): bool { return $this->payment?->method === 'COD (Bayar di Tempat)'; }

    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function items(): HasMany { return $this->hasMany(OrderItem::class); }
    public function payment(): HasOne { return $this->hasOne(Payment::class); }

    public function toApi(): array
    {
        return [
            'id' => $this->id, 'code' => $this->code, 'status' => $this->status, 'total' => (int) $this->total,
            'latitude' => $this->latitude !== null ? (float) $this->latitude : null, 'longitude' => $this->longitude !== null ? (float) $this->longitude : null, 'phone' => $this->phone, 'address' => $this->address, 'created_at' => $this->created_at?->toIso8601String(),
            'customer' => $this->user?->name, 'customer_id' => $this->user_id,
            'payment_method' => $this->payment?->method, 'payment_status' => $this->payment?->status, 'proof' => $this->payment?->proof, 'delivery_proof' => $this->payment?->delivery_proof,
            'items' => $this->items->map(fn ($i) => [
                'product_name' => $i->product_name, 'size_label' => $i->size_label, 'flavor' => $i->flavor,
                'qty' => $i->qty, 'price' => $i->price, 'subtotal' => (int) $i->subtotal,
            ])->values(),
        ];
    }
}
