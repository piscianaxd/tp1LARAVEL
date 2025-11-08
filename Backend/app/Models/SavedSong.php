<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SavedSong extends Model
{
    use HasFactory;

    protected $fillable = ['songs_saved_db_id', 'playlist_id'];

    public function playlist()
    {
        return $this->belongsTo(Playlist::class);
    }

    public function song()
    {
        return $this->belongsTo(SongSavedDb::class, 'songs_saved_db_id');
    }
}

