<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\SongSavedDb;

class SongSavedDbFactory extends Factory
{
    /**
     * El nombre del modelo al que corresponde la fábrica.
     *
     * @var string
     */
    protected $model = SongSavedDb::class;

    /**
     * Define el estado por defecto del modelo.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $genres = ['Rock', 'Pop', 'Tropical', 'Blues', 'Rap', 'Classical', 'Jazz', 'Electronic'];

        return [
            'url_song' => $this->faker->url(),
            'name_song' => $this->faker->words(3, true),
            'genre_song' => $this->faker->randomElement($genres),
            'artist_song' => $this->faker->name(),
            'album_song' => $this->faker->words(2, true),
            'art_work_song' => $this->faker->imageUrl(),
        ];
    }
}