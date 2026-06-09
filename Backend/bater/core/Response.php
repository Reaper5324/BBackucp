<?php

/**
 * Response
 *
 * A thin helper so every controller sends responses the same way.
 * Instead of scattering http_response_code() and echo json_encode()
 * across 10 controllers, we call Response::json() or Response::redirect()
 * and this class handles the headers and output format every time.
 */
class Response {

    /**
     * Send a JSON response and stop execution.
     *
     * $data       — the array to encode as JSON
     * $statusCode — the HTTP status code (200, 201, 400, 401, 403, 404, 500)
     */
    public static function json(array $data, int $statusCode = 200): never {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data);
        exit();
    }

    /**
     * Send a success response with optional data.
     */
    public static function success(mixed $data = null, int $statusCode = 200): never {
        $body = ['success' => true];
        if ($data !== null) $body['data'] = $data;
        static::json($body, $statusCode);
    }

    /**
     * Send an error response with a message.
     */
    public static function error(string $message, int $statusCode = 400): never {
        static::json(['success' => false, 'error' => $message], $statusCode);
    }

    /**
     * Redirect the browser to another URL and stop execution.
     */
    public static function redirect(string $url): never {
        header('Location: ' . $url);
        exit();
    }

    /**
     * Take a service result array and send the appropriate response.
     *
     * Every service returns ['success' => true/false, 'data'/'error' => ...].
     * This method converts that into an HTTP response so controllers
     * can do: Response::fromService($result) instead of branching every time.
     *
     * $successCode — what HTTP code to use on success (default 200, use 201 for creates)
     */
    public static function fromService(array $result, int $successCode = 200): never {
        if ($result['success']) {
            static::success($result['data'] ?? null, $successCode);
        } else {
            static::error($result['error'] ?? 'An error occurred.');
        }
    }
}
