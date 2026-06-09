<?php

class ReviewController extends Controller {

    private ReviewService $reviews;

    public function __construct() {
        $this->reviews = new ReviewService();
    }

    public function forProduct(string $productId): void {
        $result = $this->reviews->getProductReviews((int) $productId);
        $this->json($result);
    }

    public function store(): void {
        $user = AuthMiddleware::handle();
        RoleMiddleware::requireBuyer($user);

        $body = $this->body();
        $result = $this->reviews->createReview(
            $user->id,
            (int) ($body['product_id'] ?? 0),
            (int) ($body['rating'] ?? 0),
            $body['comment'] ?? ''
        );

        $this->json($result, $result['success'] ? 201 : 422);
    }

    public function destroy(string $id): void {
        $user = AuthMiddleware::handle();
        $result = $this->reviews->deleteReview((int) $id, $user->id);
        $this->json($result, $result['success'] ? 200 : 403);
    }
}
