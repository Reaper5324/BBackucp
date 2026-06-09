<?php

class AuthController extends Controller {

    private AuthService $auth;

    public function __construct() {
        $this->auth = new AuthService();
    }

    public function register(): void {
        $result = $this->auth->Register($this->body());
        $this->json($result, $result['success'] ? 201 : 422);
    }

    public function login(): void {
        $body = $this->body();
        $result = $this->auth->login($body['email'] ?? '', $body['password'] ?? '');
        $this->json($result, $result['success'] ? 200 : 401);
    }

    public function logout(): void {
        $this->auth->logout();
        $this->json(['success' => true]);
    }

    public function me(): void {
        $user = AuthMiddleware::handle();
        $role = $user->getRole();

        $this->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $role?->role_name,
                'is_active' => $user->is_active,
            ],
        ]);
    }
}
