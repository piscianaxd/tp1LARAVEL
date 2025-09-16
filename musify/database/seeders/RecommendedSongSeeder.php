<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\RecommendedSong;

class RecommendedSongSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Crea 50 recomendaciones de canciones
        RecommendedSong::factory()->count(50)->create();
    }
}