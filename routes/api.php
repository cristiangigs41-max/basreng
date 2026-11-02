<?php
use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ProductController;
use App\Http\Middleware\AdminOnly;
use Illuminate\Support\Facades\Route;

// Publik
Route::get('/products', [ProductController::class, 'index']);
Route::post('/chat', [ChatController::class, 'chat'])->middleware('throttle:20,1');
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Wajib login
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/me', [AuthController::class, 'update']);

    Route::get('/cart', [CartController::class, 'show']);
    Route::post('/cart', [CartController::class, 'add']);
    Route::patch('/cart/{item}', [CartController::class, 'update']);
    Route::delete('/cart/{item}', [CartController::class, 'destroy']);

    Route::get('/orders', [OrderController::class, 'index']);
    Route::post('/checkout', [OrderController::class, 'checkout']);
    Route::post('/orders/{order}/delivery-proof', [OrderController::class, 'deliveryProof']);

    // Khusus admin
    Route::prefix('admin')->middleware(AdminOnly::class)->group(function () {
        Route::get('/stats', [AdminController::class, 'stats']);
        Route::get('/orders', [AdminController::class, 'orders']);
        Route::patch('/orders/{order}/status', [AdminController::class, 'setStatus']);
        Route::get('/customers', [AdminController::class, 'customers']);
        Route::get('/report', [AdminController::class, 'report']);
        Route::get('/categories', [AdminController::class, 'categories']);
        Route::post('/categories', [AdminController::class, 'storeCategory']);
        Route::put('/categories/{category}', [AdminController::class, 'updateCategory']);
        Route::delete('/categories/{category}', [AdminController::class, 'destroyCategory']);
        Route::post('/products', [AdminController::class, 'storeProduct']);
        Route::post('/products/{product}', [AdminController::class, 'updateProduct']); // POST agar bisa upload foto
        Route::delete('/products/{product}', [AdminController::class, 'destroyProduct']);
        Route::put('/sizes/{size}', [AdminController::class, 'updateSize']);
    });
});
