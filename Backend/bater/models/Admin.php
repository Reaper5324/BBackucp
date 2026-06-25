<?php



class Admin extends User {

   
    
    public function suspendUser(int $userId, string $reason = ''): bool {
        $user = User::findById($userId);

        if (!$user) return false;

        $ok = $user->deactivate();

        if ($ok) {
            $this->log('suspend_user', $userId, null, $reason);
        }

        return $ok;
    }

    public function reinstateUser(int $userId): bool {
        $user = User::findById($userId);

        if (!$user) return false;

        $ok = $user->activate();

        if ($ok) {
            $this->log('reinstate_user', $userId);
        }

        return $ok;
    }

    
    public function removeProduct(int $productId, string $reason = ''): bool {
        $product = Product::findById($productId);

        if (!$product) return false;

        $product->status = Product::STATUS_REMOVED;
        $ok = $product->save();

        if ($ok) {
            $this->log('remove_product', null, $productId, $reason);
        }

        return $ok;
    }

    
    public function approveVerification(int $verificationId): bool {
        $verification = SellerVerification::findById($verificationId);

        if (!$verification) return false;

        $verification->status      = SellerVerification::STATUS_APPROVED;
        $verification->reviewed_by = $this->id;
        $verification->reviewed_at = date('Y-m-d H:i:s');
        $ok = $verification->save();

        if ($ok) {
            $this->log('approve_verification', $verification->seller_id);
        }

        return $ok;
    }

    
    public function rejectVerification(int $verificationId, string $reason = ''): bool {
        $verification = SellerVerification::findById($verificationId);

        if (!$verification) return false;

        $verification->status      = SellerVerification::STATUS_REJECTED;
        $verification->reviewed_by = $this->id;
        $verification->reviewed_at = date('Y-m-d H:i:s');
        $ok = $verification->save();

        if ($ok) {
            $this->log('reject_verification', $verification->seller_id, null, $reason);
        }

        return $ok;
    }

   
    public function getLogs(): array {
        return AdminLog::findAll();
    }

    
    private function log(
        string $action,
        ?int   $targetUserId    = null,
        ?int   $targetProductId = null,
        string $notes           = ''
    ): void {
        $log                    = new AdminLog();
        $log->admin_id          = $this->id;
        $log->action            = $action;
        $log->target_user_id    = $targetUserId;
        $log->target_product_id = $targetProductId;
        $log->notes             = $notes;
        $log->save();
    }

   
    public static function findAdminById(int $id): ?static {
        $user = User::findById($id);

        if ($user && $user->isAdmin()) {
            return static::fromRow((array) $user);
        }

        return null;
    }
}

?>