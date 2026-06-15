<?php

/**
 * Support Service
 * Handles support ticket submission, retrieval, and admin actions
 */
class SupportService {

    private ResendEmailService $emailService;

    public function __construct() {
        $this->emailService = new ResendEmailService(RESEND_API_KEY);
    }

    /**
     * Submit a new support ticket and send notification email to admin
     */
    public function submitTicket(int $userId, string $subject, string $category, string $message): array {
        // Fetch user
        $user = User::findById($userId);
        if (!$user) {
            return ['success' => false, 'error' => 'User not found'];
        }

        // Validate inputs
        if (empty($subject) || empty($category) || empty($message)) {
            return ['success' => false, 'error' => 'All fields are required'];
        }

        // Create ticket
        $ticket = new SupportTicket();
        $ticket->user_id = $userId;
        $ticket->subject = trim($subject);
        $ticket->category = trim($category);
        $ticket->message = trim($message);
        $ticket->status = SupportTicket::STATUS_OPEN;

        if (!$ticket->save()) {
            return ['success' => false, 'error' => 'Failed to create ticket'];
        }

        // Send email notification to admin
        $emailResult = $this->sendTicketNotificationEmail($user, $ticket);

        // Log the ticket submission
        $log = new AdminLog();
        $log->admin_id = 0; // System action, not an admin action
        $log->action = 'support_ticket_submitted';
        $log->target_user_id = $userId;
        $log->notes = "Ticket #{$ticket->id}: {$subject}";
        $log->save();

        return [
            'success' => true,
            'message' => 'Support ticket submitted successfully',
            'ticket_id' => $ticket->id,
            'email_sent' => $emailResult['success']
        ];
    }

    /**
     * Retrieve all support tickets (admin view)
     */
    public function getAllTickets(): array {
        $db = Database::getConnection();
        $stmt = $db->query(
            'SELECT st.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone,
                    a.name AS admin_name
             FROM support_tickets st
             JOIN users u ON st.user_id = u.id
             LEFT JOIN users a ON st.resolved_by = a.id
             ORDER BY st.created_at DESC'
        );
        return ['success' => true, 'data' => $stmt->fetchAll()];
    }

    /**
     * Retrieve tickets by status (admin view)
     */
    public function getTicketsByStatus(string $status): array {
        $db = Database::getConnection();
        $stmt = $db->prepare(
            'SELECT st.*, u.name AS user_name, u.email AS user_email,
                    a.name AS admin_name
             FROM support_tickets st
             JOIN users u ON st.user_id = u.id
             LEFT JOIN users a ON st.resolved_by = a.id
             WHERE st.status = ?
             ORDER BY st.created_at DESC'
        );
        $stmt->execute([$status]);
        return ['success' => true, 'data' => $stmt->fetchAll()];
    }

    /**
     * Retrieve tickets submitted by a user
     */
    public function getUserTickets(int $userId): array {
        $db = Database::getConnection();
        $stmt = $db->prepare(
            'SELECT st.*
             FROM support_tickets st
             WHERE st.user_id = ?
             ORDER BY st.created_at DESC'
        );
        $stmt->execute([$userId]);
        $rows = $stmt->fetchAll();
        return ['success' => true, 'data' => $rows];
    }

    /**
     * Mark a support ticket as resolved (admin action)
     */
    public function resolveTicket(int $adminId, int $ticketId): array {
        $ticket = SupportTicket::findById($ticketId);
        if (!$ticket) {
            return ['success' => false, 'error' => 'Ticket not found'];
        }

        $admin = User::findById($adminId);
        if (!$admin) {
            return ['success' => false, 'error' => 'Admin not found'];
        }

        $ticket->status = SupportTicket::STATUS_RESOLVED;
        $ticket->resolved_by = $adminId;
        $ticket->resolved_at = date('Y-m-d H:i:s');

        if (!$ticket->save()) {
            return ['success' => false, 'error' => 'Failed to resolve ticket'];
        }

        // Log the admin action
        $log = new AdminLog();
        $log->admin_id = $adminId;
        $log->action = 'resolve_support_ticket';
        $log->target_user_id = $ticket->user_id;
        $log->notes = "Resolved ticket #{$ticketId}: {$ticket->subject}";
        $log->save();

        // Notify user of resolution
        $user = $ticket->getUser();
        if ($user) {
            $notif = new NotificationService();
            $notif->notify($user->id, "Your support ticket \"{$ticket->subject}\" has been resolved.", Notification::TYPE_SYSTEM);

            // Send resolution email
            $this->sendResolutionEmail($user, $ticket, $admin);
        }

        return ['success' => true, 'message' => 'Ticket resolved successfully'];
    }

