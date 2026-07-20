<?php

class RagController extends Controller {
    private RagService $rag;

    public function __construct() {
        $this->rag = new RagService();
    }

    public function ask(): void {
        $body = $this->body();
        $question = $body['question'] ?? $body['message'] ?? '';
        $result = $this->rag->ask((string) $question);

        $this->json($result, $result['success'] ? 200 : 422);
    }
    public function health(): void {
        $result = $this->rag->health();
        $this->json($result, $result['success'] ? 200 : 503);
    }
}
