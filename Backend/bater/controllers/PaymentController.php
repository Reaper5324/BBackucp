<?php

class PaymentController extends Controller {

    private PaymentService $payments;

    public function __construct() {
        $this->payments = new PaymentService();
    }

    public function initiate(): void {
        $user = AuthMiddleware::handle();
        RoleMiddleware::requireBuyer($user);

        $orderId = (int) ($this->body()['order_id'] ?? 0);

        if (!$orderId) {
            $this->json(['success' => false, 'error' => 'order_id is required.'], 422);
        }

        $result = $this->payments->initiatePayment($orderId);
        $this->json($result, $result['success'] ? 200 : 422);
    }

    public function itn(): void {
        $ok = $this->payments->handleItn($_POST);
        http_response_code($ok ? 200 : 400);
        exit();
    }

    public function forOrder(string $orderId): void {
        $user = AuthMiddleware::handle();
        $result = $this->payments->getPaymentForOrder((int) $orderId);

        if ($result['success']) {
            $order = $result['data']->getOrder();
            if (!$order || ($order->buyer_id !== $user->id && $order->seller_id !== $user->id)) {
                $this->json(['success' => false, 'error' => 'Access denied.'], 403);
            }
        }

        $this->json($result, $result['success'] ? 200 : 404);
    }

    public function paymentForm(string $orderId): void {
        $user = AuthMiddleware::handle();
        RoleMiddleware::requireBuyer($user);

        $result = $this->payments->getPaymentRedirectForm((int) $orderId);

        if ($result['success']) {
            header('Content-Type: text/html; charset=UTF-8');
            echo '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Processing Payment...</title>
</head>
<body onload="document.getElementById(\'payfast-form\').submit();">
    <p>Redirecting to payment gateway...</p>' . $result['html'] . '
</body>
</html>';
            exit();
        } else {
            $this->json($result, 422);
        }
    }
}
