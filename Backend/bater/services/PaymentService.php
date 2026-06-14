<?php

class PaymentService {

    // PayFast endpoints
    const URL_SANDBOX    = 'https://sandbox.payfast.co.za/eng/process';
    const URL_PRODUCTION = 'https://www.payfast.co.za/eng/process';
    const URL_VALIDATE   = 'https://sandbox.payfast.co.za/eng/query/validate';


    public function initiatePayment(int $orderId): array {
        $order = Order::findById($orderId);

        if (!$order) {
            return ['success' => false, 'error' => 'Order not found.'];
        }

        if ($order->status !== Order::STATUS_PENDING) {
            return ['success' => false, 'error' => 'This order cannot be paid.'];
        }

        $existingPayment = Payment::findOneBy('order_id', $orderId);
        if ($existingPayment) {
            if ($existingPayment->status === Payment::STATUS_PENDING) {
                return [
                    'success' => true,
                    'data'    => [
                        'payment_url' => API_URL . '/payments/form/' . $orderId,
                        'payfast_url' => PAYFAST_SANDBOX ? self::URL_SANDBOX : self::URL_PRODUCTION,
                    ],
                ];
            }

            return ['success' => false, 'error' => 'A payment for this order already exists.'];
        }

        // Fetch buyer details for PayFast (improves their fraud detection)
        $buyer = User::findById($order->buyer_id);

        // Build the fields PayFast requires.
        // PayFast's custom payment signature is generated over this exact order.
        $fields = [
            'merchant_id'  => PAYFAST_MERCHANT_ID,
            'merchant_key' => PAYFAST_MERCHANT_KEY,
            // Append order_id so the frontend can poll for confirmed status after redirect
            'return_url'   => PAYFAST_RETURN_URL . '?order_id=' . $orderId,
            'cancel_url'   => PAYFAST_CANCEL_URL . '?order_id=' . $orderId,
            'notify_url'   => PAYFAST_NOTIFY_URL,

            // Buyer info (optional but recommended)
            'name_first'   => $buyer ? explode(' ', $buyer->name)[0] : '',
            'email_address'=> $buyer?->email ?? '',

            // Payment details
            'm_payment_id' => (string) $orderId,   // our reference — returned in ITN
            'amount'       => number_format($order->total_amount, 2, '.', ''),
            'item_name'    => 'Bater Order #' . $orderId,
            'item_description' => 'Purchase via Bater marketplace',
        ];

        // Filter BEFORE signature generation
        $fields = array_filter($fields, fn($v) => $v !== '' && $v !== null);

        // Generate signature on the actual fields being sent, preserving order.
        $fields['signature'] = $this->generateSignature($fields);

        // Store a pending payment record so we can match it when the ITN arrives
        $payment           = new Payment();
        $payment->order_id = $orderId;
        $payment->pf_data  = json_encode($fields);
        $payment->amount   = $order->total_amount;
        $payment->status   = Payment::STATUS_PENDING;
        $payment->save();

        return [
            'success' => true,
            'data'    => [
                'payment_url' => API_URL . '/payments/form/' . $orderId,
                'payfast_url' => PAYFAST_SANDBOX ? self::URL_SANDBOX : self::URL_PRODUCTION,
                'fields'      => $fields,
            ],
        ];
    }

    public function getPaymentRedirectForm(int $orderId): array {
        $payment = Payment::findOneBy('order_id', $orderId);

        if (!$payment) {
            return ['success' => false, 'error' => 'Payment not found.'];
        }

        $fields = json_decode($payment->pf_data, true);

        if (!$fields) {
            return ['success' => false, 'error' => 'Invalid payment data.'];
        }

        $order = $payment->getOrder();
        if (!$order) {
            return ['success' => false, 'error' => 'Order not found.'];
        }

        $fields['merchant_id']  = PAYFAST_MERCHANT_ID;
        $fields['merchant_key'] = PAYFAST_MERCHANT_KEY;
        // Append order_id so the frontend can poll for confirmed status after redirect
        $fields['return_url']   = PAYFAST_RETURN_URL . '?order_id=' . $order->id;
        $fields['cancel_url']   = PAYFAST_CANCEL_URL . '?order_id=' . $order->id;
        $fields['notify_url']   = PAYFAST_NOTIFY_URL;
        $fields['m_payment_id'] = (string) $order->id;
        $fields['amount']       = number_format($order->total_amount, 2, '.', '');
        $fields['item_name']    = 'Bater Order #' . $order->id;

        $fields = array_filter($fields, fn($v) => $v !== '' && $v !== null);
        $fields['signature']    = $this->generateSignature($fields);
        $payment->pf_data       = json_encode($fields);
        $payment->save();

        $payfast_url = PAYFAST_SANDBOX ? self::URL_SANDBOX : self::URL_PRODUCTION;

        // Generate HTML form for redirect
        $form_html = sprintf(
            '<form id="payfast-form" action="%s" method="POST">%s</form><script>document.getElementById("payfast-form").submit();</script>',
            htmlspecialchars($payfast_url),
            implode("\n", array_map(
                fn($key, $value) => sprintf('<input type="hidden" name="%s" value="%s">', htmlspecialchars($key), htmlspecialchars($value)),
                array_keys($fields),
                $fields
            ))
        );

        return [
            'success' => true,
            'html'    => $form_html,
        ];
    }

