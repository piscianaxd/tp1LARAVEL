<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\SongsController;
use App\Http\Controllers\HistoryController;
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
//SongsController
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/songs', [SongsController::class, 'getSongs']);
    Route::post('/songs', [SongsController::class, 'postSongs']);
    // para usar todas se puede usar apiResource
    Route::apiResource('songs', SongsController::class);
    Route::apiResource('history', HistoryController::class);    
    Route::apiResource('recommended-songs', RecommendedSongController::class);
});