<?php

class Seller extends User {

    public function getProducts(): array {
        return Product::findBy('seller_id', $this->id);
    }

    public function getActiveProducts(): array {
        $db   = Database::getConnection();
        $stmt = $db->prepare(
            "SELECT * FROM products WHERE seller_id = ? AND status = 'active'"
        );
        $stmt->execute([$this->id]);
        return array_map(fn($row) => Product::fromRowPublic($row), $stmt->fetchAll());
    }

    public function ownsProduct(int $productId): bool {
        $product = Product::findById($productId);
        return $product?->seller_id === $this->id;
    }

    public function getProductCount(): int {
        $db   = Database::getConnection();
        $stmt = $db->prepare('SELECT COUNT(*) FROM products WHERE seller_id = ?');
        $stmt->execute([$this->id]);
        return (int) $stmt->fetchColumn();
    }

    public function getOrders(): array {
        return Order::findBy('seller_id', $this->id);
    }

    public function getOrder(int $orderId): ?Order {
        $order = Order::findById($orderId);

        if ($order && $order->seller_id === $this->id) {
            return $order;
        }

        return null;
    }

    public function getVerification(): ?SellerVerification {
        return SellerVerification::findOneBy('seller_id', $this->id);
    }

    public function isVerified(): bool {
        $verification = $this->getVerification();
        return $verification?->status === SellerVerification::STATUS_APPROVED;
    }

    public static function findSellerById(int $id): ?static {
        $user = User::findById($id);

        if ($user && $user->isSeller()) {
            return static::fromRow((array) $user);
        }

        return null;
    }
}
