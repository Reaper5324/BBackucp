<?php

/**
 * Controller (base class)
 *
 * All controllers extend this.
 * It provides the tools every controller needs:
 *   - Send a JSON response
 *   - Read the request body
 *   - Read URL parameters
 *   - Redirect the browser
 *
 * Controllers should never echo output directly.
 * They always call $this->json() so the response format stays consistent.
 */
abstract class Controller {

    /**
     * Send a JSON response and stop execution.
     *
     * $data   — the array to encode as JSON
     * $status — the HTTP status code (200, 201, 400, 401, 403, 404, 500...)
     */
    protected function json(array $data, int $status = 200): void {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit();
    }

    /**
     * Read the request body.
     *
     * Handles both JSON bodies (Content-Type: application/json)
     * and standard HTML form submissions (application/x-www-form-urlencoded).
     *
     * Returns an associative array of the input data, or an empty array
     * if the body is empty or malformed.
     */
    protected function body(): array {
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

        if (str_contains($contentType, 'application/json')) {
            $raw = file_get_contents('php://input');
            return json_decode($raw, true) ?? [];
        }

        // Form POST data — already parsed by PHP into $_POST
        if (!empty($_POST)) {
            return $_POST;
        }

        $raw = file_get_contents('php://input');
        parse_str($raw, $parsed);
        return $parsed;
    }

    /**
     * Read a URL segment that was captured by the router.
     * These are stored in $_REQUEST by the Router after parsing the URL.
     *
     * Example: for route /orders/{id}, $this->param('id') returns the value.
     */
    protected function param(string $key): ?string {
        return $_REQUEST[$key] ?? null;
    }

    /**
     * Read a query string value ($_GET).
     * Example: /products?search=shoes → $this->query('search') = 'shoes'
     */
    protected function query(string $key, mixed $default = null): mixed {
        return $_GET[$key] ?? $default;
    }

    /**
     * Determine the HTTP method of the current request.
     * Supports a _method override in POST bodies for HTML forms
     * (since HTML forms only support GET and POST natively).
     */
    protected function method(): string {
        $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

        // Allow HTML forms to send PUT/DELETE via hidden _method field
        if ($method === 'POST' && !empty($_POST['_method'])) {
            $override = strtoupper($_POST['_method']);
            if (in_array($override, ['PUT', 'PATCH', 'DELETE'])) {
                $method = $override;
            }
        }

        return $method;
    }

    /**
     * Send a redirect response.
     */
    protected function redirect(string $url, int $status = 302): void {
        http_response_code($status);
        header("Location: {$url}");
        exit();
    }
}
