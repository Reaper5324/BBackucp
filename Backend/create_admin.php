<?php
require 'config/config.php';
require 'database/Database.php';

$pdo = Database::getConnection();

// Insert admin user
$password = password_hash('admin123', PASSWORD_BCRYPT);
$stmt = $pdo->prepare('INSERT INTO users (name, email, password_hash, role_id) VALUES (?, ?, ?, ?)');
$stmt->execute(['Admin User', 'admin@bater.local', $password, 3]); // role_id 3 is admin

echo "Admin user created successfully!\n";
echo "Email: admin@bater.local\n";
echo "Password: admin123\n";
?>
