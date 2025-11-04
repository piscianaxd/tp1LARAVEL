<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\SongsController;
use App\Http\Controllers\HistoryController;

use App\Http\Controllers\SessionController;
use App\Http\Controllers\PlaylistController;
use App\Http\Controllers\RecommendedSongController;
/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

// Rutas públicas
//AuthController
Route::post('register',[AuthController::class,'register']);
Route::post('login',[AuthController::class,'login']);

Route::middleware('auth:sanctum')->group(function () {
    // Rutas personalizadas
    Route::get('/songs/random/{limit}', [SongsController::class, 'getRandomSongs']);
    Route::get('/songs/random-from-start/{limit}', [SongsController::class, 'getRandomSongsFromStart']);
    Route::get('/songs/random-ids/{limit}', [SongsController::class, 'getRandomSongsByIds']);
    Route::get('/songs/filter-genre/{genre}', [SongsController::class,'getSongsByGenre']); //Controlador que devuelve canciones segun el género
    // para usar todas se puede usar apiResource
    Route::apiResource('songs', SongsController::class);

    Route::apiResource('history', HistoryController::class);
    Route::apiResource('recommended-songs', RecommendedSongController::class);

     // Nuevas rutas personalizadas
    Route::patch('/recommended-songs/user/{userId}/increment-genre', [RecommendedSongController::class, 'incrementGenreByUser']);
    Route::get('/recommended-songs/user/{userId}/top-genres', [RecommendedSongController::class, 'getTopGenres']);
    
    // Perfil del usuario autenticado
    Route::get('/profile', [SessionController::class, 'profile']);
    Route::put('/profile', [SessionController::class, 'updateProfile']);
    Route::delete('/profile', [SessionController::class, 'deleteAccount']);
    
    // Administración de usuarios (solo admin)
    Route::get('/users', [SessionController::class, 'index']);
    Route::put('/users/{id}', [SessionController::class, 'updateUser']);
    Route::delete('/users/{id}', [SessionController::class, 'deleteUser']);

    //PlaylistController
    Route::apiResource('playlists', PlaylistController::class);
});