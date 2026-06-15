<?php
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('DB_NAME') ?: '');
define('DB_USER', getenv('DB_USER') ?: '');
define('DB_PASS', getenv('DB_PASS') ?: '');

define('PAYFAST_SANDBOX', getenv('PAYFAST_SANDBOX') === 'false' ? false : true);
define('PAYFAST_MERCHANT_ID', getenv('PAYFAST_MERCHANT_ID') ?: '10000100');
define('PAYFAST_MERCHANT_KEY', getenv('PAYFAST_MERCHANT_KEY') ?: '46f0cd694581a');
define('PAYFAST_PASSPHRASE', getenv('PAYFAST_PASSPHRASE') ?: 'jt7NOE43FZPn');

define('RESEND_API_KEY', getenv('RESEND_API_KEY') ?: '');

$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'] ?? (getenv('RAILWAY_PUBLIC_DOMAIN') ?: 'localhost');
$appUrl = $scheme . '://' . $host;
$apiUrl = $appUrl;

define('APP_URL', getenv('FRONTEND_URL') ?: $appUrl);
define('API_URL', $apiUrl);
define('PAYFAST_RETURN_URL', APP_URL . '/#/payment/status/success');
define('PAYFAST_CANCEL_URL', APP_URL . '/#/payment/status/cancelled');
define('PAYFAST_NOTIFY_URL', $apiUrl . '/webhooks/payfast');
define('PAYFAST_SANDBOX_URL', 'https://sandbox.payfast.co.za/eng/process');
