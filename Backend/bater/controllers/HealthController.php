<?php

class HealthController extends Controller {

    public function show(): void {
        $this->json([
            'success' => true,
            'data' => [
                'app' => 'bater',
                'status' => 'ok',
                'time' => date(DATE_ATOM),
            ],
        ]);
    }
}
