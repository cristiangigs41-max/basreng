<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        // Bukti bayar pelanggan kepada pengantar (wajib untuk COD sebelum pesanan boleh Selesai)
        Schema::table('payments', fn (Blueprint $t) => $t->string('delivery_proof')->nullable()->after('proof'));
    }
    public function down(): void {
        Schema::table('payments', fn (Blueprint $t) => $t->dropColumn('delivery_proof'));
    }
};
