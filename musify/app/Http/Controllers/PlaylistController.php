<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Playlist;
use App\Models\SavedSong;
use Illuminate\Support\Facades\Validator;

class PlaylistController extends Controller
{
    /**
     * Listar todas las playlists del usuario autenticado
     */
    public function index(Request $request)
    {
        $playlists = Playlist::where('user_id', $request->user()->id)
            ->with('songs') // eager load canciones
            ->get();

        return response()->json($playlists);
    }

    /**
     * Crear una nueva playlist
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name_playlist' => 'required|string|max:255',
            'is_public' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $playlist = Playlist::create([
            'name_playlist' => $request->name_playlist,
            'is_public' => $request->is_public,
            'user_id' => $request->user()->id
        ]);

        return response()->json([
            'message' => 'Playlist creada exitosamente',
            'playlist' => $playlist
        ], 201);
    }

    /**
     * Mostrar una playlist específica del usuario
     */
    public function show(Request $request, $id)
    {
        $playlist = Playlist::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->with('songs')
            ->firstOrFail();

        return response()->json($playlist);
    }

    /**
     * Actualizar una playlist del usuario
     */
    public function update(Request $request, $id)
    {
        $playlist = Playlist::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $validator = Validator::make($request->all(), [
            'name_playlist' => 'sometimes|string|max:255',
            'is_public' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        if ($request->has('name_playlist')) {
            $playlist->name_playlist = $request->name_playlist;
        }

        if ($request->has('is_public')) {
            $playlist->is_public = $request->is_public;
        }

        $playlist->save();

        return response()->json([
            'message' => 'Playlist actualizada exitosamente',
            'playlist' => $playlist
        ]);
    }

    /**
     * Eliminar una playlist del usuario
     */
    public function destroy(Request $request, $id)
    {
        $playlist = Playlist::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        // Eliminar canciones asociadas
        SavedSong::where('playlist_id', $playlist->id)->delete();

        $playlist->delete();

        return response()->json([
            'message' => 'Playlist eliminada exitosamente'
        ]);
    }
}
