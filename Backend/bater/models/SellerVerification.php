<?php
class SellerVerification extends Model {

    protected static string $table = 'seller_verifications';

    const STATUS_PENDING  = 'pending';
    const STATUS_APPROVED = 'approved';
    const STATUS_REJECTED = 'rejected';

    public function __construct(
        public int     $seller_id   = 0,
        public string  $doc_type    = '',   // e.g. 'national_id', 'passport'
        public string  $doc_path    = '',
        public string  $status      = self::STATUS_PENDING,
        public ?int    $reviewed_by = null,
        public ?string $reviewed_at = null,
        public ?string $created_at  = null
    ) {}

    public function isPending(): bool  { return $this->status === self::STATUS_PENDING; }
    public function isApproved(): bool { return $this->status === self::STATUS_APPROVED; }
    public function isRejected(): bool { return $this->status === self::STATUS_REJECTED; }

    /** Fetch the Seller this record belongs to. */
    public function getSeller(): ?User {
        return User::findById($this->seller_id);
    }

    /** Fetch the Admin who reviewed this application. */
    public function getReviewer(): ?User {
        return $this->reviewed_by ? User::findById($this->reviewed_by) : null;
    }

    /** Fetch all pending verifications (for the admin queue). */
    public static function findPending(): array {
        return static::findBy('status', self::STATUS_PENDING);
    }

    protected function toArray(): array {
        return [
            'seller_id'   => $this->seller_id,
            'doc_type'    => $this->doc_type,
            'doc_path'    => $this->doc_path,
            'status'      => $this->status,
            'reviewed_by' => $this->reviewed_by,
            'reviewed_at' => $this->reviewed_at,
        ];
    }

    protected static function fromRow(array $row): static {
        $v              = new static();
        $v->id          = (int)  $row['id'];
        $v->seller_id   = (int)  $row['seller_id'];
        $v->doc_type    =        $row['doc_type'];
        $v->doc_path    =        $row['doc_path'];
        $v->status      =        $row['status'];
        $v->reviewed_by =        isset($row['reviewed_by']) ? (int) $row['reviewed_by'] : null;
        $v->reviewed_at =        $row['reviewed_at'] ?? null;
        $v->created_at  =        $row['created_at'] ?? null;
        return $v;
    }
}



?>