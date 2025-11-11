<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Playlist;
use App\Models\SavedSong;
use App\Models\SongSavedDb;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class PlaylistController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/playlists",
     *     summary="Obtener todas las playlists del usuario",
     *     description="Retorna todas las playlists del usuario autenticado con sus canciones",
     *     operationId="getPlaylists",
     *     tags={"Playlists"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="Lista de playlists obtenida exitosamente",
     *         @OA\JsonContent(
     *             type="array",
     *             @OA\Items(
     *                 @OA\Property(property="id", type="integer", example=1),
     *                 @OA\Property(property="name_playlist", type="string", example="Mi Playlist Favorita"),
     *                 @OA\Property(property="is_public", type="boolean", example=true),
     *                 @OA\Property(property="user_id", type="integer", example=1),
     *                 @OA\Property(property="created_at", type="string", format="date-time"),
     *                 @OA\Property(property="updated_at", type="string", format="date-time"),
     *                 @OA\Property(
     *                     property="songs",
     *                     type="array",
     *                     @OA\Items(
     *                         @OA\Property(property="id", type="integer", example=1),
     *                         @OA\Property(property="playlist_id", type="integer", example=1),
     *                         @OA\Property(property="songs_saved_db_id", type="integer", example=1),
     *                         @OA\Property(
     *                             property="song",
     *                             @OA\Property(property="id", type="integer", example=1),
     *                             @OA\Property(property="name_song", type="string", example="Bohemian Rhapsody"),
     *                             @OA\Property(property="artist_song", type="string", example="Queen"),
     *                             @OA\Property(property="album_song", type="string", example="A Night at the Opera"),
     *                             @OA\Property(property="art_work_song", type="string", example="https://example.com/cover.jpg"),
     *                             @OA\Property(property="genre_song", type="string", example="Rock"),
     *                             @OA\Property(property="url_song", type="string", example="https://example.com/song.mp3")
     *                         )
     *                     )
     *                 )
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="No autenticado",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Unauthenticated")
     *         )
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Error del servidor",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Error retrieving playlists")
     *         )
     *     )
     * )
     */
    public function index(Request $request)
    {
        Log::info('🎵 ========== PLAYLIST INDEX START ==========');
        Log::info('🎵 User:', ['user' => $request->user()]);
        Log::info('🎵 User ID:', ['user_id' => $request->user()?->id]);

        try {
            $userId = $request->user()?->id ?? 1;
            Log::info('🎵 Using user ID:', ['user_id' => $userId]);

            $playlists = Playlist::where('user_id', $userId)
                ->with(['songs']) // Cargar canciones a través de la relación
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


 public function getPublicPlaylist(Request $request)
{
    try {
        $userId = $request->query('exclude_user_id');

        \Log::info('🎧 Iniciando getPublicPlaylist', ['exclude_user_id' => $userId]);

        $playlists = Playlist::where('is_public', true)
            ->where('user_id', '!=', $userId)
            ->with([
                'songs' => function ($q) {
                    $q->select(
                        'songs_saved_db.id as song_id',
                        'songs_saved_db.url_song',
                        'songs_saved_db.name_song',
                        'songs_saved_db.genre_song',
                        'songs_saved_db.artist_song',
                        'songs_saved_db.album_song',
                        'songs_saved_db.art_work_song'
                    );
                },
                'user:id,name'
            ])
            ->get(['id', 'name_playlist', 'is_public', 'user_id']);

        // ✅ Completar rutas absolutas de imágenes y audios
        $playlists->each(function ($pl) {
            $pl->cover = null;

            foreach ($pl->songs as $song) {
                // 🎨 Imagen de portada (art_work_song)
                if ($song->art_work_song && !str_starts_with($song->art_work_song, 'http')) {
                    $song->art_work_song = url($song->art_work_song);
                }

                // 🎧 Archivo de audio (url_song)
                if ($song->url_song && !str_starts_with($song->url_song, 'http')) {
                    $song->url_song = url($song->url_song);
                }

                // Asignar la portada general de la playlist
                if (!$pl->cover && $song->art_work_song) {
                    $pl->cover = $song->art_work_song;
                }
            }
        });

        return response()->json($playlists);

    } catch (\Throwable $e) {
        \Log::error('❌ Error en getPublicPlaylist', [
            'message' => $e->getMessage(),
            'trace'   => $e->getTraceAsString()
        ]);

        return response()->json([
            'error' => true,
            'message' => 'Error interno del servidor',
            'details' => $e->getMessage()
        ], 500);
    }
}







    /**
     * @OA\Post(
     *     path="/api/playlists",
     *     summary="Crear una nueva playlist",
     *     description="Crea una nueva playlist para el usuario autenticado",
     *     operationId="createPlaylist",
     *     tags={"Playlists"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         description="Datos de la playlist y canciones opcionales",
     *         @OA\JsonContent(
     *             required={"name_playlist","is_public"},
     *             @OA\Property(property="name_playlist", type="string", example="Mi Nueva Playlist", maxLength=255),
     *             @OA\Property(property="is_public", type="boolean", example=true),
     *             @OA\Property(
     *                 property="songs",
     *                 type="array",
     *                 description="Lista opcional de canciones para agregar a la playlist",
     *                 @OA\Items(
     *                     @OA\Property(property="id", type="integer", example=1, description="ID de la canción (opcional)"),
     *                     @OA\Property(property="name_song", type="string", example="Bohemian Rhapsody"),
     *                     @OA\Property(property="artist_song", type="string", example="Queen"),
     *                     @OA\Property(property="album_song", type="string", example="A Night at the Opera"),
     *                     @OA\Property(property="art_work_song", type="string", example="https://example.com/cover.jpg"),
     *                     @OA\Property(property="genre_song", type="string", example="Rock"),
     *                     @OA\Property(property="url_song", type="string", example="https://example.com/song.mp3")
     *                 )
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Playlist creada exitosamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Playlist creada exitosamente"),
     *             @OA\Property(
     *                 property="playlist",
     *                 type="object",
     *                 @OA\Property(property="id", type="integer", example=1),
     *                 @OA\Property(property="name_playlist", type="string", example="Mi Nueva Playlist"),
     *                 @OA\Property(property="is_public", type="boolean", example=true),
     *                 @OA\Property(property="user_id", type="integer", example=1),
     *                 @OA\Property(property="created_at", type="string", format="date-time"),
     *                 @OA\Property(property="updated_at", type="string", format="date-time"),
     *                 @OA\Property(
     *                     property="songs",
     *                     type="array",
     *                     @OA\Items()
     *                 )
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Error de validación",
     *         @OA\JsonContent(
     *             @OA\Property(property="name_playlist", type="array", @OA\Items(type="string", example="El campo name playlist es obligatorio."))
     *         )
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Error del servidor",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Internal server error")
     *         )
     *     )
     * )
     */
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

    /**
     * @OA\Delete(
     *     path="/api/playlists/{id}",
     *     summary="Eliminar una playlist",
     *     description="Elimina una playlist específica del usuario autenticado",
     *     operationId="deletePlaylist",
     *     tags={"Playlists"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID de la playlist a eliminar",
     *         @OA\Schema(type="integer", example=1)
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Playlist eliminada exitosamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Playlist eliminada exitosamente")
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Playlist no encontrada",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="No query results for model [App\\Models\\Playlist]")
     *         )
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Error del servidor",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Error eliminando playlist")
     *         )
     *     )
     * )
     */
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
     * @OA\Post(
     *     path="/api/playlists/{playlist}/songs",
     *     summary="Agregar una canción a una playlist",
     *     description="Agrega una canción específica a una playlist existente del usuario",
     *     operationId="addSongToPlaylist",
     *     tags={"Playlists"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="playlist",
     *         in="path",
     *         required=true,
     *         description="ID de la playlist a la que se agregará la canción",
     *         @OA\Schema(type="integer", example=1)
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         description="Datos de la canción a agregar",
     *         @OA\JsonContent(
     *             required={"song_id"},
     *             @OA\Property(property="song_id", type="integer", example=1, description="ID de la canción en songs_saved_db")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Canción agregada exitosamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Canción agregada exitosamente a la playlist"),
     *             @OA\Property(property="playlist", type="object"),
     *             @OA\Property(property="added_song", type="object")
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Playlist o canción no encontrada",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Playlist o canción no encontrada")
     *         )
     *     ),
     *     @OA\Response(
     *         response=409,
     *         description="La canción ya está en la playlist",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="La canción ya está en esta playlist")
     *         )
     *     ),
     *     @OA\Response(
     *         response=403,
     *         description="No tienes permiso para modificar esta playlist",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="No tienes permiso para modificar esta playlist")
     *         )
     *     )
     * )
     */
    public function addSong(Request $request, $playlistId)
{
    Log::info('🎵 ========== ADD SONG TO PLAYLIST START ==========');
    Log::info('🎵 Adding song to playlist:', ['playlist_id' => $playlistId]);
    Log::info('🎵 Request data:', $request->all());

    DB::beginTransaction();

    try {
        $userId = $request->user()?->id ?? 1;
        Log::info('👤 User ID detectado:', ['user_id' => $userId]);

        $validator = Validator::make($request->all(), [
            'song_id' => 'required|integer|exists:songs_saved_db,id'
        ]);

        if ($validator->fails()) {
            Log::warning('🎵 Validation failed:', $validator->errors()->toArray());
            return response()->json($validator->errors(), 422);
        }

        $playlist = Playlist::where('id', $playlistId)
            ->where('user_id', $userId)
            ->first();

        if (!$playlist) {
            return response()->json([
                'message' => 'Playlist no encontrada o no tienes permisos'
            ], 404);
        }

        $song = SongSavedDb::find($request->song_id);
        if (!$song) {
            return response()->json(['message' => 'Canción no encontrada'], 404);
        }

        $exists = SavedSong::where('playlist_id', $playlist->id)
            ->where('songs_saved_db_id', $song->id)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'La canción ya está en esta playlist'], 409);
        }

        SavedSong::create([
            'playlist_id' => $playlist->id,
            'songs_saved_db_id' => $song->id
        ]);

        DB::commit();

        $playlist->load('songs'); // ✅ corregido

        return response()->json([
            'message' => 'Canción agregada exitosamente a la playlist',
            'playlist' => $playlist,
            'added_song' => $song
        ], 200);

    } catch (\Exception $e) {
        DB::rollBack();

        Log::error('🎵 ADD SONG ERROR:', [
            'message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString()
        ]);

        return response()->json([
            'message' => 'Error al agregar la canción a la playlist',
            'error' => config('app.debug') ? $e->getMessage() : 'Contact administrator'
        ], 500);
    }
}



    /**
     * @OA\Post(
     *     path="/api/playlists/{playlistId}/songs",
     *     summary="Agregar canciones a una playlist existente",
     *     description="Agrega una o más canciones a una playlist existente del usuario",
     *     operationId="addSongsToPlaylist",
     *     tags={"Playlists"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="playlistId",
     *         in="path",
     *         required=true,
     *         description="ID de la playlist a la que se agregarán las canciones",
     *         @OA\Schema(type="integer", example=1)
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         description="Lista de canciones a agregar",
     *         @OA\JsonContent(
     *             required={"songs"},
     *             @OA\Property(
     *                 property="songs",
     *                 type="array",
     *                 @OA\Items(
     *                     required={"name_song","artist_song"},
     *                     @OA\Property(property="id", type="integer", example=1, description="ID de la canción (opcional)"),
     *                     @OA\Property(property="name_song", type="string", example="Bohemian Rhapsody"),
     *                     @OA\Property(property="artist_song", type="string", example="Queen"),
     *                     @OA\Property(property="album_song", type="string", example="A Night at the Opera"),
     *                     @OA\Property(property="art_work_song", type="string", example="https://example.com/cover.jpg"),
     *                     @OA\Property(property="genre_song", type="string", example="Rock"),
     *                     @OA\Property(property="url_song", type="string", example="https://example.com/song.mp3")
     *                 )
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Canciones agregadas exitosamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Canciones agregadas exitosamente"),
     *             @OA\Property(property="added_count", type="integer", example=3)
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Playlist no encontrada",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="No query results for model [App\\Models\\Playlist]")
     *         )
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Error de validación",
     *         @OA\JsonContent(
     *             @OA\Property(property="songs", type="array", @OA\Items(type="string", example="El campo songs es obligatorio."))
     *         )
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Error del servidor",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Error agregando canciones")
     *         )
     *     )
     * )
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
    /**
     * @OA\Delete(
     *     path="/api/playlists/{playlist}/songs/{song}",
     *     summary="Eliminar una canción de una playlist",
     *     description="Elimina una canción específica de una playlist del usuario",
     *     operationId="removeSongFromPlaylist",
     *     tags={"Playlists"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="playlist",
     *         in="path",
     *         required=true,
     *         description="ID de la playlist de la que se eliminará la canción",
     *         @OA\Schema(type="integer", example=1)
     *     ),
     *     @OA\Parameter(
     *         name="song",
     *         in="path",
     *         required=true,
     *         description="ID de la canción a eliminar (songs_saved_db_id)",
     *         @OA\Schema(type="integer", example=1)
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Canción eliminada exitosamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Canción eliminada exitosamente de la playlist")
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Playlist o canción no encontrada",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Playlist o canción no encontrada")
     *         )
     *     ),
     *     @OA\Response(
     *         response=403,
     *         description="No tienes permiso para modificar esta playlist",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="No tienes permiso para modificar esta playlist")
     *         )
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Error del servidor",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Error al eliminar la canción")
     *         )
     *     )
     * )
     */
    public function removeSong(Request $request, $playlistId, $songId)
    {
        Log::info('🎵 ========== REMOVE SONG FROM PLAYLIST START ==========');
        Log::info('🎵 Removing song from playlist:', [
            'playlist_id' => $playlistId,
            'song_id' => $songId
        ]);

        DB::beginTransaction();

        try {
            $userId = $request->user()?->id ?? 1;
            
            // Buscar la playlist y verificar que pertenece al usuario
            $playlist = Playlist::where('id', $playlistId)
                ->where('user_id', $userId)
                ->first();

            if (!$playlist) {
                Log::warning('🎵 Playlist not found or not owned by user:', [
                    'playlist_id' => $playlistId, 
                    'user_id' => $userId
                ]);
                return response()->json([
                    'message' => 'Playlist no encontrada o no tienes permisos'
                ], 404);
            }

            // Buscar la relación en saved_songs
            $savedSong = SavedSong::where('playlist_id', $playlist->id)
                ->where('songs_saved_db_id', $songId)
                ->first();

            if (!$savedSong) {
                Log::warning('🎵 Song not found in playlist:', [
                    'playlist_id' => $playlist->id,
                    'song_id' => $songId
                ]);
                return response()->json([
                    'message' => 'La canción no está en esta playlist'
                ], 404);
            }

            // Eliminar la relación
            $savedSong->delete();

            DB::commit();

            Log::info('🎵 Song removed successfully from playlist:', [
                'playlist_id' => $playlist->id,
                'song_id' => $songId
            ]);

            Log::info('🎵 ========== REMOVE SONG FROM PLAYLIST END ==========');

            return response()->json([
                'message' => 'Canción eliminada exitosamente de la playlist'
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('🎵 REMOVE SONG ERROR:', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Error al eliminar la canción de la playlist',
                'error' => config('app.debug') ? $e->getMessage() : 'Contact administrator'
            ], 500);
        }
    }
    public function update(Request $request, $id)
    {
        Log::info('🎵 ========== PLAYLIST UPDATE START ==========');
        Log::info('🎵 Updating playlist:', ['id' => $id]);
        Log::info('🎵 Request data:', $request->all());
        Log::info('🎵 User:', ['user' => $request->user()]);

        try {
            // Validar los datos
            $validated = $request->validate([
                'name_playlist' => 'required|string|max:255',
                'is_public' => 'required|boolean'
            ]);

            Log::info('🎵 Validation passed:', $validated);

            // Buscar la playlist
            $playlist = Playlist::find($id);

            if (!$playlist) {
                Log::warning('🎵 Playlist not found:', ['id' => $id]);
                return response()->json([
                    'message' => 'Playlist no encontrada'
                ], 404);
            }

            // Verificar que el usuario es el propietario
            $userId = $request->user()?->id ?? 1;
            if ($playlist->user_id !== $userId) {
                Log::warning('🎵 Unauthorized playlist update attempt:', [
                    'playlist_user_id' => $playlist->user_id,
                    'current_user_id' => $userId
                ]);
                return response()->json([
                    'message' => 'No autorizado para editar esta playlist'
                ], 403);
            }

            Log::info('🎵 Playlist before update:', [
                'name' => $playlist->name_playlist,
                'is_public' => $playlist->is_public
            ]);

            // Actualizar la playlist
            $playlist->update([
                'name_playlist' => $validated['name_playlist'],
                'is_public' => $validated['is_public']
            ]);

            Log::info('🎵 Playlist after update:', [
                'name' => $playlist->name_playlist,
                'is_public' => $playlist->is_public
            ]);

            Log::info('🎵 ========== PLAYLIST UPDATE END ==========');

            return response()->json([
                'message' => 'Playlist actualizada exitosamente',
                'playlist' => $playlist
            ], 200);

        } catch (\Exception $e) {
            Log::error('🎵 PLAYLIST UPDATE ERROR:', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Error al actualizar la playlist',
                'error' => config('app.debug') ? $e->getMessage() : 'Contact administrator'
            ], 500);
        }
    }

    /**
     * Alternativa usando PATCH
     */
    public function patchUpdate(Request $request, $id)
    {
        $validated = $request->validate([
            'name_playlist' => 'sometimes|string|max:255',
            'is_public' => 'sometimes|boolean'
        ]);

        $playlist = Playlist::find($id);

        if (!$playlist) {
            return response()->json(['message' => 'Playlist no encontrada'], 404);
        }

        if ($playlist->user_id !== Auth::id()) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $playlist->update($validated);

        return response()->json([
            'message' => 'Playlist actualizada',
            'playlist' => $playlist
        ]);
    }
}


