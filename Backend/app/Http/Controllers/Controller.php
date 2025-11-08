<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Bus\DispatchesJobs;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;

/** 
* @OA\Info( 
*     version="1.0.0", 
*     title="API en Laravel", 
*     description="Documentación de la API con Swagger en Laravel" 
* ) 
* 
* @OA\Server( 
*     url="http://127.0.0.1:8000", 
*     description="Servidor local" 
* ) 
*  @OA\SecurityScheme( 
*     securityScheme="bearerAuth", 
*     type="http", 
*     scheme="bearer", 
*     bearerFormat="JWT",
*     description="Usa un token sanctum para autenticar" 
* ) 
*
* @OA\Tag(
*     name="Autenticación",
*     description="Endpoints para registro, login y logout de usuarios"
* ),
* @OA\Tag(
*     name="Sesión",
*     description="Gestión del perfil del usuario y administración"
* ),
* @OA\Tag(
*     name="Historial",
*     description="Operaciones relacionadas con el historial de canciones escuchadas"
* )
*/ 

class Controller extends BaseController
{
    use AuthorizesRequests, DispatchesJobs, ValidatesRequests;
}
