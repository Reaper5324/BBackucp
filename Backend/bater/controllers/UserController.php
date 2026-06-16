<?php

class UserController extends Controller {

    private UserService $users;

    public function __construct() {
        $this->users = new UserService();
    }

    public function show(): void {
        $user = AuthMiddleware::handle();
        $role = $user->getRole();

        $this->json([
            'success' => true,
            'data' => [
            'id'              => $user->id,
            'name'            => $user->name,
            'email'           => $user->email,
            'phone'           => $user->phone,
            'address'         => $user->address,
            'city'            => $user->city,
            'province'        => $user->province,
            'profile_picture' => $user->profile_picture,
            'role'            => $role?->role_name,
            'created_at'      => $user->created_at,
            ],
        ]);
    }

    public function update(): void {
        $user = AuthMiddleware::handle();
        $result = $this->users->updateProfile($user->id, $this->body());
        $this->json($result, $result['success'] ? 200 : 422);
    }

    public function changePassword(): void {
        $user = AuthMiddleware::handle();
        $body = $this->body();

        $result = $this->users->changePassword(
            $user->id,
            $body['current_password'] ?? '',
            $body['new_password'] ?? ''
        );

        $this->json($result, $result['success'] ? 200 : 422);
    }

    public function uploadPicture(): void {
        $user = AuthMiddleware::handle();
        $result = $this->users->uploadProfilePicture(
            $user->id,
            $_FILES['picture'] ?? $_FILES['profile_picture'] ?? []
        );
        $this->json($result, $result['success'] ? 200 : 422);
    }

    public function deactivate(): void {
        $user = AuthMiddleware::handle();
        $result = $this->users->deactivateAccount($user->id);
        $this->json($result, $result['success'] ? 200 : 422);
    }
}
