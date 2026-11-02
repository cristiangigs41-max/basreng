# Backend Basreng Ibu A3 (Laravel 12 + MySQL)

Folder ini berisi KODE APLIKASI saja (migration, model, controller, route, seeder).
Skeleton Laravel dibuat sendiri, lalu file di folder ini ditimpa/ditambahkan.

## Langkah (butuh PHP 8.2+, Composer, MySQL)

1. Buat project Laravel baru:
   composer create-project laravel/laravel basreng-laravel
2. Salin SEMUA isi folder ini (app, database, routes) ke dalam basreng-laravel (pilih "replace" bila ditanya).
3. Masuk folder, pasang Sanctum + file routes/api:
   cd basreng-laravel
   php artisan install:api      (jawab "no" bila ditanya migrasi dijalankan)
4. Buat database MySQL `basreng_ibu_a3`, lalu ubah blok DB_ di .env sesuai env.mysql.txt
5. Jalankan:
   php artisan migrate --seed
   php artisan storage:link
   php artisan serve            (API di http://localhost:8000/api)

### Alternatif tanpa migrate
Import database/sql/basreng_ibu_a3.sql (phpMyAdmin / mysql CLI), lalu LEWATI `migrate`.
Tetap jalankan langkah 1-4 dan `php artisan serve`.

Akun admin: admin@basrengibua3.com / admin123 (ganti sebelum dipakai sungguhan).
