<?php
class Message extends Model {

    protected static string $table = 'messages';

    public function __construct(
        public int     $sender_id   = 0,
        public int     $receiver_id = 0,
        public int     $product_id  = 0,
        public string  $body        = '',
        public bool    $is_read     = false,
        public ?string $sent_at     = null
    ) {}

    /** Fetch all message threads for a user */
    public static function getThreadsForUser(int $userId): array {
        $db   = Database::getConnection();
        $stmt = $db->prepare(
            'SELECT 
                m.id,
                m.sender_id,
                m.receiver_id,
                m.product_id,
                m.body,
                m.is_read,
                m.sent_at,
                p.title as product_name,
                CASE 
                    WHEN m.sender_id = ? THEN u_receiver.name 
                    ELSE u_sender.name 
                END as other_user_name,
                CASE 
                    WHEN m.sender_id = ? THEN m.receiver_id 
                    ELSE m.sender_id 
                END as other_user_id
             FROM messages m
             LEFT JOIN products p ON m.product_id = p.id
             LEFT JOIN users u_sender ON m.sender_id = u_sender.id
             LEFT JOIN users u_receiver ON m.receiver_id = u_receiver.id
             WHERE m.sender_id = ? OR m.receiver_id = ?
             ORDER BY m.sent_at DESC'
        );
        $stmt->execute([$userId, $userId, $userId, $userId]);
        $rows = $stmt->fetchAll();

        // Group threads and return last message of each thread
        $threads = [];
        $threadKeys = [];

        foreach ($rows as $row) {
            $key = $row['product_id'] . '-' . $row['other_user_id'];
            if (!isset($threadKeys[$key])) {
                $threadKeys[$key] = true;
                $threads[] = $row;
            }
        }

        return $threads;
    }

    /** Fetch all messages in a thread between two users about a product. */
    public static function getThread(int $userA, int $userB, int $productId): array {
        $db   = Database::getConnection();
        $stmt = $db->prepare(
            'SELECT * FROM messages
             WHERE product_id = ?
               AND ((sender_id = ? AND receiver_id = ?)
                OR  (sender_id = ? AND receiver_id = ?))
             ORDER BY sent_at ASC'
        );
        $stmt->execute([$productId, $userA, $userB, $userB, $userA]);
        return array_map(fn($row) => static::fromRow($row), $stmt->fetchAll());
    }

    /** Mark this message as read. */
    public function markRead(): bool {
        $this->is_read = true;
        return $this->save();
    }

    protected function toArray(): array {
        return [
            'sender_id'   => $this->sender_id,
            'receiver_id' => $this->receiver_id,
            'product_id'  => $this->product_id,
            'body'        => $this->body,
            'is_read'     => (int) $this->is_read,
        ];
    }

    protected static function fromRow(array $row): static {
        $m              = new static();
        $m->id          = (int)  $row['id'];
        $m->sender_id   = (int)  $row['sender_id'];
        $m->receiver_id = (int)  $row['receiver_id'];
        $m->product_id  = (int)  $row['product_id'];
        $m->body        =        $row['body'];
        $m->is_read     = (bool) $row['is_read'];
        $m->sent_at     =        $row['sent_at'] ?? null;
        return $m;
    }
}

 ?>