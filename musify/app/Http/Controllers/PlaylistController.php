<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Playlist;
use App\Models\SavedSong;
use App\Models\SongSavedDb;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class PlaylistController extends Controller
{
    public function index(Request $request)
    {
        Log::info('🎵 ========== PLAYLIST INDEX START ==========');
        Log::info('🎵 User:', ['user' => $request->user()]);
        Log::info('🎵 User ID:', ['user_id' => $request->user()?->id]);

        try {
            $userId = $request->user()?->id ?? 1;
            Log::info('🎵 Using user ID:', ['user_id' => $userId]);

            $playlists = Playlist::where('user_id', $userId)
                ->with(['songs.song']) // Cargar canciones a través de la relación
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

        DB::beginTransaction();

        try {
            $userId = $request->user()?->id ?? 1;
            Log::info('🎵 Using user ID for creation:', ['user_id' => $userId]);

            $validator = Validator::make($request->all(), [
                'name_playlist' => 'required|string|max:255',
                'is_public' => 'required|boolean',
                'songs' => 'sometimes|array',
                'songs.*.id' => 'sometimes|integer',
                'songs.*.name_song' => 'sometimes|string',
                'songs.*.artist_song' => 'sometimes|string',
                'songs.*.album_song' => 'sometimes|string',
                'songs.*.art_work_song' => 'sometimes|string',
                'songs.*.genre_song' => 'sometimes|string',
                'songs.*.url_song' => 'sometimes|string',
            ]);

            if ($validator->fails()) {
                Log::warning('🎵 Validation failed:', $validator->errors()->toArray());
                return response()->json($validator->errors(), 422);
            }

            Log::info('🎵 Validation passed');

            // Crear la playlist
            $playlist = Playlist::create([
                'name_playlist' => $request->name_playlist,
                'is_public' => $request->is_public,
                'user_id' => $userId
            ]);

            Log::info('🎵 Playlist created successfully:', ['playlist_id' => $playlist->id]);

            // Guardar las canciones si vienen en el request
            if ($request->has('songs') && is_array($request->songs)) {
                $savedSongsCount = 0;
                
                foreach ($request->songs as $songData) {
                    // Buscar si la canción ya existe en songs_saved_db
                    $songSavedDb = SongSavedDb::where('name_song', $songData['name_song'])
                        ->where('artist_song', $songData['artist_song'])
                        ->first();

                    // Si no existe, crearla
                    if (!$songSavedDb) {
                        $songSavedDb = SongSavedDb::create([
                            'name_song' => $songData['name_song'] ?? '',
                            'artist_song' => $songData['artist_song'] ?? '',
                            'album_song' => $songData['album_song'] ?? '',
                            'art_work_song' => $songData['art_work_song'] ?? '',
                            'genre_song' => $songData['genre_song'] ?? '',
                            'url_song' => $songData['url_song'] ?? '',
                        ]);
                        Log::info('🎵 New song created in songs_saved_db:', ['song_id' => $songSavedDb->id]);
                    }

                    // Crear la relación en saved_songs
                    SavedSong::create([
                        'playlist_id' => $playlist->id,
                        'songs_saved_db_id' => $songSavedDb->id
                    ]);

                    $savedSongsCount++;
                    Log::info('🎵 Song added to playlist:', [
                        'playlist_id' => $playlist->id,
                        'song_id' => $songSavedDb->id,
                        'song_name' => $songData['name_song'] ?? 'Unknown'
                    ]);
                }
                
                Log::info('🎵 Total songs saved to playlist:', ['count' => $savedSongsCount]);
            } else {
                Log::info('🎵 No songs provided for playlist');
            }

            // Confirmar transacción
            DB::commit();

            // Cargar la playlist con las canciones para la respuesta
            $playlist->load(['songs.song']);

            Log::info('🎵 ========== PLAYLIST STORE END ==========');

            return response()->json([
                'message' => 'Playlist creada exitosamente',
                'playlist' => $playlist
            ], 201);

        } catch (\Exception $e) {
            // Revertir transacción en caso de error
            DB::rollBack();
            
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

        DB::beginTransaction();

        try {
            $userId = $request->user()?->id ?? 1;
            
            $playlist = Playlist::where('id', $id)
                ->where('user_id', $userId)
                ->firstOrFail();

            // Eliminar las relaciones en saved_songs
            SavedSong::where('playlist_id', $playlist->id)->delete();

            // Eliminar la playlist
            $playlist->delete();

            DB::commit();

            Log::info('🎵 Playlist deleted successfully');
            Log::info('🎵 ========== PLAYLIST DESTROY END ==========');

            return response()->json([
                'message' => 'Playlist eliminada exitosamente'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('🎵 PLAYLIST DESTROY ERROR:', [
                'message' => $e->getMessage(),
                'playlist_id' => $id
            ]);
            return response()->json(['error' => 'Error eliminando playlist'], 500);
        }
    }

    /**
     * Agregar canciones a una playlist existente
     */
    public function addSongs(Request $request, $playlistId)
    {
        Log::info('🎵 ========== ADD SONGS TO PLAYLIST START ==========');
        Log::info('🎵 Adding songs to playlist:', ['playlist_id' => $playlistId]);

        DB::beginTransaction();

        try {
            $userId = $request->user()?->id ?? 1;
            
            // Verificar que la playlist pertenece al usuario
            $playlist = Playlist::where('id', $playlistId)
                ->where('user_id', $userId)
                ->firstOrFail();

            $validator = Validator::make($request->all(), [
                'songs' => 'required|array',
                'songs.*.id' => 'sometimes|integer',
                'songs.*.name_song' => 'required|string',
                'songs.*.artist_song' => 'required|string',
                'songs.*.album_song' => 'sometimes|string',
                'songs.*.art_work_song' => 'sometimes|string',
                'songs.*.genre_song' => 'sometimes|string',
                'songs.*.url_song' => 'sometimes|string',
            ]);

            if ($validator->fails()) {
                return response()->json($validator->errors(), 422);
            }

            $addedSongsCount = 0;

            foreach ($request->songs as $songData) {
                // Buscar si la canción ya existe en songs_saved_db
                $songSavedDb = SongSavedDb::where('name_song', $songData['name_song'])
                    ->where('artist_song', $songData['artist_song'])
                    ->first();

                // Si no existe, crearla
                if (!$songSavedDb) {
                    $songSavedDb = SongSavedDb::create([
                        'name_song' => $songData['name_song'],
                        'artist_song' => $songData['artist_song'],
                        'album_song' => $songData['album_song'] ?? '',
                        'art_work_song' => $songData['art_work_song'] ?? '',
                        'genre_song' => $songData['genre_song'] ?? '',
                        'url_song' => $songData['url_song'] ?? '',
                    ]);
                }

                // Verificar si la canción ya está en la playlist
                $existingSong = SavedSong::where('playlist_id', $playlist->id)
                    ->where('songs_saved_db_id', $songSavedDb->id)
                    ->first();

                if (!$existingSong) {
                    // Crear la relación en saved_songs
                    SavedSong::create([
                        'playlist_id' => $playlist->id,
                        'songs_saved_db_id' => $songSavedDb->id
                    ]);

                    $addedSongsCount++;
                }
            }

            DB::commit();

            Log::info('🎵 Songs added to playlist:', ['count' => $addedSongsCount]);
            Log::info('🎵 ========== ADD SONGS TO PLAYLIST END ==========');

            return response()->json([
                'message' => 'Canciones agregadas exitosamente',
                'added_count' => $addedSongsCount
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('🎵 ADD SONGS ERROR:', [
                'message' => $e->getMessage(),
                'playlist_id' => $playlistId
            ]);
            return response()->json(['error' => 'Error agregando canciones'], 500);
        }
    }
}