<?php
/**
 * Database Helper: Password Resets Table Migration
 * Run this once to add password reset support to the database
 */

class PasswordResetsMigration {
    public static function up() {
        $db = Database::getConnection();
        
        try {
            $sql = "
                CREATE TABLE IF NOT EXISTS password_resets (
                    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    user_id INT UNSIGNED NOT NULL,
                    token VARCHAR(255) NOT NULL UNIQUE,
                    token_hash VARCHAR(255) NOT NULL,
                    expires_at TIMESTAMP NOT NULL,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    
                    CONSTRAINT fk_pw_reset_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    INDEX idx_pw_reset_token (token_hash),
                    INDEX idx_pw_reset_expires (expires_at)
                ) ENGINE=InnoDB;
            ";
            
            $db->exec($sql);
            return ['success' => true, 'message' => 'Password resets table created'];
        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
    
    public static function down() {
        $db = Database::getConnection();
        
        try {
            $db->exec("DROP TABLE IF EXISTS password_resets;");
            return ['success' => true, 'message' => 'Password resets table dropped'];
        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
}
