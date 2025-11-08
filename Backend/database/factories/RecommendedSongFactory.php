<?php

namespace Database\Factories;

use App\Models\RecommendedSong;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class RecommendedSongFactory extends Factory
{
    /**
     * El nombre del modelo al que corresponde la fábrica.
     *
     * @var string
     */
    protected $model = RecommendedSong::class;

    /**
     * Define el estado por defecto del modelo.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'rock' => $this->faker->numberBetween(0, 10),
            'pop' => $this->faker->numberBetween(0, 10),
            'tropical' => $this->faker->numberBetween(0, 10),
            'blues' => $this->faker->numberBetween(0, 10),
            'rap' => $this->faker->numberBetween(0, 10),
        ];
    }
}