<?php
class NotificationService {

    
    public function notify(int $userId, string $message, string $type = Notification::TYPE_SYSTEM): bool {
        $notification          = new Notification();
        $notification->user_id = $userId;
        $notification->message = $message;
        $notification->type    = $type;
        $notification->is_read = false;

        return $notification->save();
    }

    
    public function getUnread(int $userId): array {
        $db   = Database::getConnection();
        $stmt = $db->prepare(
            'SELECT * FROM notifications WHERE user_id = ? AND is_read = 0 ORDER BY created_at DESC'
        );
        $stmt->execute([$userId]);
        return ['success' => true, 'data' => $stmt->fetchAll()];
    }

    
    public function markRead(int $notificationId, int $userId): array {
        $notification = Notification::findById($notificationId);

        if (!$notification || $notification->user_id !== $userId) {
            return ['success' => false, 'error' => 'Notification not found.'];
        }

        $notification->markRead();
        return ['success' => true];
    }

        public function markAllRead(int $userId): array {
        $db   = Database::getConnection();
        $stmt = $db->prepare(
            'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0'
        );
        $stmt->execute([$userId]);
        return ['success' => true];
    }

        public function getUnreadCount(int $userId): int {
        return Notification::countUnread($userId);
    }
}
