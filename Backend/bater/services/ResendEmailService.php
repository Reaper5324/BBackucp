<?php

/**
 * Resend Email Service
 * Sends emails via Resend API
 */
class ResendEmailService {
    private string $apiKey;
    private string $apiEndpoint = 'https://api.resend.com/emails';

    public function __construct(string $apiKey) {
        $this->apiKey = $apiKey;
    }

    /**
     * Send password reset email
     */
    public function sendPasswordResetEmail(string $userEmail, string $userName, string $resetToken, string $appUrl = 'https://bater.freedev.app'): array {
        $resetLink = "{$appUrl}/#/reset-password?token={$resetToken}";

        $html = $this->buildPasswordResetHtml($userName, $resetLink);

        return $this->send(
            from: 'noreply@bater.freedev.app',
            to: $userEmail,
            subject: 'Reset your Bater password',
            html: $html
        );
    }

    /**
     * Send email via Resend API
     */
    private function send(string $from, string $to, string $subject, string $html): array {
        try {
            $payload = [
                'from' => $from,
                'to' => $to,
                'subject' => $subject,
                'html' => $html,
            ];

            $ch = curl_init($this->apiEndpoint);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Authorization: Bearer ' . $this->apiKey,
                'Content-Type: application/json',
            ]);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
            curl_setopt($ch, CURLOPT_TIMEOUT, 10);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode >= 200 && $httpCode < 300) {
                return ['success' => true, 'message' => 'Email sent successfully'];
            } else {
                $error = json_decode($response, true)['message'] ?? 'Failed to send email';
                return ['success' => false, 'error' => $error];
            }
        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Build HTML email for password reset
     */
    private function buildPasswordResetHtml(string $userName, string $resetLink): string {
        return "
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset=\"utf-8\">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #007bff; color: white; padding: 20px; text-align: center; border-radius: 4px; }
                    .content { padding: 20px; background-color: #f9f9f9; border: 1px solid #ddd; margin-top: 20px; border-radius: 4px; }
                    .button { display: inline-block; background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
                    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; }
                </style>
            </head>
            <body>
                <div class=\"container\">
                    <div class=\"header\">
                        <h1>Bater - Password Reset</h1>
                    </div>
                    <div class=\"content\">
                        <p>Hi {$userName},</p>
                        <p>We received a request to reset your password. Click the button below to create a new password.</p>
                        <a href=\"{$resetLink}\" class=\"button\">Reset Password</a>
                        <p>This link will expire in 24 hours.</p>
                        <p>If you didn't request a password reset, please ignore this email or contact support.</p>
                        <p><strong>For security:</strong></p>
                        <ul>
                            <li>Never share your password with anyone</li>
                            <li>We will never ask for your password via email</li>
                            <li>Always check the URL is from bater.freedev.app</li>
                        </ul>
                    </div>
                    <div class=\"footer\">
                        <p>&copy; 2026 Bater. All rights reserved.</p>
                        <p>If you have issues, contact support@bater.freedev.app</p>
                    </div>
                </div>
            </body>
            </html>
        ";
    }
}
