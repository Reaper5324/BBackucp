<?php

class VerificationService {

    const UPLOAD_DIR = '/uploads/verifications';

    public function submitVerification(int $sellerId, string $docType, array $file): array {
        $seller = User::findById($sellerId);
        if (!$seller || !$seller->isSeller()) {
            return ['success' => false, 'error' => 'Seller account not found.'];
        }

        $existing = SellerVerification::findOneBy('seller_id', $sellerId);
        if ($existing && $existing->status === SellerVerification::STATUS_PENDING) {
            return ['success' => false, 'error' => 'You already have a pending verification application.'];
        }

        $allowedTypes = ['national_id', 'passport', 'drivers_licence'];
        if (!in_array($docType, $allowedTypes, true)) {
            return ['success' => false, 'error' => 'Invalid document type.'];
        }

        $upload = $this->handleDocumentUpload($file);
        if (!$upload['success']) return $upload;

        if ($existing) {
            $oldPath = $this->publicPathToDiskPath($existing->doc_path);
            if ($oldPath && file_exists($oldPath)) {
                unlink($oldPath);
            }

            $existing->doc_type = $docType;
            $existing->doc_path = $upload['data']['path'];
            $existing->status = SellerVerification::STATUS_PENDING;
            $existing->reviewed_by = null;
            $existing->reviewed_at = null;

            if (!$existing->save()) {
                return ['success' => false, 'error' => 'Failed to save verification.'];
            }

            return ['success' => true, 'data' => ['verification_id' => $existing->id]];
        }

        $verification = new SellerVerification();
        $verification->seller_id = $sellerId;
        $verification->doc_type = $docType;
        $verification->doc_path = $upload['data']['path'];
        $verification->status = SellerVerification::STATUS_PENDING;

        if (!$verification->save()) {
            return ['success' => false, 'error' => 'Failed to save verification.'];
        }

        return ['success' => true, 'data' => ['verification_id' => $verification->id]];
    }

    public function approveVerification(int $adminId, int $verificationId): array {
        $verification = SellerVerification::findById($verificationId);

        if (!$verification) {
            return ['success' => false, 'error' => 'Verification record not found.'];
        }

        $verification->status = SellerVerification::STATUS_APPROVED;
        $verification->reviewed_by = $adminId;
        $verification->reviewed_at = date('Y-m-d H:i:s');

        if (!$verification->save()) {
            return ['success' => false, 'error' => 'Failed to approve verification.'];
        }

        $notif = new NotificationService();
        $notif->notify(
            $verification->seller_id,
            'Your seller verification has been approved! Your listings now show a verified badge.',
            Notification::TYPE_SYSTEM
        );

        return ['success' => true];
    }

    public function rejectVerification(int $adminId, int $verificationId, string $reason = ''): array {
        $verification = SellerVerification::findById($verificationId);

        if (!$verification) {
            return ['success' => false, 'error' => 'Verification record not found.'];
        }

        $verification->status = SellerVerification::STATUS_REJECTED;
        $verification->reviewed_by = $adminId;
        $verification->reviewed_at = date('Y-m-d H:i:s');

        if (!$verification->save()) {
            return ['success' => false, 'error' => 'Failed to reject verification.'];
        }

        $message = 'Your seller verification was not approved.';
        if ($reason) $message .= ' Reason: ' . $reason;
        $message .= ' You may resubmit with corrected documents.';

        $notif = new NotificationService();
        $notif->notify($verification->seller_id, $message, Notification::TYPE_SYSTEM);

        return ['success' => true];
    }

    public function getVerificationStatus(int $sellerId): array {
        $verification = SellerVerification::findOneBy('seller_id', $sellerId);
        return ['success' => true, 'data' => $verification];
    }

    public function getPendingVerifications(): array {
        return ['success' => true, 'data' => SellerVerification::findPending()];
    }

    private function handleDocumentUpload(array $file): array {
        if (empty($file) || ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            return ['success' => false, 'error' => 'Document upload failed.'];
        }

        $maxSize = 10 * 1024 * 1024;
        if (($file['size'] ?? 0) > $maxSize) {
            return ['success' => false, 'error' => 'Document must be smaller than 10 MB.'];
        }

        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($file['tmp_name']);
        $allowed = ['image/jpeg', 'image/png', 'application/pdf'];

        if (!in_array($mime, $allowed, true)) {
            return ['success' => false, 'error' => 'Documents must be JPEG, PNG, or PDF.'];
        }

        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $filename = 'verif_' . uniqid('', true) . '.' . $extension;
        $uploadDir = dirname(__DIR__) . '/public' . self::UPLOAD_DIR;
        $destination = $uploadDir . '/' . $filename;

        if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true)) {
            return ['success' => false, 'error' => 'Could not prepare verification upload directory.'];
        }

        if (!move_uploaded_file($file['tmp_name'], $destination)) {
            return ['success' => false, 'error' => 'Could not save document to disk.'];
        }

        return ['success' => true, 'data' => ['path' => self::UPLOAD_DIR . '/' . $filename]];
    }

    private function publicPathToDiskPath(?string $path): ?string {
        if (!$path) {
            return null;
        }

        $normalized = str_starts_with($path, 'public/')
            ? substr($path, strlen('public'))
            : $path;

        if (!str_starts_with($normalized, '/uploads/')) {
            return null;
        }

        return dirname(__DIR__) . '/public' . $normalized;
    }
}
