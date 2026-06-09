<?php
/**
 * Router script for PHP development server
 * Allows PHP's built-in server to handle URL routing properly
 * All requests that aren't real files get routed to index.php
 */

$requestPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$scriptName = '/index.php';

// If the requested path is a real file or directory, serve it as-is
if (is_file(__DIR__ . $requestPath) || is_dir(__DIR__ . $requestPath)) {
    return false;
}

// Otherwise, route through index.php
$_SERVER['SCRIPT_NAME'] = $scriptName;
$_SERVER['SCRIPT_FILENAME'] = __DIR__ . $scriptName;
include __DIR__ . $scriptName;
