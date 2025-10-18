<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\RecommendedSong;


class RecommendedSongController extends Controller
{
  /**
     * @OA\Get(
     *     path="/api/recommended-songs",
     *     summary="Obtener todas las listas de generos de canciones mas escuchadas",
     *     tags={"Recommended Songs"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="listas de generos obtenidas correctamente.",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="listas de generos obtenidas correctamente."),
     *             @OA\Property(
     *                 property="data",
     *                 type="array",
     *                 @OA\Items(
     *                     @OA\Property(property="id", type="integer", example=1),
     *                     @OA\Property(property="user_id", type="integer", example=5),
     *                     @OA\Property(property="rock", type="integer", example=3),
     *                     @OA\Property(property="pop", type="integer", example=5),
     *                     @OA\Property(property="tropical", type="integer", example=2),
     *                     @OA\Property(property="blues", type="integer", example=1),
     *                     @OA\Property(property="rap", type="integer", example=4),
     *                     @OA\Property(property="created_at", type="string", format="date-time", example="2025-10-07T15:00:00Z"),
     *                     @OA\Property(property="updated_at", type="string", format="date-time", example="2025-10-07T16:30:00Z")
     *                 )
     *             )
     *         )
     *     ),
     *     @OA\Response(response=401, description="No autenticado"),
     *     @OA\Response(response=500, description="Error interno del servidor")
     * )
    */

    public function index()
    {

            
        if (!auth()->user() || !auth()->user()->is_admin) {
            return response()->json(['message' => 'No autorizado. Solo administradores pueden acceder.'], 403);
        }

        $songs = RecommendedSong::all();

        return response()->json([
            'message' => 'Canciones recomendadas obtenidas correctamente.',
            'data' => $songs
        ], 200, [], JSON_PRETTY_PRINT);
    }



    /**
     * @OA\Post(
     *     path="/api/recommended-songs",
     *     summary="Guardar una nueva lista de generos de canciones mas escuchadas",
     *     tags={"Recommended Songs"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *        required=true,
     *        @OA\JsonContent(
     *            required={"user_id","rock","pop","tropical","blues","rap"},
     *            @OA\Property(property="user_id", type="integer", example=5),
     *            @OA\Property(property="rock", type="integer", example=3),
     *            @OA\Property(property="pop", type="integer", example=5),
     *            @OA\Property(property="tropical", type="integer", example=2),
     *            @OA\Property(property="blues", type="integer", example=1),
     *            @OA\Property(property="rap", type="integer", example=4)
     *        )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="lista de generos por ID usuario obtenida correctamente.",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="lista de generos por ID usuario obtenida correctamente."),
     *             @OA\Property(
     *                 property="data",
     *                 type="array",
     *                 @OA\Items(
     *                     @OA\Property(property="id", type="integer", example=1),
     *                     @OA\Property(property="user_id", type="integer", example=5),
     *                     @OA\Property(property="rock", type="integer", example=3),
     *                     @OA\Property(property="pop", type="integer", example=5),
     *                     @OA\Property(property="tropical", type="integer", example=2),
     *                     @OA\Property(property="blues", type="integer", example=1),
     *                     @OA\Property(property="rap", type="integer", example=4),
     *                     @OA\Property(property="created_at", type="string", format="date-time", example="2025-10-07T15:00:00Z"),
     *                     @OA\Property(property="updated_at", type="string", format="date-time", example="2025-10-07T16:30:00Z")
     *                 )
     *             )
     *         )
     *     ),
     *     @OA\Response(response=401, description="No autenticado"),
     *     @OA\Response(response=500, description="Error interno del servidor")
     * )
    */

    public function store(Request $request)
    {
        //     protected $fillable = ['user_id', 'rock', 'pop', 'tropical', 'blues', 'rap'];

        $data = RecommendedSong::create([
            'user_id' => $request->user_id,
            'rock' => $request->rock,
            'pop' => $request->pop,
            'tropical' => $request->tropical,
            'blues' => $request->blues,
            'rap' => $request->rap,
        ]);

        return response()->json(
            [
                'status'  => 'success',
                'message' => 'Canción recomendada guardada correctamente.',
                'song'    => [
                    'id'            => $data->id,
                    'user_id'      => $data->user_id,
                    'rock'     => $data->rock,
                    'pop'    => $data->pop,
                    'tropical'   => $data->tropical,
                    'blues'    => $data->blues,
                    'rap' => $data->rap,
                    'created_at'    => $data->created_at,
                    'updated_at'    => $data->updated_at,
                ]
            ],
            201,
            [],
            JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE
        );
    }

