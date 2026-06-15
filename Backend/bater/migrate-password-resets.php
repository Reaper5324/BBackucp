<?php
/**
 * Database Migration Helper
 * Run this file ONCE to set up the password_resets table
 * 
 * Usage:
 * 1. Place this file in Backend/bater/
 * 2. Run via command line: php migrate-password-resets.php
 * 3. Check output for success/failure
 */

// Change to the Backend/bater directory first, then run:
// php migrate-password-resets.php

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/database/PasswordResetsMigration.php';

echo "=== Password Resets Migration ===\n\n";

// Check if this is an up or down migration
$action = $argv[1] ?? 'up';

if ($action === 'up') {
    echo "Running migration UP (creating table)...\n";
    $result = PasswordResetsMigration::up();
} elseif ($action === 'down') {
    echo "Running migration DOWN (dropping table)...\n";
    $result = PasswordResetsMigration::down();
} else {
    echo "Invalid action. Use 'up' or 'down'\n";
    exit(1);
}

if ($result['success']) {
    echo "✅ SUCCESS: {$result['message']}\n";
    exit(0);
} else {
    echo "❌ ERROR: {$result['error']}\n";
    exit(1);
}
