"""
RAG Service (Retrieval-Augmented Generation)
============================================
Builds grounded context for the LLM.
NO model calls here — ONLY context construction.
"""

from typing import List, Dict


def build_rag_context(documents: List[Dict]) -> str:
    """
    Convert retrieved documents into a structured context block.
    """

    if not documents:
        return ""

    return "\n\n".join(
        f"[Document {i + 1}: {doc.get('title', 'Untitled')}]\n{doc.get('content', '')}"
        for i, doc in enumerate(documents)
    )


def build_rag_prompt(query: str, context_block: str) -> str:
    """
    Strict grounded prompt for the LLM.
    """

    return f"""
You are a precise AI assistant.

RULES:
- Use ONLY the provided context.
- If the answer is not in the context, say: "I don't have enough information."
- Do not hallucinate.

CONTEXT:
{context_block}

QUESTION:
{query}

ANSWER:
""".strip()


def prepare_rag_context(documents: List[Dict], query: str) -> Dict:
    """
    Returns structured RAG payload for workflow service.
    """

    context_block = build_rag_context(documents)

    return {
        "context": context_block,
        "prompt": build_rag_prompt(query, context_block) if context_block else None,
        "has_context": bool(context_block),
        "sources": [
            {
                "id": doc.get("id"),
                "title": doc.get("title"),
                "similarity": doc.get("similarity_score", 0)
            }
            for doc in documents
        ]
    }