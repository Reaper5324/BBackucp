<?php
// config/config.php
// Copy this file and fill in your actual credentials.
// Never commit real credentials to version control.

define('DB_HOST', 'sql213.infinityfree.com');
define('DB_NAME', 'if0_42097207_bater_db');
define('DB_USER', 'if0_42097207');
define('DB_PASS', 't7osgPfVpxqmHP');

define('PAYFAST_SANDBOX', true);
define('PAYFAST_MERCHANT_ID', '10000100');
define('PAYFAST_MERCHANT_KEY', '46f0cd694581a');
define('PAYFAST_PASSPHRASE', 'jt7NOE43FZPn');

$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'] ?? 'bater.freedev.app';
$appUrl = $scheme . '://' . $host;
$apiUrl = $appUrl . '/bater/public';

define('APP_URL', $appUrl);
define('API_URL', $apiUrl);
define('PAYFAST_RETURN_URL', APP_URL . '/#/payment/status/success');
define('PAYFAST_CANCEL_URL', APP_URL . '/#/payment/status/cancelled');
define('PAYFAST_NOTIFY_URL', API_URL . '/webhooks/payfast');
define('PAYFAST_SANDBOX_URL', 'https://sandbox.payfast.co.za/eng/process'); 
