<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Playlist extends Model
{
    use HasFactory;

    protected $fillable = ['name_playlist', 'is_public', 'user_id'];

    // Relación con las canciones guardadas
    public function songs()
    {
        return $this->hasMany(SavedSong::class, 'playlist_id');
    }
}
    