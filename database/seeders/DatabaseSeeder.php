<?php
namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Akun admin dibuat dari seeder (tidak ada registrasi admin dari halaman publik)
        User::updateOrCreate(['email' => 'admin@basrengibua3.com'], [
            'name' => 'Admin Ibu A3', 'phone' => '085267567133', 'role' => 'admin', 'password' => 'admin123',
        ]);

        $items = [
            ['Basreng', 'Basreng Balok', 'Basreng potongan balok panjang, renyah di luar, gurih sampai ke dalam. Digoreng kering dan dibumbui.', '/media/foto-1.jpg'],
            ['Basreng', 'Basreng Bulat', 'Basreng irisan bulat tipis, garing, mudah dikunyah dan cocok untuk semua umur.', '/media/foto-2.jpg'],
            ['Pangsit', 'Keripik Pangsit', 'Keripik pangsit garing dengan bumbu gurih. Teman ngemil paling pas.', '/media/pangsit-1.jpg'],
        ];
        foreach ($items as [$cat, $name, $desc, $img]) {
            $c = Category::firstOrCreate(['slug' => \Illuminate\Support\Str::slug($cat)], ['name' => $cat]);
            $p = Product::firstOrCreate(['name' => $name], ['category_id' => $c->id, 'description' => $desc, 'image' => $img, 'is_active' => true]);
            if ($p->sizes()->count() === 0) {
                foreach (Product::DEFAULT_SIZES as [$label, $price]) {
                    $p->sizes()->create(['label' => $label, 'price' => $price, 'stock' => 100]);
                }
            }
        }
    }
}
