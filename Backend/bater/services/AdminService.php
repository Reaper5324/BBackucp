<?php


class AdminService {

    
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

    
    public function getProductsForModeration(): array {
        $db = Database::getConnection();
        $stmt = $db->query(
            'SELECT p.*, u.name AS seller_name, c.name AS category_name
             FROM products p
             JOIN users u ON p.seller_id = u.id
             JOIN categories c ON p.category_id = c.id
             ORDER BY p.created_at DESC'
        );
        return ['success' => true, 'data' => $stmt->fetchAll()];
    }

   
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

        public function getSupportTickets(): array {
        $support = new SupportService();
        return $support->getAllTickets();
    }

    
    public function getSupportTicketsByStatus(string $status): array {
        $support = new SupportService();
        return $support->getTicketsByStatus($status);
    }

        public function resolveSupportTicket(int $adminId, int $ticketId): array {
        $support = new SupportService();
        return $support->resolveTicket($adminId, $ticketId);
    }
}
