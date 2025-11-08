<?php

namespace Database\Factories;

use App\Models\Historial;
use App\Models\User;
use App\Models\SongSavedDb;
use Illuminate\Database\Eloquent\Factories\Factory;

class HistorialFactory extends Factory
{
    /**
     * El nombre del modelo al que corresponde la fábrica.
     *
     * @var string
     */
    protected $model = Historial::class;

    /**
     * Define el estado por defecto del modelo.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'songs_saved_db_id' => SongSavedDb::factory(),
        ];
    }
}