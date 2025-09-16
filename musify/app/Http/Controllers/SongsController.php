<?php

namespace App\Http\Controllers;

use App\Models\SongSavedDB;
use Illuminate\Http\Request;

class SongsController extends Controller
{
    /**
     * Listar todas las canciones guardadas
     */
    public function index()
    {
        $songs = SongSavedDB::all();

        return response()->json(
            [
                'status' => 'success',
                'count'  => $songs->count(),
                'songs'  => $songs
            ],
            200,
            [],
            JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE
        );
    }

    /**
     * Guardar una nueva canción en la base de datos
     */
    public function store(Request $request)
    {
        $data = SongSavedDB::create([
            'url_song'      => $request->url_song,
            'name_song'     => $request->name_song,
            'genre_song'    => $request->genre_song,
            'artist_song'   => $request->artist_song,
            'album_song'    => $request->album_song,
            'art_work_song' => $request->art_work_song
        ]);

        return response()->json(
            [
                'status'  => 'success',
                'message' => 'Canción guardada correctamente.',
                'song'    => [
                    'id'            => $data->id,
                    'url_song'      => $data->url_song,
                    'name_song'     => $data->name_song,
                    'genre_song'    => $data->genre_song,
                    'artist_song'   => $data->artist_song,
                    'album_song'    => $data->album_song,
                    'art_work_song' => $data->art_work_song,
                    'created_at'    => $data->created_at,
                    'updated_at'    => $data->updated_at,
                ]
            ],
            201,
            [],
            JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE
        );
    }
}
