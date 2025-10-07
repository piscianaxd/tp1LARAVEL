<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Historial;
use App\Models\songSaveDB;
use Illuminate\Database\QueryException;

class HistoryController extends Controller
{
    /**
     * @OA\Post(
     *     path="/api/history",
     *     summary="Agregar una canción al historial del usuario autenticado",
     *     description="Guarda una canción reproducida o escuchada en el historial personal del usuario autenticado.",
     *     tags={"Historial"},
     *     security={{"sanctum":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"song_id"},
     *             @OA\Property(property="song_id", type="integer", example=5, description="ID de la canción (de la tabla songs_saved_db)")
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Canción guardada en el historial correctamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Canción guardada en el historial correctamente."),
     *             @OA\Property(property="historial", type="object",
     *                 @OA\Property(property="id", type="integer", example=12),
     *                 @OA\Property(property="user_id", type="integer", example=3),
     *                 @OA\Property(property="songs_saved_db_id", type="integer", example=5),
     *                 @OA\Property(property="created_at", type="string", example="2025-10-07T13:45:22.000000Z")
     *             ),
     *             @OA\Property(property="song", type="object",
     *                 @OA\Property(property="id", type="integer", example=5),
     *                 @OA\Property(property="name_song", type="string", example="In the End"),
     *                 @OA\Property(property="artist_song", type="string", example="Linkin Park"),
     *                 @OA\Property(property="genre_song", type="string", example="Rock"),
     *                 @OA\Property(property="album_song", type="string", example="Hybrid Theory"),
     *                 @OA\Property(property="url_song", type="string", example="https://example.com/in-the-end.mp3"),
     *                 @OA\Property(property="art_work_song", type="string", example="https://example.com/artwork/in-the-end.jpg")
     *             )
     *         )
     *     ),
     *     @OA\Response(response=401, description="Usuario no autenticado"),
     *     @OA\Response(response=422, description="Error de validación (song_id no existe o no es válido)"),
     *     @OA\Response(response=500, description="Error interno del servidor")
     * )
     */
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

    /**
     * @OA\Get(
     *     path="/api/history",
     *     summary="Obtener el historial del usuario autenticado",
     *     description="Devuelve la lista de canciones escuchadas o guardadas en el historial del usuario autenticado, ordenadas por fecha descendente.",
     *     tags={"Historial"},
     *     security={{"sanctum":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="Historial obtenido correctamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Historial obtenido correctamente."),
     *             @OA\Property(
     *                 property="data",
     *                 type="array",
     *                 @OA\Items(
     *                     @OA\Property(property="historial_id", type="integer", example=12),
     *                     @OA\Property(property="fecha", type="string", example="2025-10-07 13:45:22"),
     *                     @OA\Property(
     *                         property="cancion",
     *                         type="object",
     *                         @OA\Property(property="id", type="integer", example=5),
     *                         @OA\Property(property="nombre", type="string", example="In the End"),
     *                         @OA\Property(property="artista", type="string", example="Linkin Park"),
     *                         @OA\Property(property="genero", type="string", example="Rock"),
     *                         @OA\Property(property="album", type="string", example="Hybrid Theory"),
     *                         @OA\Property(property="url", type="string", example="https://example.com/in-the-end.mp3"),
     *                         @OA\Property(property="artwork", type="string", example="https://example.com/artwork/in-the-end.jpg")
     *                     )
     *                 )
     *             )
     *         )
     *     ),
     *     @OA\Response(response=401, description="Usuario no autenticado"),
     *     @OA\Response(response=500, description="Error al obtener el historial")
     * )
     */
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

/**
 * @OA\Delete(
 *     path="/api/history/{id}",
 *     summary="Eliminar una canción del historial del usuario",
 *     description="Elimina una entrada específica del historial del usuario autenticado.",
 *     tags={"Historial"},
 *     security={{"sanctum":{}}},
 *     @OA\Parameter(
 *         name="id",
 *         in="path",
 *         required=true,
 *         description="ID del registro del historial",
 *         @OA\Schema(type="integer", example=12)
 *     ),
 *     @OA\Response(response=200, description="Registro eliminado del historial"),
 *     @OA\Response(response=404, description="Registro no encontrado"),
 *     @OA\Response(response=401, description="Usuario no autenticado")
 * )
 */



public function destroy($id)
{
    $user = Auth::user();

    $historial = Historial::where('id', $id)
        ->where('user_id', $user->id)
        ->first();

    if (! $historial) {
        return response()->json(['error' => 'Registro no encontrado.'], 404);
    }

    $historial->delete();

    return response()->json(['message' => 'Registro eliminado del historial.']);
}

}