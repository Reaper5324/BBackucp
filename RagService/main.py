from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from llm import generate_answer
from prompt_builder import build_prompt
from retriever import retrieve

app = FastAPI(title="Ecommerce RAG Support Agent")


class AskRequest(BaseModel):
    question: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/ask")
def ask(request: AskRequest):
    question = request.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    chunks = retrieve(question)
    prompt = build_prompt(question, chunks)
    answer = generate_answer(prompt)

    seen_sources = set()
    sources = []
    for chunk in chunks:
        source_key = (chunk["source"], chunk.get("page"), chunk.get("url"))
        if source_key in seen_sources:
            continue
        seen_sources.add(source_key)
        source = {
            "source": chunk["source"],
            "page": chunk.get("page"),
            "type": chunk.get("doc_type"),
        }
        if chunk.get("product_id"):
            source["product_id"] = chunk["product_id"]
        if chunk.get("url"):
            source["url"] = chunk["url"]
        sources.append(source)

    return {
        "answer": answer,
        "sources": sources,
    }
