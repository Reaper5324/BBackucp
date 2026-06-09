<?php

/**
 * bootstrap.php
 *
 * Loaded by public/index.php before anything else runs.
 * Responsible for three things:
 *   1. Load configuration (DB credentials, payment keys)
 *   2. Register the autoloader so PHP can find any class by name
 *   3. Set global PHP settings (timezone, error reporting)
 *
 * Every request goes through this file exactly once.
 */

// --- 1. Configuration ---
require_once __DIR__ . '/config/config.php';

// --- 2. PHP settings ---
date_default_timezone_set('Africa/Johannesburg');

// Hide errors in production so PHP details are not shown publicly.
ini_set('display_errors', 0);
error_reporting(E_ALL);

// --- 3. Autoloader ---
// Maps a class name to its file. PHP calls this function automatically
// whenever you use a class that hasn't been required yet.
spl_autoload_register(function (string $class): void {

    // Directories to search, in priority order.
    // If two files define the same class name, the first match wins.
    $directories = [
        __DIR__ . '/core/',
        __DIR__ . '/database/',
        __DIR__ . '/models/',
        __DIR__ . '/services/',
        __DIR__ . '/middleware/',
        __DIR__ . '/controllers/',
    ];

    foreach ($directories as $dir) {
        $file = $dir . $class . '.php';
        if (file_exists($file)) {
            require_once $file;

            if (class_exists($class, false) || interface_exists($class, false) || trait_exists($class, false)) {
                return;
            }
        }
    }

    // If the class still wasn't found, check the grouped files.
    // These files each contain multiple classes.
    $groupedFiles = [
        __DIR__ . '/services/Services.php',     // ReviewService, UserService, NotificationService, VerificationService, AdminService
        __DIR__ . '/middleware/Middleware.php',  // fallback if separate files don't exist
    ];

    foreach ($groupedFiles as $file) {
        if (file_exists($file) && !in_array($file, get_included_files())) {
            require_once $file;

            if (class_exists($class, false) || interface_exists($class, false) || trait_exists($class, false)) {
                return;
            }
        }
    }
});

// Load Composer dependencies if a vendor directory exists.
if (file_exists(__DIR__ . '/vendor/autoload.php')) {
    require_once __DIR__ . '/vendor/autoload.php';
}
