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
*/ 

class Controller extends BaseController
{
    use AuthorizesRequests, DispatchesJobs, ValidatesRequests;
}
