## Ecommerce RAG Service

This FastAPI service answers grounded ecommerce support questions from the Chroma vector store.
The ingestion step now indexes both PDF policy documents and active marketplace products.

### Product catalog setup

Install dependencies:

```bash
pip install -r requirements.txt
```

Point the service at product data using one of these options:

```bash
# Preferred when the PHP backend is running or deployed.
PRODUCT_API_URL=http://localhost:8000

# Fallback direct database access.
DB_HOST=localhost
DB_NAME=bater
DB_USER=root
DB_PASS=
```

`PRODUCT_API_URL`, `BACKEND_API_URL`, or `API_URL` should be the backend base URL without `/products`.
If no product API URL is configured, ingestion reads active products directly from MySQL.

### Rebuild the knowledge base

Run ingestion after adding or editing products:

```bash
python ingest.py
```

The product chunks include product name, description, category, seller, price, stock, status, and the frontend product page link.

### Run the service

```bash
uvicorn main:app --reload --port 8001
```

Ask product questions through `POST /ask`:

```json
{
  "question": "Which electronics are in stock?"
}
```

### PHP backend integration

The PHP backend proxies frontend assistant requests through `POST /rag/ask` and checks service status through `GET /rag/health`.
Set this on the backend when the RAG service is deployed somewhere else:

```bash
RAG_SERVICE_URL=https://your-rag-service.example.com
```

For local development, run the PHP backend on its usual port and the RAG service on port `8001`.