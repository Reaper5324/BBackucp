<?php

class AdminController extends Controller {

    private AdminService $admin;

    public function __construct() {
        $this->admin = new AdminService();
    }

    public function dashboard(): void {
        $user = AuthMiddleware::handle();
        RoleMiddleware::requireAdmin($user);
        $this->json($this->admin->getDashboardStats());
    }

    public function users(): void {
        $user = AuthMiddleware::handle();
        RoleMiddleware::requireAdmin($user);
        $this->json($this->admin->getAllUsers());
    }

    public function sellers(): void {
        $user = AuthMiddleware::handle();
        RoleMiddleware::requireAdmin($user);
        $this->json($this->admin->getSellers());
    }

    public function categories(): void {
        $user = AuthMiddleware::handle();
        RoleMiddleware::requireAdmin($user);
        $this->json(['success' => true, 'data' => Category::findAll()]);
    }

    public function createCategory(): void {
        $user = AuthMiddleware::handle();
        RoleMiddleware::requireAdmin($user);

        $body = $this->body();
        $name = trim($body['name'] ?? '');
        $description = trim($body['description'] ?? '');

        if (empty($name)) {
            $this->json(['success' => false, 'error' => 'Category name is required'], 422);
            return;
        }

        // Check if category already exists
        $existing = Category::findOneBy('name', $name);
        if ($existing) {
            $this->json(['success' => false, 'error' => 'Category already exists'], 422);
            return;
        }

        $category = new Category();
        $category->name = $name;
        $category->description = $description ?: null;

        if (!$category->save()) {
            $this->json(['success' => false, 'error' => 'Failed to create category'], 422);
            return;
        }

        $this->json(['success' => true, 'message' => 'Category created', 'data' => $category], 201);
    }

    public function deleteCategory(string $id): void {
        $user = AuthMiddleware::handle();
        RoleMiddleware::requireAdmin($user);

        $category = Category::findById((int) $id);
        if (!$category) {
            $this->json(['success' => false, 'error' => 'Category not found'], 404);
            return;
        }

        // Check if category has products
        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT COUNT(*) as count FROM products WHERE category_id = ?');
        $stmt->execute([(int) $id]);
        $result = $stmt->fetch();

        if ($result['count'] > 0) {
            $this->json(['success' => false, 'error' => 'Cannot delete category with existing products'], 422);
            return;
        }

        if (!$category->delete()) {
            $this->json(['success' => false, 'error' => 'Failed to delete category'], 422);
            return;
        }

        $this->json(['success' => true, 'message' => 'Category deleted']);
    }

    public function reports(): void {
        $user = AuthMiddleware::handle();
        RoleMiddleware::requireAdmin($user);
        $this->json($this->admin->getDashboardStats());
    }

    public function settings(): void {
        $user = AuthMiddleware::handle();
        RoleMiddleware::requireAdmin($user);
        $this->json([
            'success' => true,
            'data' => [
                'rbac_enabled' => true,
                'audit_logs_enabled' => true,
                'uploads_enabled' => true,
            ],
        ]);
    }

    public function suspendUser(string $id): void {
        $user = AuthMiddleware::handle();
        RoleMiddleware::requireAdmin($user);

        $result = $this->admin->suspendUser($user->id, (int) $id, $this->body()['reason'] ?? '');
        $this->json($result, $result['success'] ? 200 : 422);
    }

    public function reinstateUser(string $id): void {
        $user = AuthMiddleware::handle();
        RoleMiddleware::requireAdmin($user);

        $result = $this->admin->reinstateUser($user->id, (int) $id);
        $this->json($result, $result['success'] ? 200 : 422);
    }

    public function removeProduct(string $id): void {
        $user = AuthMiddleware::handle();
        RoleMiddleware::requireAdmin($user);

        $result = $this->admin->removeProduct($user->id, (int) $id, $this->body()['reason'] ?? '');
        $this->json($result, $result['success'] ? 200 : 422);
    }

    public function products(): void {
        $user = AuthMiddleware::handle();
        RoleMiddleware::requireAdmin($user);
        $this->json($this->admin->getProductsForModeration());
    }

    public function logs(): void {
        $user = AuthMiddleware::handle();
        RoleMiddleware::requireAdmin($user);
        $this->json($this->admin->getLogs());
    }
}
