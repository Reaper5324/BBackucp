<?php

class OrderController extends Controller {

    private OrderService $orders;

    public function __construct() {
        $this->orders = new OrderService();
    }

    public function createFromCart(): void {
        $user = AuthMiddleware::handle();
        RoleMiddleware::requireBuyer($user);

        $result = $this->orders->createOrderFromCart($user->id);
        $this->json($result, $result['success'] ? 201 : 422);
    }

    public function show(string $id): void {
        $user = AuthMiddleware::handle();
        $result = $this->orders->getOrderById((int) $id, $user->id);
        $this->json($result, $result['success'] ? 200 : 404);
    }

    public function buyerOrders(): void {
        $user = AuthMiddleware::handle();
        RoleMiddleware::requireBuyer($user);

        $this->json($this->orders->getBuyerOrders($user->id));
    }

    public function sellerOrders(): void {
        $user = AuthMiddleware::handle();
        RoleMiddleware::requireSeller($user);

        $this->json($this->orders->getSellerOrders($user->id));
    }

    public function cancel(string $id): void {
        $user = AuthMiddleware::handle();
        $result = $this->orders->cancelOrder((int) $id, $user->id);
        $this->json($result, $result['success'] ? 200 : 422);
    }

    public function dispatch(string $id): void {
        $user = AuthMiddleware::handle();
        RoleMiddleware::requireSeller($user);

        $result = $this->orders->markDispatched((int) $id, $user->id);
        $this->json($result, $result['success'] ? 200 : 422);
    }

    public function Paid(string $id): void {
        $user = AuthMiddleware::handle();
        RoleMiddleware::requireSeller($user);

        $result = $this->orders->markPaid((int) $id, $user->id);
        $this->json($result, $result['success'] ? 200 : 422);
    }

    public function delivered(string $id): void {
        $user = AuthMiddleware::handle();
        RoleMiddleware::requireBuyer($user);

        $result = $this->orders->markDelivered((int) $id, $user->id);
        $this->json($result, $result['success'] ? 200 : 422);
    }

    public function complete(string $id): void {
        $user = AuthMiddleware::handle();
        RoleMiddleware::requireBuyer($user);

        $result = $this->orders->markCompleted((int) $id, $user->id);
        $this->json($result, $result['success'] ? 200 : 422);
    }
}
