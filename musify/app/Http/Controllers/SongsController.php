<?php

namespace App\Http\Controllers;

use App\Models\SongSavedDB;
use Illuminate\Http\Request;

class SongsController extends Controller
{

  /** 
     * @OA\Get(
     *     path="/api/songs",
     *     summary="Obtener lista de canciones",
     *     tags={"Songs"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="Lista de canciones obtenida correctamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="status", type="string", example="success"),
     *             @OA\Property(property="count", type="integer", example=10),
     *             @OA\Property(
     *                 property="songs",
     *                 type="array",
     *                 @OA\Items(
     *                     @OA\Property(property="id", type="integer", example=1),
     *                     @OA\Property(property="url_song", type="string", example="https://example.com/song.mp3"),
     *                     @OA\Property(property="name_song", type="string", example="Nombre de la canción"),
     *                     @OA\Property(property="genre_song", type="string", example="Rock"),
     *                     @OA\Property(property="artist_song", type="string", example="Artista X"),
     *                     @OA\Property(property="album_song", type="string", example="Álbum Y"),
     *                     @OA\Property(property="art_work_song", type="string", example="https://example.com/artwork.jpg"),
     *                     @OA\Property(property="created_at", type="string", format="date-time", example="2025-10-03T20:30:00Z"),
     *                     @OA\Property(property="updated_at", type="string", format="date-time", example="2025-10-03T20:30:00Z")
     *                 )
     *             )
     *         )
     *     ),
     *     @OA\Response(response=401, description="No autenticado")
     * )
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

    //Agregado por Lucas 1/11/25
  public function getSongsByGenre($genre)
{
    try {
        // Filtra canciones por género (insensible a mayúsculas/minúsculas)
        $songs = SongSavedDb::whereRaw('LOWER(genre_song) = ?', [strtolower($genre)])
            ->inRandomOrder() // Mezcla aleatoriamente
            ->limit(6)         // Solo 6 canciones
            ->get();

        if ($songs->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'No se encontraron canciones para el género especificado.',
                'songs' => []
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Canciones obtenidas correctamente.',
            'songs' => $songs
        ], 200);

    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Error al obtener canciones.',
            'error' => $e->getMessage()
        ], 500);
    }
}


 /**
     * @OA\Post(
     *     path="/api/songs",
     *     summary="Guardar una nueva canción",
     *     tags={"Songs"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"url_song","name_song","genre_song","artist_song","album_song","art_work_song"},
     *             @OA\Property(property="url_song", type="string", format="url", example="https://example.com/song.mp3"),
     *             @OA\Property(property="name_song", type="string", example="Nombre de la canción"),
     *             @OA\Property(property="genre_song", type="string", example="Rock"),
     *             @OA\Property(property="artist_song", type="string", example="Artista X"),
     *             @OA\Property(property="album_song", type="string", example="Álbum Y"),
     *             @OA\Property(property="art_work_song", type="string", format="url", example="https://example.com/artwork.jpg")
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Canción guardada correctamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="status", type="string", example="success"),
     *             @OA\Property(property="message", type="string", example="Canción guardada correctamente."),
     *             @OA\Property(property="song", type="object",
     *                 @OA\Property(property="id", type="integer", example=1),
     *                 @OA\Property(property="url_song", type="string", example="https://example.com/song.mp3"),
     *                 @OA\Property(property="name_song", type="string", example="Nombre de la canción"),
     *                 @OA\Property(property="genre_song", type="string", example="Rock"),
     *                 @OA\Property(property="artist_song", type="string", example="Artista X"),
     *                 @OA\Property(property="album_song", type="string", example="Álbum Y"),
     *                 @OA\Property(property="art_work_song", type="string", example="https://example.com/artwork.jpg"),
     *                 @OA\Property(property="created_at", type="string", format="date-time", example="2025-10-03T20:30:00Z"),
     *                 @OA\Property(property="updated_at", type="string", format="date-time", example="2025-10-03T20:30:00Z")
     *             )
     *         )
     *     ),
     *     @OA\Response(response=401, description="No autenticado")
     * )
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

    /**
     * @OA\Get(
     *     path="/api/songs/random/{limit}",
     *     summary="Obtener canciones aleatorias",
     *     tags={"Songs"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="limit",
     *         in="path",
     *         description="Número de canciones aleatorias a obtener",
     *         required=true,
     *         @OA\Schema(type="integer", example=6)
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Lista de canciones aleatorias obtenida correctamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="status", type="string", example="success"),
     *             @OA\Property(property="count", type="integer", example=6),
     *             @OA\Property(property="min_id", type="integer", example=1),
     *             @OA\Property(property="max_id", type="integer", example=150),
     *             @OA\Property(
     *                 property="songs",
     *                 type="array",
     *                 @OA\Items(
     *                     @OA\Property(property="id", type="integer", example=1),
     *                     @OA\Property(property="url_song", type="string", example="https://example.com/song.mp3"),
     *                     @OA\Property(property="name_song", type="string", example="Nombre de la canción"),
     *                     @OA\Property(property="genre_song", type="string", example="Rock"),
     *                     @OA\Property(property="artist_song", type="string", example="Artista X"),
     *                     @OA\Property(property="album_song", type="string", example="Álbum Y"),
     *                     @OA\Property(property="art_work_song", type="string", example="https://example.com/artwork.jpg"),
     *                     @OA\Property(property="created_at", type="string", format="date-time", example="2025-10-03T20:30:00Z"),
     *                     @OA\Property(property="updated_at", type="string", format="date-time", example="2025-10-03T20:30:00Z")
     *                 )
     *             )
     *         )
     *     ),
     *     @OA\Response(response=401, description="No autenticado"),
     *     @OA\Response(response=404, description="No se encontraron canciones")
     * )
     */
    public function getRandomSongs($limit = 6)
    {
        // Forzar que empiece desde ID 1
        $minId = 1;
        $maxId = SongSavedDB::max('id');
        
        // Si no hay canciones o el máximo ID es menor que 1
        if (is_null($maxId) || $maxId < 1) {
            return response()->json(
                [
                    'status' => 'success',
                    'count' => 0,
                    'min_id' => 1,
                    'max_id' => 0,
                    'message' => 'No hay canciones en la base de datos',
                    'songs' => []
                ],
                200,
                [],
                JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE
            );
        }

        $randomSongs = SongSavedDB::whereBetween('id', [$minId, $maxId])
                                ->inRandomOrder()
                                ->limit($limit)
                                ->get();

        return response()->json(
            [
                'status' => 'success',
                'count' => $randomSongs->count(),
                'min_id' => $minId,
                'max_id' => $maxId,
                'songs' => $randomSongs
            ],
            200,
            [],
            JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE
        );
    }
}


