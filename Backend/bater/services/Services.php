<?php

class ReviewService {

    /**
     * Submit a review for a product.
     *
     * Rules:
     *   - Reviewer must have a completed order containing this product
     *   - Reviewer cannot review the same product twice
     *   - Rating must be between 1 and 5
     */
    public function createReview(int $reviewerId, int $productId, int $rating, string $comment): array {
        // --- Validate rating ---
        if ($rating < 1 || $rating > 5) {
            return ['success' => false, 'error' => 'Rating must be between 1 and 5.'];
        }

        if (empty(trim($comment))) {
            return ['success' => false, 'error' => 'Review comment cannot be empty.'];
        }

        // --- Product must exist ---
        if (!Product::findById($productId)) {
            return ['success' => false, 'error' => 'Product not found.'];
        }

        // --- Buyer must have completed an order containing this product ---
        if (!$this->hasPurchasedProduct($reviewerId, $productId)) {
            return [
                'success' => false,
                'error'   => 'You can only review products you have purchased and received.',
            ];
        }

        // --- No duplicate reviews ---
        $db   = Database::getConnection();
        $stmt = $db->prepare(
            'SELECT COUNT(*) FROM reviews WHERE reviewer_id = ? AND product_id = ?'
        );
        $stmt->execute([$reviewerId, $productId]);
        if ((int) $stmt->fetchColumn() > 0) {
            return ['success' => false, 'error' => 'You have already reviewed this product.'];
        }

        // --- Create the review ---
        $review              = new Review();
        $review->reviewer_id = $reviewerId;
        $review->product_id  = $productId;
        $review->rating      = $rating;
        $review->comment     = trim($comment);

        if (!$review->save()) {
            return ['success' => false, 'error' => 'Failed to save review.'];
        }

        return ['success' => true, 'data' => ['review_id' => $review->id]];
    }

    /**
     * Delete a review. Only the reviewer who wrote it can delete it.
     */
    public function deleteReview(int $reviewId, int $reviewerId): array {
        $review = Review::findById($reviewId);

        if (!$review) {
            return ['success' => false, 'error' => 'Review not found.'];
        }

        if ($review->reviewer_id !== $reviewerId) {
            return ['success' => false, 'error' => 'You can only delete your own reviews.'];
        }

        if (!$review->delete()) {
            return ['success' => false, 'error' => 'Failed to delete review.'];
        }

        return ['success' => true];
    }

    /**
     * Get all reviews for a product.
     */
    public function getProductReviews(int $productId): array {
        return ['success' => true, 'data' => Review::findBy('product_id', $productId)];
    }

    /**
     * Check if a buyer has a completed order that contains a specific product.
     * This is the gate that prevents fake reviews.
     */
    private function hasPurchasedProduct(int $buyerId, int $productId): bool {
        $db   = Database::getConnection();
        $stmt = $db->prepare(
            "SELECT COUNT(*)
             FROM orders o
             JOIN order_items oi ON oi.order_id = o.id
             WHERE o.buyer_id   = ?
               AND oi.product_id = ?
               AND o.status      = ?"
        );
        $stmt->execute([$buyerId, $productId, Order::STATUS_COMPLETED]);
        return (int) $stmt->fetchColumn() > 0;
    }
}


// =============================================================================
// UserService
// =============================================================================

/**
 * UserService
 *
 * Handles profile updates and password changes.
 * Password changes require the user to confirm their current password first
 * — we never let someone change a password without knowing the old one.
 */
class UserService {

    /**
     * Update a user's profile information (name, phone, address).
     * Email changes are not allowed here — they would need re-verification.
     */
    public function updateProfile(int $userId, array $data): array {
        $user = User::findById($userId);

        if (!$user) {
            return ['success' => false, 'error' => 'User not found.'];
        }

        if (!empty($data['name'])) {
            $user->name = trim($data['name']);
        }

        if (isset($data['phone'])) {
            $user->phone = trim($data['phone']) ?: null;
        }

        if (isset($data['address'])) {
            $user->address = trim($data['address']) ?: null;
        }

        if (!$user->save()) {
            return ['success' => false, 'error' => 'Failed to update profile.'];
        }

        return ['success' => true];
    }

    /**
     * Change a user's password.
     * Requires the current password to prevent an attacker
     * who found a logged-in session from locking the real user out.
     */
    public function changePassword(int $userId, string $currentPassword, string $newPassword): array {
        $user = User::findById($userId);

        if (!$user) {
            return ['success' => false, 'error' => 'User not found.'];
        }

        if (!$user->verifyPassword($currentPassword)) {
            return ['success' => false, 'error' => 'Current password is incorrect.'];
        }

        if (strlen($newPassword) < 8) {
            return ['success' => false, 'error' => 'New password must be at least 8 characters.'];
        }

        if ($currentPassword === $newPassword) {
            return ['success' => false, 'error' => 'New password must be different from current password.'];
        }

        $user->setPassword($newPassword);

        if (!$user->save()) {
            return ['success' => false, 'error' => 'Failed to update password.'];
        }

        return ['success' => true];
    }