    /**
     * @OA\Get(
     *     path="/api/recommended-songs/{id}",
     *     summary="Obtener los generos mas escuchados por la ID de la lista",
     *     tags={"Recommended Songs"},
     *     security={{"bearerAuth":{}}},
     *     
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID de la canción recomendada",
     *         @OA\Schema(type="integer", example=1)
     *     ),
     * 
     *     @OA\Response(
     *         response=200,
     *         description="Canción recomendada obtenida correctamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Canción recomendada obtenida correctamente."),
     *             @OA\Property(
     *                 property="data",
     *                 type="object",
     *                 @OA\Property(property="id", type="integer", example=1),
     *                 @OA\Property(property="user_id", type="integer", example=10),
     *                 @OA\Property(property="rock", type="integer", example=5),
     *                 @OA\Property(property="pop", type="integer", example=3),
     *                 @OA\Property(property="tropical", type="integer", example=2),
     *                 @OA\Property(property="blues", type="integer", example=0),
     *                 @OA\Property(property="rap", type="integer", example=4),
     *                 @OA\Property(property="created_at", type="string", format="date-time", example="2025-10-03T20:30:00Z"),
     *                 @OA\Property(property="updated_at", type="string", format="date-time", example="2025-10-07T12:00:00Z")
     *             )
     *         )
     *     ),
     * 
     *     @OA\Response(
     *         response=404,
     *         description="Canción no encontrada",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Canción no encontrada.")
     *         )
     *     ),
     * 
     *     @OA\Response(response=401, description="No autenticado")
     * )
    */

    public function show(string $id)
    {
        $song = RecommendedSong::find($id);

        if (! $song) {
            return response()->json(['error' => 'Canción no encontrada.'], 404);
        }

        return response()->json([
            'message' => 'Canción recomendada obtenida correctamente.',
            'data' => $song
        ], 200, [], JSON_PRETTY_PRINT);
    }



    /**
     * @OA\Patch(
     *     path="/api/recommended-songs/{userId}",
     *     summary="Incrementar el contador de un género para un usuario",
     *     description="Aumenta en 1 el contador del género especificado para el usuario indicado.",
     *     tags={"Recommended Songs"},
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\Parameter(
     *         name="userId",
     *         in="path",
     *         required=true,
     *         description="ID del usuario asociado a las canciones recomendadas",
     *         @OA\Schema(type="integer", example=5)
     *     ),
     *
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"genre"},
     *             @OA\Property(
     *                 property="genre",
     *                 type="string",
     *                 description="Género a incrementar",
     *                 example="rock",
     *                 enum={"rock", "pop", "tropical", "blues", "rap"}
     *             )
     *         )
     *     ),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Contador del género incrementado correctamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Se incrementó correctamente el género rock para el usuario 5."),
     *             @OA\Property(
     *                 property="data",
     *                 type="object",
     *                 @OA\Property(property="id", type="integer", example=1),
     *                 @OA\Property(property="user_id", type="integer", example=5),
     *                 @OA\Property(property="rock", type="integer", example=6),
     *                 @OA\Property(property="pop", type="integer", example=2),
     *                 @OA\Property(property="tropical", type="integer", example=1),
     *                 @OA\Property(property="blues", type="integer", example=0),
     *                 @OA\Property(property="rap", type="integer", example=3),
     *                 @OA\Property(property="created_at", type="string", format="date-time", example="2025-10-01T10:30:00Z"),
     *                 @OA\Property(property="updated_at", type="string", format="date-time", example="2025-10-07T14:00:00Z")
     *             )
     *         )
     *     ),
     *
     *     @OA\Response(
     *         response=400,
     *         description="Parámetros inválidos o género no permitido",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="El campo genre es obligatorio y debe ser uno de los valores permitidos.")
     *         )
     *     ),
     *
     *     @OA\Response(
     *         response=404,
     *         description="Usuario no encontrado",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Usuario no encontrado.")
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="No autenticado")
     * )
    */

    public function update(Request $request, string $userId)
    {
        // Buscar el registro del usuario en la tabla
        $song = RecommendedSong::where('user_id', $userId)->first();

        if (! $song) {
            return response()->json(['error' => 'Usuario no encontrado.'], 404);
        }

        // Validar que venga el género en la request
        $request->validate([
            'genre' => 'required|string|in:rock,pop,tropical,blues,rap'
        ]);

        $genre = $request->input('genre');

        // Incrementar el contador del género escuchado
        $song->increment($genre);

        return response()->json([
            'message' => "Se incrementó correctamente el género {$genre} para el usuario {$userId}.",
            'data' => $song->fresh() // devuelve el registro actualizado
        ], 200, [], JSON_PRETTY_PRINT);
    }


    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
