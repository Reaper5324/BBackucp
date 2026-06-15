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