    /**
     * Upload a new profile picture for the user.
     */
    public function uploadProfilePicture(int $userId, array $file): array {
        $user = User::findById($userId);

        if (!$user) {
            return ['success' => false, 'error' => 'User not found.'];
        }

        $productService = new ProductService();
        $upload = $productService->handleImageUpload($file); // reuse the same validation

        if (!$upload['success']) return $upload;

        // Delete old picture from disk if it exists
        if ($user->profile_picture && file_exists($user->profile_picture)) {
            unlink($user->profile_picture);
        }

        $user->profile_picture = $upload['data']['path'];

        if (!$user->save()) {
            return ['success' => false, 'error' => 'Failed to save profile picture.'];
        }

        return ['success' => true, 'data' => ['path' => $user->profile_picture]];
    }

    public function getUserById(int $userId): array {
        $user = User::findById($userId);

        if (!$user) {
            return ['success' => false, 'error' => 'User not found.'];
        }

        return ['success' => true, 'data' => $user];
    }
}


// =============================================================================
// NotificationService
// =============================================================================

/**
 * NotificationService
 *
 * Creates in-platform notification records.
 * Every other service calls this when something notable happens:
 * order placed, payment confirmed, verification approved, etc.
 *
 * Nothing in here sends emails — that would be a separate EmailService.
 * This service only writes to the notifications table.
 */
class NotificationService {

    /**
     * Create a notification for a user.
     * Called by OrderService, PaymentService, VerificationService, etc.
     */
    public function notify(int $userId, string $message, string $type = Notification::TYPE_SYSTEM): bool {
        $notification          = new Notification();
        $notification->user_id = $userId;
        $notification->message = $message;
        $notification->type    = $type;
        $notification->is_read = false;

        return $notification->save();
    }

    /**
     * Fetch all unread notifications for a user.
     * Used to populate the notification bell in the navbar.
     */
    public function getUnread(int $userId): array {
        $db   = Database::getConnection();
        $stmt = $db->prepare(
            'SELECT * FROM notifications WHERE user_id = ? AND is_read = 0 ORDER BY created_at DESC'
        );
        $stmt->execute([$userId]);
        return ['success' => true, 'data' => $stmt->fetchAll()];
    }

    /**
     * Mark a single notification as read.
     * We check that the notification belongs to the requesting user
     * before marking it — users can't mark each other's notifications.
     */
    public function markRead(int $notificationId, int $userId): array {
        $notification = Notification::findById($notificationId);

        if (!$notification || $notification->user_id !== $userId) {
            return ['success' => false, 'error' => 'Notification not found.'];
        }

        $notification->markRead();
        return ['success' => true];
    }

    /**
     * Mark all of a user's notifications as read in one query.
     * Used when the user opens the notifications panel.
     */
    public function markAllRead(int $userId): array {
        $db   = Database::getConnection();
        $stmt = $db->prepare(
            'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0'
        );
        $stmt->execute([$userId]);
        return ['success' => true];
    }

    /**
     * Get the unread count only — for the badge number in the navbar.
     */
    public function getUnreadCount(int $userId): int {
        return Notification::countUnread($userId);
    }
}


// =============================================================================
// VerificationService
// =============================================================================

/**
 * VerificationService
 *
 * Manages the seller verification workflow.
 *
 * A seller uploads their ID document → admin reviews it → approved or rejected.
 * Verified sellers may get a badge on their listings (trust signal for buyers).
 *
 * A seller can only have one verification record at a time.
 * If rejected, they can resubmit — we update the existing record rather than
 * creating a new one.
 */
class VerificationService {

    const UPLOAD_DIR = 'public/uploads/verifications/';

