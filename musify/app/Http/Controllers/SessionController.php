<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class SessionController extends Controller
{
        /**
     * @OA\Get(
     *     path="/api/profile",
     *     summary="Obtener perfil del usuario autenticado",
     *     description="Devuelve los datos del usuario autenticado mediante token Sanctum.",
     *     tags={"Sesión"},
     *     security={{"sanctum":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="Perfil obtenido exitosamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="user", type="object",
     *                 @OA\Property(property="id", type="integer", example=1),
     *                 @OA\Property(property="name", type="string", example="Juan Pérez"),
     *                 @OA\Property(property="email", type="string", example="juan@example.com"),
     *                 @OA\Property(property="is_admin", type="boolean", example=false)
     *             )
     *         )
     *     ),
     *     @OA\Response(response=401, description="No autenticado")
     * )
     */
    public function profile(Request $request)
    {
        return response()->json([
            'user' => $request->user()
        ]);
    }

 /**
     * @OA\Put(
     *     path="/api/profile",
     *     summary="Actualizar perfil del usuario autenticado",
     *     description="Permite modificar nombre, email o contraseña del usuario autenticado. Si se cambia la contraseña, debe incluirse la contraseña actual.",
     *     tags={"Sesión"},
     *     security={{"sanctum":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="name", type="string", example="Juan Actualizado"),
     *             @OA\Property(property="email", type="string", format="email", example="juan_nuevo@example.com"),
     *             @OA\Property(property="current_password", type="string", example="password123"),
     *             @OA\Property(property="password", type="string", format="password", example="nuevaClave123")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Perfil actualizado exitosamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Perfil actualizado exitosamente"),
     *             @OA\Property(property="user", type="object",
     *                 @OA\Property(property="id", type="integer", example=1),
     *                 @OA\Property(property="name", type="string", example="Juan Actualizado"),
     *                 @OA\Property(property="email", type="string", example="juan_nuevo@example.com"),
     *                 @OA\Property(property="is_admin", type="boolean", example=false)
     *             )
     *         )
     *     ),
     *     @OA\Response(response=422, description="Error de validación o contraseña incorrecta"),
     *     @OA\Response(response=401, description="No autenticado")
     * )
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|max:255|unique:users,email,' . $user->id,
            'password' => 'sometimes|string|min:8',
            'current_password' => 'required_with:password|string'
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        // Verificar contraseña actual si se quiere cambiar la contraseña
        if ($request->has('password')) {
            if (!Hash::check($request->current_password, $user->password)) {
                return response()->json(['message' => 'La contraseña actual es incorrecta'], 422);
            }
        }

        // Actualizar los campos proporcionados
        if ($request->has('name')) {
            $user->name = $request->name;
        }

        if ($request->has('email')) {
            $user->email = $request->email;
        }

        if ($request->has('password')) {
            $user->password = Hash::make($request->password);
        }

        $user->save();

        return response()->json([
            'message' => 'Perfil actualizado exitosamente',
            'user' => $user
        ]);
    }

    /**
     * @OA\Delete(
     *     path="/api/profile",
     *     summary="Eliminar cuenta del usuario autenticado",
     *     description="Elimina la cuenta del usuario actual previa verificación de la contraseña.",
     *     tags={"Sesión"},
     *     security={{"sanctum":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"password"},
     *             @OA\Property(property="password", type="string", format="password", example="password123")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Cuenta eliminada exitosamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Cuenta eliminada exitosamente")
     *         )
     *     ),
     *     @OA\Response(response=422, description="Contraseña incorrecta o error de validación"),
     *     @OA\Response(response=401, description="No autenticado")
     * )
     */
    public function deleteAccount(Request $request)
    {
        $user = $request->user();
        
        // Opcional: validar contraseña antes de eliminar
        $validator = Validator::make($request->all(), [
            'password' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        if (!Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Contraseña incorrecta'], 422);
        }

        // Eliminar todos los tokens del usuario
        $user->tokens()->delete();
        
        // Eliminar el usuario
        $user->delete();

        return response()->json([
            'message' => 'Cuenta eliminada exitosamente'
        ]);
    }

    /**
     * @OA\Get(
     *     path="/api/users",
     *     summary="Listar todos los usuarios (solo administradores)",
     *     description="Devuelve la lista completa de usuarios. Solo accesible para usuarios con privilegios de administrador.",
     *     tags={"Administración"},
     *     security={{"sanctum":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="Lista de usuarios obtenida exitosamente",
     *         @OA\JsonContent(
     *             type="array",
     *             @OA\Items(
     *                 @OA\Property(property="id", type="integer", example=1),
     *                 @OA\Property(property="name", type="string", example="Juan Pérez"),
     *                 @OA\Property(property="email", type="string", example="juan@example.com"),
     *                 @OA\Property(property="is_admin", type="boolean", example=false)
     *             )
     *         )
     *     ),
     *     @OA\Response(response=403, description="No autorizado"),
     *     @OA\Response(response=401, description="No autenticado")
     * )
     */
    public function index()
    {
        // Verificar si el usuario es administrador
        if (!Auth::user()->is_admin) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $users = User::all();
        return response()->json($users);
    }

 /**
     * @OA\Put(
     *     path="/api/users/{id}",
     *     summary="Actualizar usuario (solo administradores)",
     *     description="Permite a un administrador actualizar la información de un usuario específico.",
     *     tags={"Administración"},
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID del usuario a actualizar",
     *         @OA\Schema(type="integer", example=3)
     *     ),
     *     @OA\RequestBody(
     *         @OA\JsonContent(
     *             @OA\Property(property="name", type="string", example="Carlos Gómez"),
     *             @OA\Property(property="email", type="string", format="email", example="carlos@example.com"),
     *             @OA\Property(property="password", type="string", format="password", example="nuevoPass123"),
     *             @OA\Property(property="is_admin", type="boolean", example=true)
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Usuario actualizado exitosamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Usuario actualizado exitosamente"),
     *             @OA\Property(property="user", type="object",
     *                 @OA\Property(property="id", type="integer", example=3),
     *                 @OA\Property(property="name", type="string", example="Carlos Gómez"),
     *                 @OA\Property(property="email", type="string", example="carlos@example.com"),
     *                 @OA\Property(property="is_admin", type="boolean", example=true)
     *             )
     *         )
     *     ),
     *     @OA\Response(response=403, description="No autorizado"),
     *     @OA\Response(response=422, description="Error de validación")
     * )
     */
    public function updateUser(Request $request, $id)
    {
        // Verificar si el usuario es administrador
        if (!Auth::user()->is_admin) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $user = User::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|max:255|unique:users,email,' . $user->id,
            'password' => 'sometimes|string|min:8',
            'is_admin' => 'sometimes|boolean'
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        // Actualizar los campos proporcionados
        if ($request->has('name')) {
            $user->name = $request->name;
        }

        if ($request->has('email')) {
            $user->email = $request->email;
        }

        if ($request->has('password')) {
            $user->password = Hash::make($request->password);
        }

        if ($request->has('is_admin')) {
            $user->is_admin = $request->is_admin;
        }

        $user->save();

        return response()->json([
            'message' => 'Usuario actualizado exitosamente',
            'user' => $user
        ]);
    }

 /**
     * @OA\Delete(
     *     path="/api/users/{id}",
     *     summary="Eliminar usuario (solo administradores)",
     *     description="Permite a un administrador eliminar un usuario específico. No se puede eliminar a sí mismo.",
     *     tags={"Administración"},
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID del usuario a eliminar",
     *         @OA\Schema(type="integer", example=4)
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Usuario eliminado exitosamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Usuario eliminado exitosamente")
     *         )
     *     ),
     *     @OA\Response(response=403, description="No autorizado"),
     *     @OA\Response(response=422, description="No puedes eliminar tu propia cuenta")
     * )
     */
    public function deleteUser($id)
    {
        // Verificar si el usuario es administrador
        if (!Auth::user()->is_admin) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $user = User::findOrFail($id);

        // No permitir que un administrador se elimine a sí mismo
        if ($user->id === Auth::user()->id) {
            return response()->json(['message' => 'No puedes eliminar tu propia cuenta desde aquí'], 422);
        }

        // Eliminar todos los tokens del usuario
        $user->tokens()->delete();
        
        // Eliminar el usuario
        $user->delete();

        return response()->json([
            'message' => 'Usuario eliminado exitosamente'
        ]);
    }
}