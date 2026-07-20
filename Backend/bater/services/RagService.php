<?php

class RagService {
    private string $baseUrl;

    public function __construct(?string $baseUrl = null) {
        $this->baseUrl = rtrim($baseUrl ?: RAG_SERVICE_URL, '/');
    }

    public function ask(string $question): array {
        $question = trim($question);

        if ($question === '') {
            return ['success' => false, 'error' => 'Question cannot be empty'];
        }

        $payload = ['question' => $question];
        $ch = curl_init($this->baseUrl . '/ask');

        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_TIMEOUT, 45);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($response === false) {
            return [
                'success' => false,
                'error' => $curlError ?: 'Could not reach the RAG service',
            ];
        }

        $data = json_decode($response, true);
        if (!is_array($data)) {
            return ['success' => false, 'error' => 'RAG service returned an invalid response'];
        }

        if ($httpCode < 200 || $httpCode >= 300) {
            return [
                'success' => false,
                'error' => $data['detail'] ?? $data['error'] ?? 'RAG service request failed',
            ];
        }

        return [
            'success' => true,
            'data' => [
                'answer' => $data['answer'] ?? '',
                'sources' => $data['sources'] ?? [],
            ],
        ];
    }
    public function health(): array {
        $ch = curl_init($this->baseUrl . '/health');

        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($response === false) {
            return [
                'success' => false,
                'error' => $curlError ?: 'Could not reach the RAG service',
            ];
        }

        $data = json_decode($response, true);

        return [
            'success' => $httpCode >= 200 && $httpCode < 300,
            'data' => is_array($data) ? $data : [],
            'error' => $httpCode >= 200 && $httpCode < 300 ? null : 'RAG service health check failed',
        ];
    }
}
