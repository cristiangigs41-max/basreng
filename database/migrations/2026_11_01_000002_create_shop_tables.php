<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('categories', function (Blueprint $t) {
            $t->id();
            $t->string('name');
            $t->string('slug')->unique();
            $t->timestamps();
        });
        Schema::create('products', function (Blueprint $t) {
            $t->id();
            $t->foreignId('category_id')->constrained()->cascadeOnDelete();
            $t->string('name');
            $t->text('description')->nullable();
            $t->string('image')->nullable();
            $t->boolean('is_active')->default(true);
            $t->timestamps();
        });
        // ukuran/harga/stok per produk: Pack 5K, Pack 10K, 1/2 Kg, 1 Kg
        Schema::create('product_sizes', function (Blueprint $t) {
            $t->id();
            $t->foreignId('product_id')->constrained()->cascadeOnDelete();
            $t->string('label', 30);
            $t->unsignedInteger('price');
            $t->unsignedInteger('stock')->default(0);
            $t->timestamps();
        });
        Schema::create('carts', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $t->timestamps();
        });
        Schema::create('cart_items', function (Blueprint $t) {
            $t->id();
            $t->foreignId('cart_id')->constrained()->cascadeOnDelete();
            $t->foreignId('product_size_id')->constrained()->cascadeOnDelete();
            $t->string('flavor', 40);
            $t->unsignedInteger('qty')->default(1);
            $t->timestamps();
            $t->unique(['cart_id', 'product_size_id', 'flavor']);
        });
        Schema::create('orders', function (Blueprint $t) {
            $t->id();
            $t->string('code', 20)->unique();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->string('phone', 20);
            $t->text('address');
            $t->enum('status', ['Pending', 'Diproses', 'Dikirim', 'Selesai', 'Dibatalkan'])->default('Pending');
            $t->unsignedBigInteger('total');
            $t->timestamps();
        });
        Schema::create('order_items', function (Blueprint $t) {
            $t->id();
            $t->foreignId('order_id')->constrained()->cascadeOnDelete();
            $t->foreignId('product_size_id')->nullable()->constrained()->nullOnDelete();
            $t->string('product_name');
            $t->string('size_label', 30);
            $t->string('flavor', 40);
            $t->unsignedInteger('qty');
            $t->unsignedInteger('price');
            $t->unsignedBigInteger('subtotal');
            $t->timestamps();
        });
        Schema::create('payments', function (Blueprint $t) {
            $t->id();
            $t->foreignId('order_id')->unique()->constrained()->cascadeOnDelete();
            $t->string('method', 40);
            $t->unsignedBigInteger('amount');
            $t->enum('status', ['Belum Dibayar', 'Dibayar'])->default('Belum Dibayar');
            $t->timestamp('paid_at')->nullable();
            $t->timestamps();
        });
    }
    public function down(): void {
        foreach (['payments', 'order_items', 'orders', 'cart_items', 'carts', 'product_sizes', 'products', 'categories'] as $t) {
            Schema::dropIfExists($t);
        }
    }
};
