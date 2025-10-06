<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Playlist;
use App\Models\SavedSong;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

/**
 * @OA\Tag(
 *     name="Playlists",
 *     description="Operaciones relacionadas con playlists"
 * )
 *
 * @OA\Schema(
 *     schema="Playlist",
 *     type="object",
 *     title="Playlist",
 *     description="Modelo de Playlist",
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="name_playlist", type="string", example="Mi Playlist Favorita"),
 *     @OA\Property(property="is_public", type="boolean", example=true),
 *     @OA\Property(property="user_id", type="integer", example=1),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time"),
 *     @OA\Property(
 *         property="songs",
 *         type="array",
 *         @OA\Items(ref="#/components/schemas/Song")
 *     )
 * )
 *
 * @OA\Schema(
 *     schema="PlaylistInput",
 *     type="object",
 *     title="Datos de entrada para Playlist",
 *     required={"name_playlist", "is_public"},
 *     @OA\Property(property="name_playlist", type="string", example="Nueva Playlist"),
 *     @OA\Property(property="is_public", type="boolean", example=false)
 * )
 *
 * @OA\Schema(
 *     schema="Song",
 *     type="object",
 *     title="Canción",
 *     description="Modelo de Canción guardada",
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="title", type="string", example="Imagine"),
 *     @OA\Property(property="artist", type="string", example="John Lennon"),
 *     @OA\Property(property="playlist_id", type="integer", example=1)
 * )
 */
class PlaylistController extends Controller
{
    /**
     * @OA\Get(
     *     path="/playlists",
     *     summary="Obtener todas las playlists del usuario",
     *     tags={"Playlists"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="Lista de playlists obtenida exitosamente",
     *         @OA\JsonContent(
     *             type="array",
     *             @OA\Items(ref="#/components/schemas/Playlist")
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

    /**
     * @OA\Post(
     *     path="/playlists",
     *     summary="Crear una nueva playlist",
     *     tags={"Playlists"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(ref="#/components/schemas/PlaylistInput")
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Playlist creada exitosamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Playlist creada exitosamente"),
     *             @OA\Property(property="playlist", ref="#/components/schemas/Playlist")
     *         )
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Error de validación",
     *         @OA\JsonContent(
     *             @OA\Property(property="errors", type="object", example={"name_playlist": {"El campo nombre de playlist es requerido."}})
     *         )
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Error interno del servidor",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Internal server error"),
     *             @OA\Property(property="debug", type="string", example="Mensaje de error detallado")
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

    /**
     * @OA\Delete(
     *     path="/playlists/{id}",
     *     summary="Eliminar una playlist",
     *     tags={"Playlists"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID de la playlist a eliminar",
     *         @OA\Schema(type="integer")
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
     *             @OA\Property(property="error", type="string", example="No se encontró la playlist")
     *         )
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Error eliminando playlist",
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