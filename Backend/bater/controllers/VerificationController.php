<?php

class VerificationController extends Controller {

    private VerificationService $verification;

    public function __construct() {
        $this->verification = new VerificationService();
    }

    public function submit(): void {
        $user = AuthMiddleware::handle();
        RoleMiddleware::requireSeller($user);

        $result = $this->verification->submitVerification(
            $user->id,
            $_POST['doc_type'] ?? '',
            $_FILES['document'] ?? []
        );

        $this->json($result, $result['success'] ? 201 : 422);
    }

    public function status(): void {
        $user = AuthMiddleware::handle();
        RoleMiddleware::requireSeller($user);

        $result = $this->verification->getVerificationStatus($user->id);
        $this->json($result);
    }

    public function pending(): void {
        $user = AuthMiddleware::handle();
        RoleMiddleware::requireAdmin($user);

        $result = $this->verification->getPendingVerifications();
        $this->json($result);
    }

    public function approve(string $id): void {
        $user = AuthMiddleware::handle();
        RoleMiddleware::requireAdmin($user);

        $result = $this->verification->approveVerification($user->id, (int) $id);
        $this->json($result, $result['success'] ? 200 : 422);
    }

    public function reject(string $id): void {
        $user = AuthMiddleware::handle();
        RoleMiddleware::requireAdmin($user);

        $result = $this->verification->rejectVerification(
            $user->id,
            (int) $id,
            $this->body()['reason'] ?? ''
        );

        $this->json($result, $result['success'] ? 200 : 422);
    }
}
