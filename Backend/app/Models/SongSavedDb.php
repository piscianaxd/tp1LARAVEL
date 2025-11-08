<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SongSavedDb extends Model
{
    use HasFactory;

    protected $table = 'songs_saved_db';

    protected $fillable = [
        'url_song',
        'name_song',
        'genre_song',
        'artist_song',
        'album_song',
        'art_work_song'
    ];

    public function savedSongs()
    {
        return $this->hasMany(SavedSong::class);
    }

    public function historial()
    {
        return $this->hasMany(Historial::class);
    }

    public function playlists()
    {
        return $this->belongsToMany(Playlist::class, 'saved_songs');
    }
}
