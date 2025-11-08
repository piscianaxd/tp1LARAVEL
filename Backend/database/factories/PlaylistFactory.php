<?php

namespace Database\Factories;

use App\Models\Playlist;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class PlaylistFactory extends Factory
{
    /**
     * El nombre del modelo al que corresponde la fábrica.
     *
     * @var string
     */
    protected $model = Playlist::class;

    /**
     * Define el estado por defecto del modelo.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'is_public' => $this->faker->boolean(),
            'user_id' => User::factory(), // Esto creará un usuario nuevo y lo asignará a la playlist
            'name_playlist' => $this->faker->sentence(3),
        ];
    }
}