<?php
class Notification extends Model {

    protected static string $table = 'notifications';

    // Type constants keep notification rendering consistent on the frontend.
    const TYPE_ORDER   = 'order';
    const TYPE_PAYMENT = 'payment';
    const TYPE_REVIEW  = 'review';
    const TYPE_SYSTEM  = 'system';

    public function __construct(
        public int     $user_id    = 0,
        public string  $message    = '',
        public string  $type       = self::TYPE_SYSTEM,
        public bool    $is_read    = false,
        public ?string $created_at = null
    ) {}

    /** Mark this notification as read. */
    public function markRead(): bool {
        $this->is_read = true;
        return $this->save();
    }

    /** Count unread notifications for a given user. */
    public static function countUnread(int $userId): int {
        $db   = Database::getConnection();
        $stmt = $db->prepare(
            'SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0'
        );
        $stmt->execute([$userId]);
        return (int) $stmt->fetchColumn();
    }

    protected function toArray(): array {
        return [
            'user_id'  => $this->user_id,
            'message'  => $this->message,
            'type'     => $this->type,
            'is_read'  => (int) $this->is_read,
        ];
    }

    protected static function fromRow(array $row): static {
        $n            = new static();
        $n->id        = (int)  $row['id'];
        $n->user_id   = (int)  $row['user_id'];
        $n->message   =        $row['message'];
        $n->type      =        $row['type'];
        $n->is_read   = (bool) $row['is_read'];
        $n->created_at=        $row['created_at'] ?? null;
        return $n;
    }
}

?>