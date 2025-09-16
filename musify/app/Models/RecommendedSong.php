<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RecommendedSong extends Model
{
    use HasFactory;
    
    protected $fillable = ['user_id', 'rock', 'pop', 'tropical', 'blues', 'rap'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}


/*
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RecommendedSong extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'songs_saved_db_id'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function song()
    {
        return $this->belongsTo(SongSavedDb::class, 'songs_saved_db_id');
    }
}
*/