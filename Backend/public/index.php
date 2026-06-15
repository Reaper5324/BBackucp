<?php

ini_set('session.cookie_secure', '1');
ini_set('session.cookie_httponly', '1');
ini_set('session.cookie_samesite', 'None');
ini_set('session.cookie_lifetime', '86400');

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

$allowedOrigins = [
    'https://baterc.netlify.app',
    'http://freedev.app',
    'https://freedev.app',
    'https://bbackucp-production.up.railway.app',
    'http://railway.app'
];

// Clean trailing slashes if present in the incoming origin header
$cleanOrigin = rtrim($origin, '/');

if (in_array($cleanOrigin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: $cleanOrigin");
    header('Access-Control-Allow-Credentials: true');
} else if (!empty($cleanOrigin)) {
    // FALLBACK SAFETY: For dev testing, uncomment the line below if origins shift dynamically:
    // header("Access-Control-Allow-Origin: $cleanOrigin");
    // header('Access-Control-Allow-Credentials: true');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Process options check AFTER sending the dynamic access headers
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit();
}

// The rest of your bootstrap code remains identical
require_once __DIR__ . '/../bater/bootstrap.php';
require_once __DIR__ . '/../bater/core/Router.php';

$router = new Router();

$router->get('/health', 'HealthController@show');

$router->post('/auth/register', 'AuthController@register');
$router->post('/auth/login', 'AuthController@login');
$router->post('/auth/forgot-password', 'AuthController@forgotPassword');
$router->post('/auth/reset-password', 'AuthController@resetPassword');
$router->post('/auth/logout', 'AuthController@logout');
$router->get('/auth/me', 'AuthController@me');

$router->get('/profile', 'UserController@show');
$router->post('/profile', 'UserController@update');
$router->put('/profile', 'UserController@update');
$router->post('/profile/password', 'UserController@changePassword');
$router->post('/profile/picture', 'UserController@uploadPicture');

$router->get('/categories', 'ProductController@categories');
$router->get('/products/mine', 'ProductController@mine');
$router->get('/products', 'ProductController@index');
$router->post('/products', 'ProductController@store');
$router->get('/products/{id}', 'ProductController@show');
$router->put('/products/{id}', 'ProductController@update');
$router->post('/products/{id}', 'ProductController@update');
$router->delete('/products/{id}', 'ProductController@deactivate');

$router->get('/cart', 'CartController@index');
$router->post('/cart', 'CartController@add');
$router->put('/cart/{productId}', 'CartController@update');
$router->post('/cart/{productId}', 'CartController@update');
$router->delete('/cart/{productId}', 'CartController@remove');
$router->delete('/cart', 'CartController@clear');

$router->post('/orders', 'OrderController@createFromCart');
$router->get('/orders/buyer', 'OrderController@buyerOrders');
$router->get('/orders/seller', 'OrderController@sellerOrders');
$router->get('/orders/{id}', 'OrderController@show');
$router->post('/orders/{id}/cancel', 'OrderController@cancel');
$router->post('/orders/{id}/dispatch', 'OrderController@dispatch');
$router->post('/orders/{id}/delivered', 'OrderController@delivered');
$router->post('/orders/{id}/complete', 'OrderController@complete');
$router->post('/orders/{id}/paid', 'OrderController@Paid');

$router->post('/payments/initiate', 'PaymentController@initiate');
$router->get('/payments/form/{orderId}', 'PaymentController@paymentForm');
$router->get('/payments/orders/{orderId}', 'PaymentController@forOrder');
$router->post('/webhooks/payfast', 'PaymentController@itn');

$router->get('/reviews/product/{productId}', 'ReviewController@forProduct');
$router->post('/reviews', 'ReviewController@store');
$router->delete('/reviews/{id}', 'ReviewController@destroy');

$router->post('/verification', 'VerificationController@submit');
$router->get('/verification/status', 'VerificationController@status');
$router->get('/admin/verifications', 'VerificationController@pending');
$router->post('/admin/verifications/{id}/approve', 'VerificationController@approve');
$router->post('/admin/verifications/{id}/reject', 'VerificationController@reject');

$router->get('/messages/threads', 'MessageController@threads');
$router->get('/messages', 'MessageController@thread');
$router->post('/messages', 'MessageController@send');

$router->get('/admin', 'AdminController@dashboard');
$router->get('/admin/dashboard', 'AdminController@dashboard');
$router->get('/admin/users', 'AdminController@users');
$router->get('/admin/sellers', 'AdminController@sellers');
$router->post('/admin/users/{id}/suspend', 'AdminController@suspendUser');
$router->post('/admin/users/{id}/reinstate', 'AdminController@reinstateUser');
$router->post('/admin/products/{id}/remove', 'AdminController@removeProduct');
$router->get('/admin/categories', 'AdminController@categories');
$router->get('/admin/reports', 'AdminController@reports');
$router->get('/admin/settings', 'AdminController@settings');
$router->get('/admin/logs', 'AdminController@logs');

$router->dispatch();
