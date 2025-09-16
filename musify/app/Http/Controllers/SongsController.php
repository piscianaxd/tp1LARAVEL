<?php

namespace App\Http\Controllers;

use App\Models\SongSavedDB;

use Illuminate\Http\Request;

class SongsController extends Controller
{
    public function getSongs () {
        //retornar todas las canciones tipo lista que hayan en SongsSaveDB
        $songs = SongSavedDB::all();
        return response()->json($songs,200);
    }  
    public function postSongs (Request $request) {
        $data = SongSavedDB::create(
            [
                'url_song' => $request->url_song,
                'name_song'=> $request->name_song,
                'genre_song' => $request->genre_song,
                'artist_song' => $request->artist_song,
                'album_song' => $request->album_song,
                'art_work_song' => $request->art_work_song
            ]
            );
            return response()->json($data,201);
    }   
}
