<?php

namespace App\Http\Controllers;

use App\Models\SongSavedDB;
use Illuminate\Http\Request;

class SongsController extends Controller
{

    /** 
    *@OA\Get( 
    *path="/api/songs", 
    *summary="Obtener lista de canciones", 
    *tags={"Songs"}, 
    *@OA\Response( 
    *response=200, 
    *description="Lista de canciones obtenida correctamente" 
    *) 
    *) 
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

    /**
    *@OA\Post( 
    *path="/api/songs", 
    *summary="Guardar una nueva canción", 
    *tags={"Songs"}, 
    *@OA\RequestBody( 
    *required=true, 
    *@OA\JsonContent( 
    *required={"url_song","name_song","genre_song","artist_song","album_song","art_work_song"}, 
    *@OA\Property(property="url_song", type="string", format="url", example="https://example.com/song.mp3"), 
    *@OA\Property(property="name_song", type="string", example="Nombre de la canción"), 
    *@OA\Property(property="genre_song", type="string", example="Género de la canción"),
    *@OA\Property(property="artist_song", type="string", example="Artista de la canción"),
    *@OA\Property(property="album_song", type="string", example="Álbum de la canción"),
    *@OA\Property(property="art_work_song", type="string", format="url", example="https://example.com/artwork.jpg") 
    *) 
    *), 
    *@OA\Response( 
    *response=201, 
    *description="Canción guardada correctamente" 
    *) 
    *)  

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
     * path="/api/songs/{id}",
     * summary="Obtener detalles de una canción por ID",
     * tags={"Songs"},
     * @OA\Parameter(
     *   name="id",
     *  in="path",
     *  description="ID de la canción",
     *  required=true,
     *  @OA\Schema(type="integer")
     * ),
     * @OA\Response(
     *  response=200,
     * description="Detalles de la canción obtenidos correctamente",
     * @OA\JsonContent(
     *    @OA\Property(property="status", type="string", example="success"),
     *   @OA\Property(
     *     property="song",
     *    type="object",
     *   @OA\Property(property="id", type="integer", example=1),
     *   @OA\Property(property="url_song", type="string", format="url", example="https://example.com/song.mp3"),
     *  @OA\Property(property="name_song", type="string", example="Nombre de la canción"),
     * @OA\Property(property="genre_song", type="string", example="Género de la canción"),
     * @OA\Property(property="artist_song", type="string", example="Artista de la canción"),
     * @OA\Property(property="album_song", type="string", example="Ál
     * bum de la canción"),
     * @OA\Property(property="art_work_song", type="string", format="url
     * ", example="https://example.com/artwork.jpg"),
     * @OA\Property(property="created_at", type="string", format="date-time", example="2023-10-01T12:00:00Z"),
     * @OA\Property(property="updated_at", type="string", format="date-time", example="2023-10-01T12:00:00Z")
     * )
     * )
     * ),
     * @OA\Response(
     * response=404,
     * description="Canción no encontrada",
     * @OA\JsonContent(
     *  @OA\Property(property="status", type="string", example="error"),
     * @OA\Property(property="message", type="string", example="Canción no encontrada.")
     * )
     * )
     * )
     * 
     * 
     */

    public function show(string $id)
    {
        $song = SongSavedDB::find($id);

        if (!$song) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Canción no encontrada.'
            ], 404, [], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        }

        return response()->json(
            [
                'status' => 'success',
                'song'   => $song
            ],
            200,
            [],
            JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE
        );
    }
}
