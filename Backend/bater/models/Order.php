<?php

class Order extends Model{

protected static string $table = 'orders';

#Order status codes
    const STATUS_PENDING    = 'pending';     
    const STATUS_PAID       = 'paid';        
    const STATUS_DISPATCHED = 'dispatched';  
    const STATUS_DELIVERED  = 'delivered';   
    const STATUS_COMPLETED  = 'completed';   
    const STATUS_CANCELLED  = 'cancelled';  


public function __construct(
    public int $buyer_id = 0,
    public int $seller_id = 0,
    public float $total_amount= 0.0,
    public string $status = self::STATUS_PENDING,
    public ?string $created_at = null,
    public ?string $updated_at = null #replace with TimeDate

)

{
    //throw new \Exception('Not implemented');
}

#Status changing functions 
public function markPaid(): bool{
    $this->status = self::STATUS_PAID;
    return $this->save();
}

public function markDispatched(): bool{
    $this->status = self::STATUS_DISPATCHED;
    return $this->save();

}

public function markDelivered(): bool{
    $this->status = self::STATUS_DELIVERED;
    return $this->save();
}

public function markCompleted(): bool{
    $this->status = self::STATUS_COMPLETED;
    return $this->save();

}

public function markCancelled(): bool{
    $this->status = self::STATUS_CANCELLED;
    //call delete Order
    return $this->save();
}
public function markPending(): bool{
    $this->status = self::STATUS_PENDING;
    return $this->save();
}

public function is_Cancellable(): bool{
    return $this->status === self::STATUS_PENDING;
}

public function getItems(): array{
    return OrderItem::findBy('order_id', $this->id);
}

#payment functions 
public function getPayment(): ?Payment {
    return Payment::findOneBy('order_id', $this->id);

}

public function getBuyer(): ?User{
    return User::findById($this->buyer_id);


}

public function getSeller(): ?User{
    return User::findById($this->seller_id);
}

protected function toArray(): array {
    return [
        'buyer_id' => $this->buyer_id,
        'seller_id' => $this->seller_id,
        'total_amount' => $this->total_amount,
        'status' => $this->status,
    ];
}

protected static function fromRow(array $row): static {

$o = new static();
$o->id = (int) $row['id'];
$o->buyer_id = (int) $row['buyer_id'];
$o->seller_id =(int) $row['seller_id'];
$o->total_amount= (float) $row['total_amount'];
$o->status = $row['status'];
$o->created_at = $row['created_at'] ?? null;
$o->updated_at = $row['updated_at'] ?? null;
return $o;
}

#



}







?>
