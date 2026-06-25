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

    //POST /auth/forgot-password
    public function forgotPassword(): void {
        $body = $this->body();
        $email = trim($body['email'] ?? '');

        if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->json(['success' => false, 'error' => 'Valid email is required'], 422);
            return;
        }

        // Find user by email
        $user = User::findByEmail($email);
        if (!$user) {
            // Don't reveal if email exists (security best practice)
            $this->json(['success' => true, 'message' => 'If that email exists, we sent a password reset link'], 200);
            return;
        }

        // Create reset token
        $resetResult = PasswordReset::create($user->id);
        if (!$resetResult['success']) {
            $this->json(['success' => false, 'error' => 'Failed to create reset token'], 500);
            return;
        }

        // Get Resend API key from environment
        $apiKey = getenv('RESEND_API_KEY') ?: $_ENV['RESEND_API_KEY'] ?? null;
        if (!$apiKey) {
            // Fallback: log error but don't expose to client
            error_log('RESEND_API_KEY not configured');
            $this->json(['success' => true, 'message' => 'If that email exists, we sent a password reset link'], 200);
            return;
        }

        // Send reset email
        $emailService = new ResendEmailService($apiKey);
        $emailResult = $emailService->sendPasswordResetEmail(
            $user->email,
            $user->name,
            $resetResult['token']
        );

        if (!$emailResult['success']) {
            error_log('Email send failed: ' . $emailResult['error']);
        }

        // Always return success (don't reveal if email send failed)
        $this->json(['success' => true, 'message' => 'If that email exists, we sent a password reset link'], 200);
    }

    /**
     * Reset password with token
     * POST /auth/reset-password
     */
    public function resetPassword(): void {
        $body = $this->body();
        $token = trim($body['token'] ?? '');
        $password = $body['password'] ?? '';

        if (!$token || !$password) {
            $this->json(['success' => false, 'error' => 'Token and password are required'], 422);
            return;
        }

        if (strlen($password) < 6) {
            $this->json(['success' => false, 'error' => 'Password must be at least 6 characters'], 422);
            return;
        }

        // Find valid reset token
        $reset = PasswordReset::findByToken($token);
        if (!$reset) {
            $this->json(['success' => false, 'error' => 'Invalid or expired reset token'], 401);
            return;
        }

        // Get user
        $user = User::findById($reset->user_id);
        if (!$user) {
            $this->json(['success' => false, 'error' => 'User not found'], 404);
            return;
        }

        // Update password
        $user->password_hash = password_hash($password, PASSWORD_ARGON2ID);
        if (!$user->save()) {
            $this->json(['success' => false, 'error' => 'Failed to update password'], 500);
            return;
        }

        // Clean up reset tokens for this user
        PasswordReset::deleteForUser($user->id);

        $this->json(['success' => true, 'message' => 'Password reset successfully'], 200);
    }
}
