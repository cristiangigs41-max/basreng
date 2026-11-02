<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    public const FLAVORS = ['Original', 'Original Daun Jeruk', 'Pedas', 'Pedas Daun Jeruk'];
    // ukuran standar toko
    public const DEFAULT_SIZES = [['Pack 5K', 5000], ['Pack 10K', 10000], ['1/2 Kg', 45000], ['1 Kg', 90000]];

    protected $fillable = ['category_id', 'name', 'description', 'image', 'is_active'];
    protected $casts = ['is_active' => 'boolean'];

    public function category(): BelongsTo { return $this->belongsTo(Category::class); }
    public function sizes(): HasMany { return $this->hasMany(ProductSize::class); }
}
