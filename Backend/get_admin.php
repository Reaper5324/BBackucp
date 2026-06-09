<?php
require 'config/config.php';
require 'database/Database.php';

$pdo = Database::getConnection();
$stmt = $pdo->query('SELECT u.id, u.name, u.email, r.role_name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE r.role_name = "admin" LIMIT 5');
$result = $stmt->fetchAll();
if ($result) {
    foreach ($result as $admin) {
        echo "ID: {$admin['id']}, Name: {$admin['name']}, Email: {$admin['email']}\n";
    }
} else {
    echo "No admin accounts found\n";
}
?>
