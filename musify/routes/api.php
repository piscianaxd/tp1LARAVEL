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
    Route::apiResource('songs', SongsController::class);
//SongsController
Route::apiResource('recommended-songs', RecommendedSongController::class);
Route::middleware('auth:sanctum')->group(function () {

    Route::apiResource('history', HistoryController::class);    

});