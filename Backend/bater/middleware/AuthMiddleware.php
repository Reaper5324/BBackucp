<?php

class AuthMiddleware {

    public static function handle(): User {
        $auth = new AuthService();
        $user = $auth->getCurrentUser();

        if (!$user) {
            Response::error('Authentication required.', 401);
        }

        return $user;
    }
}
