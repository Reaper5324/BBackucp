<?php


class AdminService {

    /**
     * Fetch all users on the platform with their role names.
     * Used for the admin user management table.
     */
    public function getAllUsers(): array {
        $db   = Database::getConnection();
        $stmt = $db->query(
            'SELECT u.*, r.role_name
             FROM users u
             JOIN roles r ON u.role_id = r.id
             ORDER BY u.created_at DESC'
        );
        return ['success' => true, 'data' => $stmt->fetchAll()];
    }

    public function getSellers(): array {
        $db   = Database::getConnection();
        $stmt = $db->query(
            "SELECT u.*, r.role_name
             FROM users u
             JOIN roles r ON u.role_id = r.id
             WHERE r.role_name = 'seller'
             ORDER BY u.created_at DESC"
        );
        return ['success' => true, 'data' => $stmt->fetchAll()];
    }

    /**
     * Suspend a user and log the action.
     */
    public function suspendUser(int $adminId, int $targetUserId, string $reason = ''): array {
        if ($adminId === $targetUserId) {
            return ['success' => false, 'error' => 'You cannot suspend your own account.'];
        }

        $user = User::findById($targetUserId);
        if (!$user) {
            return ['success' => false, 'error' => 'User not found.'];
        }

        if (!$user->is_active) {
            return ['success' => false, 'error' => 'User is already suspended.'];
        }

        $user->deactivate();
        $this->writeLog($adminId, 'suspend_user', $targetUserId, null, $reason);

        $notif = new NotificationService();
        $notif->notify($targetUserId, 'Your account has been suspended. Contact support for assistance.', Notification::TYPE_SYSTEM);

        return ['success' => true];
    }

    /**
     * Reinstate a suspended user.
     */
    public function reinstateUser(int $adminId, int $targetUserId): array {
        $user = User::findById($targetUserId);
        if (!$user) {
            return ['success' => false, 'error' => 'User not found.'];
        }

        $user->activate();
        $this->writeLog($adminId, 'reinstate_user', $targetUserId);

        $notif = new NotificationService();
        $notif->notify($targetUserId, 'Your account has been reinstated. Welcome back to Bater.', Notification::TYPE_SYSTEM);

        return ['success' => true];
    }

    /**
     * Remove a product listing from the platform.
     */
    public function removeProduct(int $adminId, int $productId, string $reason = ''): array {
        $product = Product::findById($productId);
        if (!$product) {
            return ['success' => false, 'error' => 'Product not found.'];
        }

        $product->status = Product::STATUS_REMOVED;
        $product->save();

        $this->writeLog($adminId, 'remove_product', null, $productId, $reason);

        $notif = new NotificationService();
        $notif->notify(
            $product->seller_id,
            "Your listing '{$product->title}' has been removed." . ($reason ? " Reason: {$reason}" : ''),
            Notification::TYPE_SYSTEM
        );

        return ['success' => true];
    }

    /**
     * Summary counts for the admin dashboard.
     */
    public function getDashboardStats(): array {
        $db = Database::getConnection();

        $stats = [];

        $stats['total_users']    = (int) $db->query("SELECT COUNT(*) FROM users")->fetchColumn();
        $stats['total_products'] = (int) $db->query("SELECT COUNT(*) FROM products WHERE status = 'active'")->fetchColumn();
        $stats['total_orders']   = (int) $db->query("SELECT COUNT(*) FROM orders")->fetchColumn();
        $stats['pending_verifs'] = (int) $db->query("SELECT COUNT(*) FROM seller_verifications WHERE status = 'pending'")->fetchColumn();
        $stats['total_revenue']  = (float) $db->query("SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed'")->fetchColumn();

        return ['success' => true, 'data' => $stats];
    }

    /**
     * Fetch the admin audit log.
     */
    public function getLogs(): array {
        $db   = Database::getConnection();
        $stmt = $db->query(
            'SELECT al.*, u.name AS admin_name
             FROM admin_logs al
             JOIN users u ON al.admin_id = u.id
             ORDER BY al.created_at DESC
             LIMIT 200'
        );
        return ['success' => true, 'data' => $stmt->fetchAll()];
    }

    /**
     * Write an admin action to the audit log.
     */
    private function writeLog(
        int    $adminId,
        string $action,
        ?int   $targetUserId    = null,
        ?int   $targetProductId = null,
        string $notes           = ''
    ): void {
        $log                    = new AdminLog();
        $log->admin_id          = $adminId;
        $log->action            = $action;
        $log->target_user_id    = $targetUserId;
        $log->target_product_id = $targetProductId;
        $log->notes             = $notes;
        $log->save();
    }
}
