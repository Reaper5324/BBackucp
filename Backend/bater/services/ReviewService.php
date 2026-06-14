<?php


class ReviewService {

    /**
     * Submit a review for a product.
     *
     * Rules:
     *   - Reviewer must have a completed order containing this product
     *   - Reviewer cannot review the same product twice
     *   - Rating must be between 1 and 5
     */
    public function createReview(int $reviewerId, int $productId, int $rating, string $comment): array {
        // --- Validate rating ---
        if ($rating < 1 || $rating > 5) {
            return ['success' => false, 'error' => 'Rating must be between 1 and 5.'];
        }

        if (empty(trim($comment))) {
            return ['success' => false, 'error' => 'Review comment cannot be empty.'];
        }

        // --- Product must exist ---
        if (!Product::findById($productId)) {
            return ['success' => false, 'error' => 'Product not found.'];
        }

        // --- Buyer must have completed an order containing this product ---
        if (!$this->hasPurchasedProduct($reviewerId, $productId)) {
            return [
                'success' => false,
                'error'   => 'You can only review products you have purchased and received.',
            ];
        }

        // --- No duplicate reviews ---
        $db   = Database::getConnection();
        $stmt = $db->prepare(
            'SELECT COUNT(*) FROM reviews WHERE reviewer_id = ? AND product_id = ?'
        );
        $stmt->execute([$reviewerId, $productId]);
        if ((int) $stmt->fetchColumn() > 0) {
            return ['success' => false, 'error' => 'You have already reviewed this product.'];
        }

        // --- Create the review ---
        $review              = new Review();
        $review->reviewer_id = $reviewerId;
        $review->product_id  = $productId;
        $review->rating      = $rating;
        $review->comment     = trim($comment);

        if (!$review->save()) {
            return ['success' => false, 'error' => 'Failed to save review.'];
        }

        return ['success' => true, 'data' => ['review_id' => $review->id]];
    }

    /**
     * Delete a review. Only the reviewer who wrote it can delete it.
     */
    public function deleteReview(int $reviewId, int $reviewerId): array {
        $review = Review::findById($reviewId);

        if (!$review) {
            return ['success' => false, 'error' => 'Review not found.'];
        }

        if ($review->reviewer_id !== $reviewerId) {
            return ['success' => false, 'error' => 'You can only delete your own reviews.'];
        }

        if (!$review->delete()) {
            return ['success' => false, 'error' => 'Failed to delete review.'];
        }

        return ['success' => true];
    }

    /**
     * Get all reviews for a product.
     */
    public function getProductReviews(int $productId): array {
        return ['success' => true, 'data' => Review::findBy('product_id', $productId)];
    }

    /**
     * Check if a buyer has a completed order that contains a specific product.
     * This is the gate that prevents fake reviews.
     */
    private function hasPurchasedProduct(int $buyerId, int $productId): bool {
        $db   = Database::getConnection();
        $stmt = $db->prepare(
            "SELECT COUNT(*)
             FROM orders o
             JOIN order_items oi ON oi.order_id = o.id
             WHERE o.buyer_id   = ?
               AND oi.product_id = ?
               AND o.status      = ?"
        );
        $stmt->execute([$buyerId, $productId, Order::STATUS_COMPLETED]);
        return (int) $stmt->fetchColumn() > 0;
    }
}
