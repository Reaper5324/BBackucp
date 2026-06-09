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