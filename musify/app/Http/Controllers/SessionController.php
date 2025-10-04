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
     * Obtiene el perfil del usuario autenticado
     */
    public function profile(Request $request)
    {
        return response()->json([
            'user' => $request->user()
        ]);
    }

    /**
     * Actualiza el perfil del usuario autenticado
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
     * Elimina la cuenta del usuario autenticado
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
     * Obtiene todos los usuarios (solo para administradores)
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
     * Actualiza un usuario específico (solo para administradores)
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
     * Elimina un usuario específico (solo para administradores)
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