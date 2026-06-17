<?php

class DebugController extends Controller {

    public function session(): void {

        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        $this->json([
            'session_id' => session_id(),
            'cookie'     => $_COOKIE,
            'session'    => $_SESSION,
            'server'     => [
                'origin' => $_SERVER['HTTP_ORIGIN'] ?? null,
                'host'   => $_SERVER['HTTP_HOST'] ?? null
            ]
        ]);
    }
}
