<?php

/**
 * Cart
 *
 * Holds the products a Buyer has selected before checkout.
 * Each row is one product in the cart with a quantity.
 * Cart is cleared once an Order is created from it.
 *
 * Collaborators: Buyer, Product, OrderService
 */
class Cart extends Model {

    protected static string $table = 'cart';

    public function __construct(
        public int     $buyer_id   = 0,
        public int     $product_id = 0,
        public int     $quantity   = 1,
        public ?string $created_at = null
    ) {}

    // ------------------------------------------------------------------
    // Domain helpers
    // ------------------------------------------------------------------

    /**
     * Add a product to the buyer's cart.
     * If the product is already in the cart, increment the quantity instead.
     */
    public static function addItem(int $buyerId, int $productId, int $quantity = 1): static {
        $existing = static::findExistingItem($buyerId, $productId);

        if ($existing) {
            $existing->quantity += $quantity;
            $existing->save();
            return $existing;
        }

        $item             = new static();
        $item->buyer_id   = $buyerId;
        $item->product_id = $productId;
        $item->quantity   = $quantity;
        $item->save();
        return $item;
    }

    /**
     * Remove a specific item from the buyer's cart.
     */
    public static function removeItem(int $buyerId, int $productId): bool {
        $item = static::findExistingItem($buyerId, $productId);
        return $item ? $item->delete() : false;
    }

    /**
     * Clear all items from a buyer's cart.
     * Called by OrderService after a successful order is placed.
     */
    public static function clearForBuyer(int $buyerId): bool {
        $db   = Database::getConnection();
        $stmt = $db->prepare('DELETE FROM cart WHERE buyer_id = ?');
        return $stmt->execute([$buyerId]);
    }

    /**
     * Calculate the total cost of all items in the buyer's cart.
     */
    public static function calculateTotal(int $buyerId): float {
        $db   = Database::getConnection();
        $stmt = $db->prepare(
            'SELECT SUM(c.quantity * p.price)
             FROM cart c
             JOIN products p ON c.product_id = p.id
             WHERE c.buyer_id = ?'
        );
        $stmt->execute([$buyerId]);
        return round((float) $stmt->fetchColumn(), 2);
    }

    /**
     * Find a cart row for a specific buyer + product combination.
     */
    private static function findExistingItem(int $buyerId, int $productId): ?static {
        $db   = Database::getConnection();
        $stmt = $db->prepare(
            'SELECT * FROM cart WHERE buyer_id = ? AND product_id = ? LIMIT 1'
        );
        $stmt->execute([$buyerId, $productId]);
        $row = $stmt->fetch();
        return $row ? static::fromRow($row) : null;
    }

    /** Fetch the Product object for this cart item. */
    public function getProduct(): ?Product {
        return Product::findById($this->product_id);
    }

    /** Calculate the subtotal for this single cart item. */
    public function getSubtotal(): float {
        $product = $this->getProduct();
        return $product ? round($product->price * $this->quantity, 2) : 0.0;
    }

    // ------------------------------------------------------------------
    // Model contract
    // ------------------------------------------------------------------

    protected function toArray(): array {
        return [
            'buyer_id'   => $this->buyer_id,
            'product_id' => $this->product_id,
            'quantity'   => $this->quantity,
        ];
    }

    protected static function fromRow(array $row): static {
        $item             = new static();
        $item->id         = (int) $row['id'];
        $item->buyer_id   = (int) $row['buyer_id'];
        $item->product_id = (int) $row['product_id'];
        $item->quantity   = (int) $row['quantity'];
        $item->created_at =       $row['created_at'] ?? null;
        return $item;
    }
}
?>