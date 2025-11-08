<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Historial extends Model
{
    use HasFactory;

    /**
     *
     * @var string
     */
    protected $table = 'historial_songs';

    /**
     * Los atributos que se pueden asignar masivamente.
     *
     * @var array
     */
    protected $fillable = ['user_id', 'songs_saved_db_id'];

    /**
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }


    public function song()
    {
        return $this->belongsTo(SongSavedDb::class, 'songs_saved_db_id');
}

    /**
     * Un historial pertenece a una canción guardada en la base de datos.
     */
    public function songSavedDb()
    {
        return $this->belongsTo(SongSavedDb::class);
    }
}