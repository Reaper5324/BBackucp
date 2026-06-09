<?php

class UserService {

    private const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024;
    private const PROFILE_UPLOAD_DIR = '/uploads/profiles';
    private const ALLOWED_PROFILE_IMAGE_TYPES = ['image/png', 'image/jpg', 'image/jpeg'];

    /**
     * Update a user's profile information (name, phone, address).
     * Email changes are not allowed here — they would need re-verification.
     */
    public function updateProfile(int $userId, array $data): array {
        $user = User::findById($userId);

        if (!$user) {
            return ['success' => false, 'error' => 'User not found.'];
        }

        if (!empty($data['name'])) {
            $user->name = trim($data['name']);
        }

        if (isset($data['phone'])) {
            $user->phone = trim($data['phone']) ?: null;
        }

        if (isset($data['address'])) {
            $user->address = trim($data['address']) ?: null;
        }

        if (!$user->save()) {
            return ['success' => false, 'error' => 'Failed to update profile.'];
        }

        return ['success' => true, 'data' => $this->publicUser($user)];
    }

    /**
     * Change a user's password.
     * Requires the current password to prevent an attacker
     * who found a logged-in session from locking the real user out.
     */
    public function changePassword(int $userId, string $currentPassword, string $newPassword): array {
        $user = User::findById($userId);

        if (!$user) {
            return ['success' => false, 'error' => 'User not found.'];
        }

        if (!$user->verifyPassword($currentPassword)) {
            return ['success' => false, 'error' => 'Current password is incorrect.'];
        }

        if (strlen($newPassword) < 8) {
            return ['success' => false, 'error' => 'New password must be at least 8 characters.'];
        }

        if ($currentPassword === $newPassword) {
            return ['success' => false, 'error' => 'New password must be different from current password.'];
        }

        $user->setPassword($newPassword);

        if (!$user->save()) {
            return ['success' => false, 'error' => 'Failed to update password.'];
        }

        return ['success' => true];
    }

    /**
     * Upload a new profile picture for the user.
     */
    public function uploadProfilePicture(int $userId, array $file): array {
        $user = User::findById($userId);

        if (!$user) {
            return ['success' => false, 'error' => 'User not found.'];
        }

        $upload = $this->storeProfileImage($file);
        if (!$upload['success']) {
            return $upload;
        }

        // Delete old picture from disk if it exists
        $oldPath = $this->publicPathToDiskPath($user->profile_picture);
        if ($oldPath && file_exists($oldPath)) {
            @unlink($oldPath);
        }

        $user->profile_picture = $upload['data']['path'];

        if (!$user->save()) {
            return ['success' => false, 'error' => 'Failed to save profile picture.'];
        }

        return [
            'success' => true,
            'data' => [
                'path' => $user->profile_picture,
                'picture_url' => $user->profile_picture,
                'user' => $this->publicUser($user),
            ],
        ];
    }

    public function getUserById(int $userId): array {
        $user = User::findById($userId);

        if (!$user) {
            return ['success' => false, 'error' => 'User not found.'];
        }

        return ['success' => true, 'data' => $user];
    }

    private function storeProfileImage(array $file): array {
        if (empty($file) || !isset($file['error'])) {
            return ['success' => false, 'error' => 'No profile image was uploaded.'];
        }

        if ($file['error'] === UPLOAD_ERR_NO_FILE) {
            return ['success' => false, 'error' => 'No profile image was selected.'];
        }

        if ($file['error'] !== UPLOAD_ERR_OK) {
            return ['success' => false, 'error' => 'Profile image upload failed.'];
        }

        if (($file['size'] ?? 0) > self::MAX_PROFILE_IMAGE_SIZE) {
            return ['success' => false, 'error' => 'Profile image must be smaller than 5 MB.'];
        }

        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($file['tmp_name']);

        if (!in_array($mime, self::ALLOWED_PROFILE_IMAGE_TYPES, true)) {
            return ['success' => false, 'error' => 'Profile image must be a PNG or JPEG file.'];
        }

        $uploadDir = dirname(__DIR__) . '/public' . self::PROFILE_UPLOAD_DIR;
        if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true)) {
            return ['success' => false, 'error' => 'Could not prepare profile upload directory.'];
        }

        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!in_array($extension, ['png', 'jpg', 'jpeg'], true)) {
            $extension = $mime === 'image/png' ? 'png' : 'jpg';
        }

        $filename = 'profile_' . uniqid('', true) . '.' . $extension;
        $destination = $uploadDir . '/' . $filename;

        if (!move_uploaded_file($file['tmp_name'], $destination)) {
            return ['success' => false, 'error' => 'Could not save profile image.'];
        }

        return ['success' => true, 'data' => ['path' => self::PROFILE_UPLOAD_DIR . '/' . $filename]];
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

    private function publicUser(User $user): array {
        $role = $user->getRole();

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'address' => $user->address,
            'profile_picture' => $user->profile_picture,
            'role' => $role?->role_name,
            'is_active' => $user->is_active,
            'created_at' => $user->created_at,
        ];
    }
}