    public function handleItn(array $itnData): bool {
        // --- Step 1: Verify signature ---
        if (!$this->verifySignature($itnData)) {
            error_log('PayFast ITN: signature mismatch');
            return false;
        }

        // --- Step 2: Validate with PayFast's server ---
        if (!$this->validateWithPayFast($itnData)) {
            error_log('PayFast ITN: server validation failed');
            return false;
        }

        // --- Step 3: Find our order using m_payment_id ---
        $orderId = (int) ($itnData['m_payment_id'] ?? 0);
        $order   = Order::findById($orderId);

        if (!$order) {
            error_log('PayFast ITN: order not found — m_payment_id: ' . $orderId);
            return false;
        }

        $payment = Payment::findOneBy('order_id', $orderId);

        if (!$payment) {
            error_log('PayFast ITN: payment record not found for order ' . $orderId);
            return false;
        }

        // --- Step 4: Verify amount matches (prevents tampering) ---
        $itnAmount  = (float) ($itnData['amount_gross'] ?? 0);
        $difference = abs($itnAmount - $payment->amount);

        if ($difference > 0.01) {  // allow 1 cent rounding tolerance
            error_log("PayFast ITN: amount mismatch. Expected {$payment->amount}, got {$itnAmount}");
            return false;
        }

        // --- Update records based on payment_status ---
        $paymentStatus = $itnData['payment_status'] ?? '';

        if ($paymentStatus === 'COMPLETE') {
            $payment->pf_payment_id = $itnData['pf_payment_id'] ?? null;
            $payment->status        = Payment::STATUS_COMPLETED;
            $payment->save();
            $order->markPaid();

        } elseif ($paymentStatus === 'FAILED' || $paymentStatus === 'CANCELLED') {
            $payment->status = Payment::STATUS_FAILED;
            $payment->save();
            // Leave the order as PENDING so the buyer can try again
        }

        return true;
    }

    public function getPaymentForOrder(int $orderId): array {
        $payment = Payment::findOneBy('order_id', $orderId);

        if (!$payment) {
            return ['success' => false, 'error' => 'No payment found for this order.'];
        }

        return ['success' => true, 'data' => $payment];
    }

    private function generateSignature(array $fields): string {
        // Remove signature field if present (we're generating it)
        unset($fields['signature']);

        $parts = [];
        foreach ($fields as $key => $value) {
            $parts[] = $key . '=' . urlencode(trim((string) $value));
        }

        $queryString = implode('&', $parts);

        if (!empty(PAYFAST_PASSPHRASE)) {
            $queryString .= '&passphrase=' . urlencode(trim(PAYFAST_PASSPHRASE));
        }

        return md5($queryString);
    }

    private function verifySignature(array $itnData): bool {
        $receivedSignature = $itnData['signature'] ?? '';
        $expectedSignature = $this->generateSignature($itnData);
        return hash_equals($expectedSignature, $receivedSignature);
    }

    private function validateWithPayFast(array $itnData): bool {
        $validateUrl = PAYFAST_SANDBOX
            ? 'https://sandbox.payfast.co.za/eng/query/validate'
            : 'https://www.payfast.co.za/eng/query/validate';

        $itnData = array_filter($itnData);

        $parts = [];
        foreach ($itnData as $key => $value) {
            if ($key !== 'signature') {
                $parts[] = $key . '=' . urlencode(trim((string) $value));
            }
        }

        $response = file_get_contents($validateUrl, false, stream_context_create([
            'http' => [
                'method'  => 'POST',
                'header'  => 'Content-Type: application/x-www-form-urlencoded',
                'content' => implode('&', $parts),
                'timeout' => 10,
            ],
        ]));

        return trim($response) === 'VALID';
    }
}