<?php

class ProductController extends Controller {

    private ProductService $products;

    public function __construct() {
        $this->products = new ProductService();
    }

    public function index(): void {
        $search = trim((string) $this->query('search', ''));
        $categoryId = (int) $this->query('category_id', 0);

        if ($search !== '') {
            $result = $this->products->searchProducts($search);
        } elseif ($categoryId > 0) {
            $result = $this->products->getProductsByCategory($categoryId);
        } else {
            $result = $this->products->getActiveProducts();
        }

        $this->json($result, $result['success'] ? 200 : 422);
    }

    public function show(string $id): void {
        $result = $this->products->getProductById((int) $id);
        $this->json($result, $result['success'] ? 200 : 404);
    }

    public function store(): void {
        $user = AuthMiddleware::handle();
        RoleMiddleware::requireSeller($user);

        $result = $this->products->createProduct($user->id, $this->body(), $_FILES['image'] ?? null);
        $this->json($result, $result['success'] ? 201 : 422);
    }

    public function update(string $id): void {
        $user = AuthMiddleware::handle();
        RoleMiddleware::requireSeller($user);

        $result = $this->products->updateProduct((int) $id, $user->id, $this->body(), $_FILES['image'] ?? null);
        $this->json($result, $result['success'] ? 200 : 422);
    }

    public function deactivate(string $id): void {
        $user = AuthMiddleware::handle();
        RoleMiddleware::requireSeller($user);

        $result = $this->products->DeactivateProduct((int) $id, $user->id);
        $this->json($result, $result['success'] ? 200 : 404);
    }

    public function mine(): void {
        $user = AuthMiddleware::handle();
        RoleMiddleware::requireSeller($user);

        $result = $this->products->getSellerProducts($user->id);
        $this->json($result, $result['success'] ? 200 : 404);
    }

    public function categories(): void {
        $this->json(['success' => true, 'data' => Category::findAll()]);
    }
}
