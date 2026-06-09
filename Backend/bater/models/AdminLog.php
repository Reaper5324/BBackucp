<?php

class AdminLog extends Model {

    protected static string $table = 'admin_logs';

    public function __construct(
        public int     $admin_id          = 0,
        public string  $action            = '',
        public ?int    $target_user_id    = null,
        public ?int    $target_product_id = null,
        public string  $notes             = '',
        public ?string $created_at        = null
    ) {}

    /** Fetch the Admin who performed this action. */
    public function getAdmin(): ?User {
        return User::findById($this->admin_id);
    }

    protected function toArray(): array {
        return [
            'admin_id'          => $this->admin_id,
            'action'            => $this->action,
            'target_user_id'    => $this->target_user_id,
            'target_product_id' => $this->target_product_id,
            'notes'             => $this->notes,
        ];
    }

    protected static function fromRow(array $row): static {
        $l                    = new static();
        $l->id                = (int)  $row['id'];
        $l->admin_id          = (int)  $row['admin_id'];
        $l->action            =        $row['action'];
        $l->target_user_id    =        isset($row['target_user_id'])    ? (int) $row['target_user_id']    : null;
        $l->target_product_id =        isset($row['target_product_id']) ? (int) $row['target_product_id'] : null;
        $l->notes             =        $row['notes'] ?? '';
        $l->created_at        =        $row['created_at'] ?? null;
        return $l;
    }
}


?>