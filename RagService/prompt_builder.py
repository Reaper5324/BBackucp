def build_prompt(question: str, chunks: list[dict]) -> str:
    fallback = (
        "I don't have enough information on your question. "
        "Please contact the support team for further assistance."
    )

    if not chunks:
        context = "No relevant context was found."
    else:
        context_parts = []
        for c in chunks:
            source = c.get("source", "unknown")
            page = c.get("page")
            url = c.get("url")
            label = f"Source: {source}"
            if page:
                label += f", page {page}"
            if url:
                label += f", URL {url}"
            context_parts.append(f"[{label}]\n{c['text']}")
        context = "\n\n".join(context_parts)

    return f"""You are a helpful support assistant for an ecommerce app.
Use only the provided context to answer customer questions about products, orders, returns, shipping, payments, and store policies.
If the context does not contain the answer, say exactly: "{fallback}"
For product questions, mention matching product names, prices, stock, seller, category, and product page links when they are present in context.
Do not invent policy details, delivery timelines, refund rules, product facts, prices, stock levels, or order statuses.

Context:
{context}

Question:
{question}

Answer:
"""
