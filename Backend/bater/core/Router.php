<?php

/**
 * Router
 *
 * Maps an incoming HTTP request (method + URL path) to a specific
 * controller method. Without this, every URL would need its own PHP file.
 *
 * Usage in index.php:
 *
 *   $router = new Router();
 *   $router->post('/auth/login',    'AuthController@login');
 *   $router->get('/products',       'ProductController@index');
 *   $router->get('/products/{id}',  'ProductController@show');
 *   $router->dispatch();
 *
 * {id} in a route becomes a parameter passed to the controller method.
 */
class Router {

    /** Registered routes: [method => [pattern => 'Controller@method']] */
    private array $routes = [];

    // -------------------------------------------------------------------------
    // Route registration
    // -------------------------------------------------------------------------

    public function get(string $path, string $handler): void {
        $this->addRoute('GET', $path, $handler);
    }

    public function post(string $path, string $handler): void {
        $this->addRoute('POST', $path, $handler);
    }

    public function put(string $path, string $handler): void {
        $this->addRoute('PUT', $path, $handler);
    }

    public function delete(string $path, string $handler): void {
        $this->addRoute('DELETE', $path, $handler);
    }

    private function addRoute(string $method, string $path, string $handler): void {
        $this->routes[$method][$path] = $handler;
    }

    // -------------------------------------------------------------------------
    // Dispatch
    // -------------------------------------------------------------------------

    /**
     * Match the current request against registered routes and call the handler.
     * If no route matches, respond with 404.
     *
     * HTML forms only support GET and POST. To support PUT and DELETE from forms,
     * we read a hidden field called _method (a common pattern called method spoofing).
     *
     *   <input type="hidden" name="_method" value="DELETE">
     */
    public function dispatch(): void {
        $method = strtoupper($_SERVER['REQUEST_METHOD']);

        // Method spoofing for PUT / DELETE from HTML forms
        if ($method === 'POST' && isset($_POST['_method'])) {
            $method = strtoupper($_POST['_method']);
        }

        // Strip query string from the path
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

        // Remove the base directory if the app is in a subdirectory
        $basePath = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/');
        if ($basePath && str_starts_with($path, $basePath)) {
            $path = substr($path, strlen($basePath));
        }

        $path = '/' . trim($path, '/');

        // Try to match a registered route
        foreach ($this->routes[$method] ?? [] as $pattern => $handler) {
            $params = $this->matchRoute($pattern, $path);

            if ($params !== null) {
                $this->callHandler($handler, $params);
                return;
            }
        }

        // No match found
        Response::error('Route not found.', 404);
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * Compare a route pattern against the actual URL path.
     * Returns an array of captured parameters if it matches, null otherwise.
     *
     * Pattern /products/{id} against path /products/42
     * → returns ['id' => '42']
     */
    private function matchRoute(string $pattern, string $path): ?array {
        // Convert {param} placeholders to named regex groups
        $regex = preg_replace('/\{([A-Za-z_][A-Za-z0-9_]*)\}/', '(?P<$1>[^/]+)', $pattern);
        $regex = '#^' . $regex . '$#';

        if (preg_match($regex, $path, $matches)) {
            // Return only the named captures (strip numeric keys)
            return array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
        }

        return null;
    }

    /**
     * Instantiate the controller and call the action method with route params.
     *
     * Handler format: 'ProductController@show'
     */
    private function callHandler(string $handler, array $params): void {
        [$controllerClass, $method] = explode('@', $handler);

        if (!class_exists($controllerClass)) {
            Response::error("Controller '{$controllerClass}' not found.", 500);
        }

        $controller = new $controllerClass();

        if (!method_exists($controller, $method)) {
            Response::error("Method '{$method}' not found on '{$controllerClass}'.", 500);
        }

        // Pass named URL parameters as individual arguments
        $controller->$method(...array_values($params));
    }
}