    /**
     * Submit (or resubmit) a seller verification application.
     *
     * $docType — e.g. 'national_id', 'passport', 'drivers_licence'
     * $file    — the $_FILES entry for the document upload
     */
    public function submitVerification(int $sellerId, string $docType, array $file): array {
        // Validate the seller exists
        $seller = User::findById($sellerId);
        if (!$seller || !$seller->isSeller()) {
            return ['success' => false, 'error' => 'Seller account not found.'];
        }

        // Check for existing pending application — don't submit twice
        $existing = SellerVerification::findOneBy('seller_id', $sellerId);
        if ($existing && $existing->status === SellerVerification::STATUS_PENDING) {
            return ['success' => false, 'error' => 'You already have a pending verification application.'];
        }

        // Validate doc type
        $allowedTypes = ['national_id', 'passport', 'drivers_licence'];
        if (!in_array($docType, $allowedTypes)) {
            return ['success' => false, 'error' => 'Invalid document type.'];
        }

        // Handle file upload
        $upload = $this->handleDocumentUpload($file);
        if (!$upload['success']) return $upload;

        if ($existing) {
            // Resubmission after rejection — update the existing record
            if ($existing->doc_path && file_exists($existing->doc_path)) {
                unlink($existing->doc_path);
            }
            $existing->doc_type    = $docType;
            $existing->doc_path    = $upload['data']['path'];
            $existing->status      = SellerVerification::STATUS_PENDING;
            $existing->reviewed_by = null;
            $existing->reviewed_at = null;
            $existing->save();
            return ['success' => true, 'data' => ['verification_id' => $existing->id]];
        }

        // First-time submission
        $verification            = new SellerVerification();
        $verification->seller_id = $sellerId;
        $verification->doc_type  = $docType;
        $verification->doc_path  = $upload['data']['path'];
        $verification->status    = SellerVerification::STATUS_PENDING;
        $verification->save();

        return ['success' => true, 'data' => ['verification_id' => $verification->id]];
    }

    /**
     * Admin approves a seller's verification.
     */
    public function approveVerification(int $adminId, int $verificationId): array {
        $verification = SellerVerification::findById($verificationId);

        if (!$verification) {
            return ['success' => false, 'error' => 'Verification record not found.'];
        }

        $verification->status      = SellerVerification::STATUS_APPROVED;
        $verification->reviewed_by = $adminId;
        $verification->reviewed_at = date('Y-m-d H:i:s');
        $verification->save();

        // Notify the seller
        $notif = new NotificationService();
        $notif->notify(
            $verification->seller_id,
            'Your seller verification has been approved! Your listings now show a verified badge.',
            Notification::TYPE_SYSTEM
        );

        return ['success' => true];
    }

    /**
     * Admin rejects a seller's verification with a reason.
     */
    public function rejectVerification(int $adminId, int $verificationId, string $reason = ''): array {
        $verification = SellerVerification::findById($verificationId);

        if (!$verification) {
            return ['success' => false, 'error' => 'Verification record not found.'];
        }

        $verification->status      = SellerVerification::STATUS_REJECTED;
        $verification->reviewed_by = $adminId;
        $verification->reviewed_at = date('Y-m-d H:i:s');
        $verification->save();

        $notif   = new NotificationService();
        $message = 'Your seller verification was not approved.';
        if ($reason) $message .= ' Reason: ' . $reason;
        $message .= ' You may resubmit with corrected documents.';

        $notif->notify($verification->seller_id, $message, Notification::TYPE_SYSTEM);

        return ['success' => true];
    }

    public function getVerificationStatus(int $sellerId): array {
        $verification = SellerVerification::findOneBy('seller_id', $sellerId);
        return ['success' => true, 'data' => $verification];
    }

    public function getPendingVerifications(): array {
        return ['success' => true, 'data' => SellerVerification::findPending()];
    }

    private function handleDocumentUpload(array $file): array {
        if ($file['error'] !== UPLOAD_ERR_OK) {
            return ['success' => false, 'error' => 'Document upload failed.'];
        }

        $maxSize = 10 * 1024 * 1024; // 10 MB — ID docs can be larger than product images
        if ($file['size'] > $maxSize) {
            return ['success' => false, 'error' => 'Document must be smaller than 10 MB.'];
        }

        $finfo    = new finfo(FILEINFO_MIME_TYPE);
        $mime     = $finfo->file($file['tmp_name']);
        $allowed  = ['image/jpeg', 'image/png', 'application/pdf'];

        if (!in_array($mime, $allowed)) {
            return ['success' => false, 'error' => 'Documents must be JPEG, PNG, or PDF.'];
        }

        $extension   = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename    = 'verif_' . uniqid('', true) . '.' . strtolower($extension);
        $destination = self::UPLOAD_DIR . $filename;

        if (!is_dir(self::UPLOAD_DIR)) {
            mkdir(self::UPLOAD_DIR, 0755, true);
        }

        if (!move_uploaded_file($file['tmp_name'], $destination)) {
            return ['success' => false, 'error' => 'Could not save document to disk.'];
        }

        return ['success' => true, 'data' => ['path' => $destination]];
    }
}


// =============================================================================
// AdminService
// =============================================================================

/**
 * AdminService
 *
 * Platform-wide moderation and management tools.
 * Every method here requires the caller to be an Admin —
 * that check happens in the middleware before we get here.
 */
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
