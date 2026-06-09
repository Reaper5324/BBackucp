<?php

class CartController extends Controller {

    // GET /cart
    // Returns cart items with product details joined in
    public function index(): void {
        $user  = AuthMiddleware::handle();
        RoleMiddleware::requireBuyer($user);

        $items = Cart::findBy('buyer_id', $user->id);

        // Attach product data to each item so the frontend
        // doesn't need to make a second request per item
        $data = array_map(function (Cart $item) {
            $product = Product::findById($item->product_id);
            return [
                'cart_item_id' => $item->id,
                'product_id'   => $item->product_id,
                'quantity'     => $item->quantity,
                'product'      => $product ? [
                    'title'      => $product->title,
                    'price'      => $product->price,
                    'image_path' => $product->image_path,
                    'stock'      => $product->stock,
                    'status'     => $product->status,
                ] : null,
                'subtotal'     => $item->getSubtotal(),
            ];
        }, $items);

        $this->json([
            'success' => true,
            'data'    => [
                'items' => $data,
                'total' => Cart::calculateTotal($user->id),
                'count' => count($items),
            ],
        ]);
    }

    // POST /cart
    // Body: { "product_id": 7, "quantity": 1 }
    public function add(): void {
        $user = AuthMiddleware::handle();
        RoleMiddleware::requireBuyer($user);

        $body      = $this->body();
        $productId = (int) ($body['product_id'] ?? 0);
        $quantity  = max(1, (int) ($body['quantity'] ?? 1));

        if (!$productId) {
            $this->json(['success' => false, 'error' => 'product_id is required.'], 422);
        }

        $product = Product::findById($productId);

        if (!$product || $product->status !== Product::STATUS_ACTIVE) {
            $this->json(['success' => false, 'error' => 'Product not available.'], 404);
        }

        if (!$product->hasStock($quantity)) {
            $this->json(['success' => false, 'error' => "Only {$product->stock} in stock."], 422);
        }

        // Buyer cannot add their own product to their cart
        if ($product->seller_id === $user->id) {
            $this->json(['success' => false, 'error' => 'You cannot buy your own product.'], 422);
        }

        $item = Cart::addItem($user->id, $productId, $quantity);

        $this->json(['success' => true, 'data' => ['cart_item_id' => $item->id]], 201);
    }

    // POST /cart/{productId}  (_method=PUT)
    // Body: { "quantity": 3 }
    public function update(string $productId): void {
        $user     = AuthMiddleware::handle();
        RoleMiddleware::requireBuyer($user);

        $quantity = max(1, (int) ($this->body()['quantity'] ?? 1));

        $product = Product::findById((int) $productId);
        if (!$product || $product->status !== Product::STATUS_ACTIVE) {
            $this->json(['success' => false, 'error' => 'Product not available.'], 404);
        }

        if (!$product->hasStock($quantity)) {
            $this->json(['success' => false, 'error' => "Only {$product->stock} in stock."], 422);
        }

        $db   = Database::getConnection();
        $stmt = $db->prepare(
            'UPDATE cart SET quantity = ? WHERE buyer_id = ? AND product_id = ?'
        );
        $ok   = $stmt->execute([$quantity, $user->id, (int) $productId]);

        if (!$ok || $stmt->rowCount() === 0) {
            $this->json(['success' => false, 'error' => 'Item not found in cart.'], 404);
        }

        $this->json(['success' => true]);
    }

    // DELETE /cart/{productId}
    public function remove(string $productId): void {
        $user = AuthMiddleware::handle();
        RoleMiddleware::requireBuyer($user);

        Cart::removeItem($user->id, (int) $productId);
        $this->json(['success' => true]);
    }

    // DELETE /cart
    public function clear(): void {
        $user = AuthMiddleware::handle();
        RoleMiddleware::requireBuyer($user);

        Cart::clearForBuyer($user->id);
        $this->json(['success' => true]);
    }
}
