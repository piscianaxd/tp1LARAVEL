<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SongSavedDb;

class SongSavedDbSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Crea 100 canciones de prueba
        SongSavedDb::factory()->count(100)->create();
    }
}