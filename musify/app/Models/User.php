<?php

namespace App\Models;

// Importaciones necesarias para el modelo de usuario.
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens; // Usamos este trait para la autenticación con Sanctum

class User extends Authenticatable
{
    // Usamos los traits de fábrica y de tokens de API.
    use HasFactory, HasApiTokens;

    // Los atributos que se pueden asignar masivamente.
    protected $fillable = ['is_admin', 'name', 'email', 'password'];

    // Relaciones del modelo.

    /**
     * Un usuario puede tener muchas listas de reproducción.
     */
    public function playlists()
    {
        return $this->hasMany(Playlist::class);
    }

    /**
     * Un usuario puede tener varias recomendaciones de canciones.
     */
    public function recommendedSongs()
    {
        return $this->hasMany(RecommendedSong::class);
    }

    /**
     * Un usuario puede tener varios registros de historial.
     */
    public function historial()
    {
        return $this->hasMany(Historial::class);
    }
}
