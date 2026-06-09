<?php
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
