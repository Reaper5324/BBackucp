import os
from pathlib import Path

import chromadb
import fitz

from chuncker import chunk_text
from embedding import embed_text
from product_catalog import fetch_products, product_to_document

BASE_DIR = Path(__file__).resolve().parent
DOCUMENT_DIR = BASE_DIR / "documents"
CHROMA_PATH = BASE_DIR / "chroma_db"
COLLECTION_NAME = "policy_documents"


def extract_text_from_pdf(pdf_path: Path) -> list[dict]:
    pages = []
    with fitz.open(pdf_path) as doc:
        for page_num, page in enumerate(doc, start=1):
            pages.append({
                "page_number": page_num,
                "text": page.get_text(),
                "source": pdf_path.name,
            })
    return pages


def reset_collection(client: chromadb.PersistentClient):
    collection_names = [getattr(collection, "name", collection) for collection in client.list_collections()]
    if COLLECTION_NAME in collection_names:
        client.delete_collection(COLLECTION_NAME)
    return client.get_or_create_collection(name=COLLECTION_NAME)


def main():
    if not DOCUMENT_DIR.exists():
        raise FileNotFoundError(f"Document directory does not exist: {DOCUMENT_DIR}")

    client = chromadb.PersistentClient(path=str(CHROMA_PATH))
    collection = reset_collection(client)

    chunk_id = 0
    pdf_files = sorted(filename for filename in os.listdir(DOCUMENT_DIR) if filename.lower().endswith(".pdf"))

    for filename in pdf_files:
        pdf_path = DOCUMENT_DIR / filename
        print(f"Processing {filename}...")
        pages = extract_text_from_pdf(pdf_path)

        for page in pages:
            for chunk in chunk_text(page["text"]):
                embedding = embed_text(chunk)
                collection.add(
                    ids=[str(chunk_id)],
                    embeddings=[embedding],
                    documents=[chunk],
                    metadatas=[{
                        "source": page["source"],
                        "page": page["page_number"],
                        "doc_type": "policy",
                    }],
                )
                chunk_id += 1

    product_count = 0
    for product in fetch_products():
        product_id = product.get("id")
        if product_id is None:
            continue

        text, metadata = product_to_document(product)
        collection.add(
            ids=[f"product-{product_id}"],
            embeddings=[embed_text(text)],
            documents=[text],
            metadatas=[metadata],
        )
        product_count += 1
        chunk_id += 1

    print(f"Ingestion complete. {chunk_id} chunks stored, including {product_count} products.")


if __name__ == "__main__":
    main()
