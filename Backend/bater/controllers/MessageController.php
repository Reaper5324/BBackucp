<?php

class MessageController extends Controller {

    public function thread(): void {
        $user = AuthMiddleware::handle();
        $productId = (int) $this->query('product_id', 0);
        $otherUser = (int) $this->query('user_id', 0);

        if (!$productId || !$otherUser) {
            $this->json(['success' => false, 'error' => 'product_id and user_id are required.'], 422);
        }

        $messages = Message::getThread($user->id, $otherUser, $productId);

        foreach ($messages as $message) {
            if ($message->receiver_id === $user->id && !$message->is_read) {
                $message->markRead();
            }
        }

        $this->json(['success' => true, 'data' => $messages]);
    }

    public function send(): void {
        $user = AuthMiddleware::handle();
        $body = $this->body();

        $receiverId = (int) ($body['receiver_id'] ?? 0);
        $productId = (int) ($body['product_id'] ?? 0);
        $text = trim($body['body'] ?? '');

        if (!$receiverId || !$productId || $text === '') {
            $this->json(['success' => false, 'error' => 'receiver_id, product_id, and body are all required.'], 422);
        }

        if ($receiverId === $user->id) {
            $this->json(['success' => false, 'error' => 'You cannot message yourself.'], 422);
        }

        if (!User::findById($receiverId) || !Product::findById($productId)) {
            $this->json(['success' => false, 'error' => 'Receiver or product not found.'], 404);
        }

        $message = new Message();
        $message->sender_id = $user->id;
        $message->receiver_id = $receiverId;
        $message->product_id = $productId;
        $message->body = $text;

        if (!$message->save()) {
            $this->json(['success' => false, 'error' => 'Failed to send message.'], 500);
        }

        $this->json(['success' => true, 'data' => ['message_id' => $message->id]], 201);
    }
}
