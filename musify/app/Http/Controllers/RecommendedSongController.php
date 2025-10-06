<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\RecommendedSong;

class RecommendedSongController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json([
            'message' => 'Canciones recomendadas obtenidas correctamente.',
            'data' => $songs
        ], 200, [], JSON_PRETTY_PRINT);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        
    }

    /**
     * Store a newly created resource in storage.
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
     * Display the specified resource.
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
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
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
