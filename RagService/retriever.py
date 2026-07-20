from pathlib import Path

import chromadb

from embedding import embed_text

BASE_DIR = Path(__file__).resolve().parent
CHROMA_PATH = BASE_DIR / "chroma_db"
COLLECTION_NAME = "policy_documents"

client = chromadb.PersistentClient(path=str(CHROMA_PATH))
collection = client.get_or_create_collection(name=COLLECTION_NAME)


def retrieve(question: str, n_results: int = 5) -> list[dict]:
    if not question or not question.strip():
        return []

    count = collection.count()
    if count == 0:
        return []

    question_embedding = embed_text(question)
    result = collection.query(
        query_embeddings=[question_embedding],
        n_results=min(n_results, count),
    )

    documents = result.get("documents") or [[]]
    metadatas = result.get("metadatas") or [[]]

    chunks = []
    for text, metadata in zip(documents[0], metadatas[0]):
        metadata = metadata or {}
        chunks.append({
            "text": text,
            "source": metadata.get("source", "unknown"),
            "page": metadata.get("page"),
            "doc_type": metadata.get("doc_type", "unknown"),
            "product_id": metadata.get("product_id"),
            "url": metadata.get("url"),
        })

    return chunks
