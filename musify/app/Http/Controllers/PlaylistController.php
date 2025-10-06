<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Playlist;
use App\Models\SavedSong;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class PlaylistController extends Controller
{
    public function index(Request $request)
    {
        Log::info('🎵 ========== PLAYLIST INDEX START ==========');
        Log::info('🎵 User:', ['user' => $request->user()]);
        Log::info('🎵 User ID:', ['user_id' => $request->user()?->id]);

        try {
            // TEMPORAL: Para pruebas sin autenticación
            $userId = $request->user()?->id ?? 1;
            
            Log::info('🎵 Using user ID:', ['user_id' => $userId]);

            $playlists = Playlist::where('user_id', $userId)
                ->with('songs')
                ->get();

            Log::info('🎵 Playlists retrieved:', ['count' => $playlists->count()]);
            Log::info('🎵 ========== PLAYLIST INDEX END ==========');
            
            return response()->json($playlists);
            
        } catch (\Exception $e) {
            Log::error('🎵 PLAYLIST INDEX ERROR:', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => 'Error retrieving playlists'], 500);
        }
    }

    public function store(Request $request)
    {
        Log::info('🎵 ========== PLAYLIST STORE START ==========');
        Log::info('🎵 Request data:', $request->all());
        Log::info('🎵 User:', ['user' => $request->user()]);
        Log::info('🎵 User ID:', ['user_id' => $request->user()?->id]);

        try {
            // TEMPORAL: Para pruebas sin autenticación
            $userId = $request->user()?->id ?? 1;
            
            Log::info('🎵 Using user ID for creation:', ['user_id' => $userId]);

            $validator = Validator::make($request->all(), [
                'name_playlist' => 'required|string|max:255',
                'is_public' => 'required|boolean',
            ]);

            if ($validator->fails()) {
                Log::warning('🎵 Validation failed:', $validator->errors()->toArray());
                return response()->json($validator->errors(), 422);
            }

            Log::info('🎵 Validation passed');

            // Verificar que la tabla existe y podemos crear
            Log::info('🎵 Creating playlist with data:', [
                'name_playlist' => $request->name_playlist,
                'is_public' => $request->is_public,
                'user_id' => $userId
            ]);

            $playlist = Playlist::create([
                'name_playlist' => $request->name_playlist,
                'is_public' => $request->is_public,
                'user_id' => $userId
            ]);

            Log::info('🎵 Playlist created successfully:', ['playlist_id' => $playlist->id]);
            Log::info('🎵 ========== PLAYLIST STORE END ==========');

            return response()->json([
                'message' => 'Playlist creada exitosamente',
                'playlist' => $playlist
            ], 201);

        } catch (\Exception $e) {
            Log::error('🎵 PLAYLIST STORE ERROR:', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'error' => 'Internal server error',
                'debug' => config('app.debug') ? $e->getMessage() : 'Contact administrator'
            ], 500);
        }
    }

    public function destroy(Request $request, $id)
    {
        Log::info('🎵 ========== PLAYLIST DESTROY START ==========');
        Log::info('🎵 Deleting playlist:', ['id' => $id, 'user_id' => $request->user()?->id]);

        try {
            // TEMPORAL: Para pruebas sin autenticación
            $userId = $request->user()?->id ?? 1;
            
            $playlist = Playlist::where('id', $id)
                ->where('user_id', $userId)
                ->firstOrFail();

            // Eliminar canciones asociadas
            SavedSong::where('playlist_id', $playlist->id)->delete();

            $playlist->delete();

            Log::info('🎵 Playlist deleted successfully');
            Log::info('🎵 ========== PLAYLIST DESTROY END ==========');

            return response()->json([
                'message' => 'Playlist eliminada exitosamente'
            ]);

        } catch (\Exception $e) {
            Log::error('🎵 PLAYLIST DESTROY ERROR:', [
                'message' => $e->getMessage(),
                'playlist_id' => $id
            ]);
            return response()->json(['error' => 'Error eliminando playlist'], 500);
        }
    }
}