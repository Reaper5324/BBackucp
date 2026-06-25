<?php

class OrderService {

    public function createOrderFromCart(int $buyerId): array {
        $cartItems = Cart::findBy('buyer_id', $buyerId);

        if (empty($cartItems)) {
            return ['success' => false, 'error' => 'No products found in cart.'];
        }

        $validatedItems = [];
        $sellerId = null;
        $total = 0.0;

        foreach ($cartItems as $cartItem) {
            $product = Product::findById($cartItem->product_id);

            if (!$product || $product->status !== Product::STATUS_ACTIVE) {
                return [
                    'success' => false,
                    'error'   => 'A product in your cart is no longer available.',
                ];
            }

            if (!$product->hasStock($cartItem->quantity)) {
                return [
                    'success' => false,
                    'error'   => "{$product->title} has only {$product->stock} in stock.",
                ];
            }

            if ($sellerId === null) {
                $sellerId = $product->seller_id;
            } elseif ((int) $product->seller_id !== (int) $sellerId) {
                return [
                    'success' => false,
                    'error'   => 'Your cart contains products from multiple sellers. Please checkout one seller at a time.',
                ];
            }

            if ((int) $product->seller_id === (int) $buyerId) {
                return ['success' => false, 'error' => 'You cannot purchase your own product.'];
            }

            $total += $product->price * $cartItem->quantity;
            $validatedItems[] = ['cart' => $cartItem, 'product' => $product];
        }

        $db = Database::getConnection();

        try {
            $db->beginTransaction();

            $order = new Order();
            $order->buyer_id = $buyerId;
            $order->seller_id = (int) $sellerId;
            $order->total_amount = round($total, 2);
            $order->status = Order::STATUS_PENDING;

            if (!$order->save()) {
                throw new RuntimeException('Could not create order record.');
            }

            foreach ($validatedItems as $entry) {
                $product  = $entry['product'];
                $cartItem = $entry['cart'];

                $item             = new OrderItem();
                $item->order_id   = (int) $order->id;
                $item->product_id = (int) $product->id;
                $item->quantity   = $cartItem->quantity;
                $item->unit_price = $product->price;

                if (!$item->save()) {
                    throw new RuntimeException("Could not save order item for product {$product->id}.");
                }

                if (!$product->decrementStock($cartItem->quantity)) {
                    throw new RuntimeException("Could not update stock for product {$product->id}.");
                }
            }

            Cart::clearForBuyer($buyerId);
            $db->commit();

            return [
                'success' => true,
                'data'    => [
                    'order_id' => $order->id,
                    'total'    => $order->total_amount,
                ],
            ];
        } catch (Throwable $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }

            return ['success' => false, 'error' => 'Order creation failed: ' . $e->getMessage()];
        }
    }

    
    public function markPaid(int $orderId, int $buyerId): array {
        $order = Order::findById($orderId);

        if (!$order) {
            return ['success' => false, 'error' => 'Order not found.'];
        }

        if ((int) $order->buyer_id !== (int) $buyerId) {
            return ['success' => false, 'error' => 'Access denied.'];
        }

        if ($order->status !== Order::STATUS_PENDING) {
            return ['success' => false, 'error' => "Order must be 'pending' to perform this action."];
        }

        $order->status = Order::STATUS_PAID;

        if (!$order->save()) {
            return ['success' => false, 'error' => 'Failed to update order status.'];
        }

        return ['success' => true, 'data' => ['order_id' => $orderId, 'status' => Order::STATUS_PAID]];
    }

    public function markDispatched(int $orderId, int $sellerId): array {
        return $this->transitionStatus($orderId, $sellerId, 'seller', Order::STATUS_PAID, Order::STATUS_DISPATCHED);
    }

    public function markDelivered(int $orderId, int $buyerId): array {
        return $this->transitionStatus($orderId, $buyerId, 'buyer', Order::STATUS_DISPATCHED, Order::STATUS_DELIVERED);
    }

    public function markCompleted(int $orderId, int $buyerId): array {
        return $this->transitionStatus($orderId, $buyerId, 'buyer', Order::STATUS_DELIVERED, Order::STATUS_COMPLETED);
    }

    public function cancelOrder(int $orderId, int $requestingUserId): array {
        $order = Order::findById($orderId);

        if (!$order) {
            return ['success' => false, 'error' => 'Order not found.'];
        }

        if ((int) $order->buyer_id !== (int) $requestingUserId && (int) $order->seller_id !== (int) $requestingUserId) {
            return ['success' => false, 'error' => 'You are not part of this order.'];
        }

        if ($order->status !== Order::STATUS_PENDING) {
            return ['success' => false, 'error' => 'This order can no longer be cancelled.'];
        }

        $db = Database::getConnection();

        try {
            $db->beginTransaction();

            foreach ($order->getItems() as $item) {
                $product = Product::findById($item->product_id);
                if ($product && !$product->restoreStock($item->quantity)) {
                    throw new RuntimeException("Could not restore stock for product {$item->product_id}.");
                }
            }

            $order->status = Order::STATUS_CANCELLED;
            if (!$order->save()) {
                throw new RuntimeException('Could not cancel order.');
            }

            $db->commit();

            return ['success' => true, 'data' => ['order_id' => $orderId]];
        } catch (Throwable $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }

            return ['success' => false, 'error' => 'Cancellation failed: ' . $e->getMessage()];
        }
    }

    public function getOrderById(int $orderId, int $requestingUserId): array {
        $order = Order::findById($orderId);

        if (!$order) {
            return ['success' => false, 'error' => 'Order not found.'];
        }

        if ((int) $order->buyer_id !== (int) $requestingUserId && (int) $order->seller_id !== (int) $requestingUserId) {
            return ['success' => false, 'error' => 'Access denied.'];
        }

        return ['success' => true, 'data' => $this->formatOrderDetail($order)];
    }

    public function getBuyerOrders(int $buyerId): array {
        $orders = Order::findBy('buyer_id', $buyerId);
        $formattedOrders = array_map(fn($order) => $this->formatOrderForList($order), $orders);
        return ['success' => true, 'data' => $formattedOrders];
    }

    public function getSellerOrders(int $sellerId): array {
        $orders = Order::findBy('seller_id', $sellerId);
        $formattedOrders = array_map(fn($order) => $this->formatOrderForList($order), $orders);
        return ['success' => true, 'data' => $formattedOrders];
    }

    private function formatOrderDetail(Order $order): array {
        $buyer  = $order->getBuyer();
        $seller = $order->getSeller();

        return [
            'id'           => $order->id,
            'buyer_id'     => $order->buyer_id,
            'seller_id'    => $order->seller_id,
            'total_amount' => $order->total_amount,
            'status'       => $order->status,
            'created_at'   => $order->created_at,
            'updated_at'   => $order->updated_at,
            'buyer_name'   => $buyer?->name ?? 'Unknown buyer',
            'buyer_email'  => $buyer?->email ?? '',
            'seller_name'  => $seller?->name ?? 'Unknown seller',
            'seller_email' => $seller?->email ?? '',
            'items'        => array_map(function (OrderItem $item): array {
                $product   = $item->getProduct();
                $unitPrice = (float) $item->unit_price;

                return [
                    'id'            => $item->id,
                    'order_id'      => $item->order_id,
                    'product_id'    => $item->product_id,
                    'product_title' => $product?->title ?? 'Product #' . $item->product_id,
                    'quantity'      => $item->quantity,
                    'unit_price'    => $unitPrice,
                    'price'         => $unitPrice,
                    'total'         => round($unitPrice * $item->quantity, 2),
                ];
            }, $order->getItems()),
        ];
    }

    private function formatOrderForList(Order $order): array {
        $buyer  = $order->getBuyer();
        $seller = $order->getSeller();

        return [
            'id'           => $order->id,
            'buyer_id'     => $order->buyer_id,
            'seller_id'    => $order->seller_id,
            'buyer_name'   => $buyer?->name ?? 'Unknown Buyer',
            'buyer_email'  => $buyer?->email ?? '',
            'seller_name'  => $seller?->name ?? 'Unknown Seller',
            'seller_email' => $seller?->email ?? '',
            'total_amount' => $order->total_amount,
            'total'        => $order->total_amount,
            'status'       => $order->status,
            'created_at'   => $order->created_at,
            'updated_at'   => $order->updated_at,
            'item_count'   => count($order->getItems()),
            'items'        => array_map(function (OrderItem $item): array {
                $product   = $item->getProduct();
                $unitPrice = (float) $item->unit_price;

                return [
                    'id'            => $item->id,
                    'order_id'      => $item->order_id,
                    'product_id'    => $item->product_id,
                    'product_title' => $product?->title ?? ('Product #' . $item->product_id),
                    'quantity'      => $item->quantity,
                    'unit_price'    => $unitPrice,
                    'price'         => $unitPrice,
                    'total'         => round($unitPrice * $item->quantity, 2),
                ];
            }, $order->getItems()),
        ];
    }

    private function transitionStatus(
        int $orderId,
        int $userId,
        string $role,
        string $fromStatus,
        string $toStatus
    ): array {
        $order = Order::findById($orderId);

        if (!$order) {
            return ['success' => false, 'error' => 'Order not found.'];
        }

        $ownerField = $role . '_id';
        if ((int) $order->$ownerField !== (int) $userId) {
            return ['success' => false, 'error' => 'Access denied.'];
        }

        if ($order->status !== $fromStatus) {
            return ['success' => false, 'error' => "Order must be '{$fromStatus}' to perform this action."];
        }

        $order->status = $toStatus;

        if (!$order->save()) {
            return ['success' => false, 'error' => 'Failed to update order status.'];
        }

        return ['success' => true, 'data' => ['order_id' => $orderId, 'status' => $toStatus]];
    }
}