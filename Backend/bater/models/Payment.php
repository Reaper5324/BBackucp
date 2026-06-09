<?php

class Payment extends Model {

    protected static string $table = 'payments';

    const STATUS_PENDING   = 'pending';
    const STATUS_COMPLETED = 'completed';
    const STATUS_FAILED    = 'failed';
    const STATUS_REFUNDED  = 'refunded';

    public function __construct(
        public int     $order_id      = 0,
        public ?string $pf_payment_id = null,   // PayFast's pf_payment_id from ITN
        public ?string $pf_data       = null,    // serialised form fields sent to PayFast
        public float   $amount        = 0.0,
        public string  $status        = self::STATUS_PENDING,
        public ?string $created_at    = null
    ) {}

    public function isCompleted(): bool { return $this->status === self::STATUS_COMPLETED; }
    public function isFailed(): bool    { return $this->status === self::STATUS_FAILED; }

    /** Fetch the Order this payment belongs to. */
    public function getOrder(): ?Order {
        return Order::findById($this->order_id);
    }

    protected function toArray(): array {
        return [
            'order_id'      => $this->order_id,
            'pf_payment_id' => $this->pf_payment_id,
            'pf_data'       => $this->pf_data,
            'amount'        => $this->amount,
            'status'        => $this->status,
        ];
    }

    protected static function fromRow(array $row): static {
        $p               = new static();
        $p->id           = (int)   $row['id'];
        $p->order_id     = (int)   $row['order_id'];
        $p->pf_payment_id =        $row['pf_payment_id'] ?? null;
        $p->pf_data      =         $row['pf_data'] ?? null;
        $p->amount       = (float) $row['amount'];
        $p->status       =         $row['status'];
        $p->created_at   =         $row['created_at'] ?? null;
        return $p;
    }
}
