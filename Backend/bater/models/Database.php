<?php

class Database {
    private static ?PDO $instance = null;

    private function __construct() {}
    private function __clone() {}

    public static function getConnection(): PDO {
        if (self::$instance === null) {
            $host = self::config('DB_HOST', 'sql213.infinityfree.com');
            $name = self::config('DB_NAME', 'if0_42097207_bater_db');
            $user = self::config('DB_USER', 'if0_42097207');
            $pass = self::config('DB_PASS', '');

            $dsn = sprintf(
                'mysql:host=%s;dbname=%s;charset=utf8mb4',
                $host,
                $name
            );

            try {
                self::$instance = new PDO($dsn, $user, $pass, [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                ]);
            } catch (PDOException $e) {
                http_response_code(500);
                die(json_encode(['error' => 'Database connection failed.']));
            }
        }

        return self::$instance;
    }

    private static function config(string $key, string $default): string {
        if (defined($key)) {
            return (string) constant($key);
        }

        $value = getenv($key);
        return $value === false ? $default : $value;
    }
}
