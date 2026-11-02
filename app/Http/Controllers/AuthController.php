<?php
namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    // Registrasi publik: SELALU role customer (admin tidak bisa daftar dari sini)
    public function register(Request $r)
    {
        $data = $r->validate([
            'name' => 'required|string|min:3|max:100',
            'email' => 'required|email|max:150|unique:users,email',
            'phone' => ['required', 'regex:/^[0-9+]{9,15}$/'],
            'password' => 'required|string|min:6|confirmed',
        ], [
            'email.unique' => 'Email sudah terdaftar.',
            'password.confirmed' => 'Konfirmasi password tidak sama.',
            'phone.regex' => 'Nomor WhatsApp tidak valid.',
        ]);
        $user = User::create([
            'name' => $data['name'], 'email' => strtolower($data['email']), 'phone' => $data['phone'],
            'password' => $data['password'], 'role' => 'customer',
        ]);
        return response()->json(['token' => $user->createToken('web')->plainTextToken, 'user' => $this->out($user)], 201);
    }

    public function login(Request $r)
    {
        $data = $r->validate(['email' => 'required|email', 'password' => 'required|string']);
        $user = User::where('email', strtolower($data['email']))->first();
        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages(['email' => 'Email atau password salah.']);
        }
        return response()->json(['token' => $user->createToken('web')->plainTextToken, 'user' => $this->out($user)]);
    }

    public function logout(Request $r)
    {
        $r->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'ok']);
    }

    public function me(Request $r) { return response()->json($this->out($r->user())); }

    public function update(Request $r)
    {
        $data = $r->validate(['name' => 'required|string|min:3|max:100', 'phone' => ['required', 'regex:/^[0-9+]{9,15}$/']]);
        $r->user()->update($data);
        return response()->json($this->out($r->user()->fresh()));
    }

    private function out(User $u): array
    {
        return ['id' => $u->id, 'name' => $u->name, 'email' => $u->email, 'phone' => $u->phone, 'role' => $u->role];
    }
}
