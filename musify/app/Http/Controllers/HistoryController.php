<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Historial;
use App\Models\songSaveDB;
use Illuminate\Database\QueryException;

class HistoryController extends Controller
{
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'song_id' => 'required|integer|exists:songs_saved_db,id',
            ]);

            $user = Auth::user();

            if (! $user) {
                return response()->json([
                    'error' => 'Usuario no autenticado.'
                ], 401);
            }

            $historial = Historial::create([
                'user_id' => $user->id,
                'songs_saved_db_id' => $validated['song_id'],
            ]);

            $song = songSavedDB::find($validated['song_id']);

            return response()->json([
                'message' => 'Canción guardada en el historial correctamente.',
                'historial' => $historial,
                'song' => $song,
            ], 201, [], JSON_PRETTY_PRINT);

        } catch (QueryException $e) {
            return response()->json([
                'error' => 'Error al guardar en la base de datos.',
                'details' => $e->getMessage()
            ], 500);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Ocurrió un error inesperado.',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    public function index()
{
    try {
        $user = Auth::user();

        if (! $user) {
            return response()->json([
                'error' => 'Usuario no autenticado.'
            ], 401);
        }

        $historial = Historial::with('song')
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        $data = $historial->map(function ($item) {
            return [
                'historial_id' => $item->id,
                'fecha' => $item->created_at->format('Y-m-d H:i:s'),
                'cancion' => [
                    'id' => $item->song->id,
                    'nombre' => $item->song->name_song,
                    'artista' => $item->song->artist_song,
                    'genero' => $item->song->genre_song,
                    'album' => $item->song->album_song,
                    'url' => $item->song->url_song,
                    'artwork' => $item->song->art_work_song,
                ]
            ];
        });

        return response()->json([
            'message' => 'Historial obtenido correctamente.',
            'data' => $data
        ], 200, [], JSON_PRETTY_PRINT);

    } catch (\Exception $e) {
        return response()->json([
            'error' => 'Error al obtener el historial.',
            'details' => $e->getMessage()
        ], 500);
    }
}
}