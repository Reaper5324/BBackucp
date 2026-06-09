<?php

class RoleMiddleware {

    public static function requireBuyer(User $user): void {
        static::requireRole($user, Role::BUYER);
    }

    public static function requireSeller(User $user): void {
        static::requireRole($user, Role::SELLER);
    }

    public static function requireAdmin(User $user): void {
        static::requireRole($user, Role::ADMIN);
    }

    private static function requireRole(User $user, string $role): void {
        if (!$user->hasRole($role)) {
            Response::error('Access denied.', 403);
        }
    }
}