    /**
     * Send ticket submission notification email to admin
     */
    private function sendTicketNotificationEmail(User $user, SupportTicket $ticket): array {
        $html = $this->buildTicketNotificationHtml($user, $ticket);

        return $this->emailService->sendSupportNotification(
            to: 'tyronemas@gmail.com',
            subject: "New Support Ticket: {$ticket->subject}",
            html: $html
        );
    }

    /**
     * Send resolution email to user
     */
    private function sendResolutionEmail(User $user, SupportTicket $ticket, User $admin): array {
        $html = $this->buildResolutionHtml($user, $ticket, $admin);

        return $this->emailService->sendSupportNotification(
            to: $user->email,
            subject: "Your Support Ticket Has Been Resolved",
            html: $html
        );
    }

    /**
     * Build HTML for ticket notification email (to admin)
     */
    private function buildTicketNotificationHtml(User $user, SupportTicket $ticket): string {
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
                    .ticket-info { background-color: white; padding: 15px; border-left: 4px solid #007bff; margin: 15px 0; }
                    .ticket-info strong { color: #007bff; }
                    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; }
                </style>
            </head>
            <body>
                <div class=\"container\">
                    <div class=\"header\">
                        <h1>New Support Ticket Received</h1>
                    </div>
                    <div class=\"content\">
                        <p><strong>Ticket Details:</strong></p>
                        <div class=\"ticket-info\">
                            <p><strong>From:</strong> {$user->name} ({$user->email})</p>
                            <p><strong>Role:</strong> {$this->getUserRole($user)}</p>
                            <p><strong>Subject:</strong> {$ticket->subject}</p>
                            <p><strong>Category:</strong> {$ticket->category}</p>
                            <p><strong>Submitted:</strong> " . date('F j, Y g:i A', strtotime($ticket->created_at)) . "</p>
                        </div>
                        <p><strong>Message:</strong></p>
                        <div style=\"background-color: white; padding: 15px; border: 1px solid #ddd; border-radius: 4px;\">
                            <p>" . nl2br(htmlspecialchars($ticket->message)) . "</p>
                        </div>
                        <p style=\"margin-top: 20px;\">Please log in to the admin panel to respond to this ticket.</p>
                    </div>
                    <div class=\"footer\">
                        <p>&copy; 2026 Bater Marketplace. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        ";
    }

    /**
     * Build HTML for resolution email (to user)
     */
    private function buildResolutionHtml(User $user, SupportTicket $ticket, User $admin): string {
        return "
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset=\"utf-8\">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #28a745; color: white; padding: 20px; text-align: center; border-radius: 4px; }
                    .content { padding: 20px; background-color: #f9f9f9; border: 1px solid #ddd; margin-top: 20px; border-radius: 4px; }
                    .ticket-info { background-color: white; padding: 15px; border-left: 4px solid #28a745; margin: 15px 0; }
                    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; }
                </style>
            </head>
            <body>
                <div class=\"container\">
                    <div class=\"header\">
                        <h1>Your Support Ticket Has Been Resolved</h1>
                    </div>
                    <div class=\"content\">
                        <p>Hi {$user->name},</p>
                        <p>Your support ticket has been resolved by our team. Here are the details:</p>
                        <div class=\"ticket-info\">
                            <p><strong>Subject:</strong> {$ticket->subject}</p>
                            <p><strong>Category:</strong> {$ticket->category}</p>
                            <p><strong>Status:</strong> <span style=\"color: #28a745; font-weight: bold;\">Resolved</span></p>
                            <p><strong>Resolved by:</strong> {$admin->name}</p>
                            <p><strong>Resolved at:</strong> " . date('F j, Y g:i A', strtotime($ticket->resolved_at)) . "</p>
                        </div>
                        <p>If you have any further concerns, please feel free to submit another support ticket.</p>
                    </div>
                    <div class=\"footer\">
                        <p>&copy; 2026 Bater Marketplace. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        ";
    }

    /**
     * Get user role name
     */
    private function getUserRole(User $user): string {
        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT role_name FROM roles WHERE id = ?');
        $stmt->execute([$user->role_id]);
        return $stmt->fetchColumn() ?: 'User';
    }
}
