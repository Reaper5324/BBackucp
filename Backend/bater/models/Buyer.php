<?php


class Buyer extends User{


public function getOrders(): array {
    return Order::findBy('buyer_id', $this->id);
}

public function getOrder(int $orderId): ?Order {

    $order = Order::findById($orderId);
    if ($order && $order->buyer_id === $this->id){

        return $order;
    }

        return null; //Temporary patch Review the logic  (validation)

}

public function getCartItems(): array{ 
return Cart::findBy('buyer_id', $this->id);
}


public function getCartCount(): int {

return count($this->getCartItems());


}

public function getReviews(): array{
    return Review::findBy('reviewer_id', $this->id);

}
 public function hasReviewedProduct(int $product_id): bool{

 $db = Database::getConnection();

 $stmt = $db->prepare(
    #SQl querY : bring back 1/0 of reviews where product _id ? and reviewer_id?
    'SELECT COUNT(*) FROM reviews WHERE reviewer_id = ? AND product_id = ?'
 );
    $stmt->execute([$this->id, $product_id]);
    return (int) $stmt->fetchColumn() > 0; #fetch column >0  //EDIT 

 }


 public static function findBuyerById(int $buyer_id): ?static{

        $user = User::findById($buyer_id);

        #if we do find the user and the user is a buyer (by role)
        if ($user && $user->isBuyer()){

            return static::fromRow((array) $user);

        }

        return null; //Exception Handling
 }
  


    
 

}
