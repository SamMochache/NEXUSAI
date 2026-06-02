"""
RAG Service (Retrieval-Augmented Generation)
============================================
Builds prompts that force the LLM to answer using ONLY
your documents. Prevents hallucination.
"""

from typing import List, Dict
from .ai_service import get_client


def build_rag_prompt(query: str, documents: List[Dict]) -> str:
    """
    Construct a system prompt that grounds the LLM in retrieved facts.
    """

    context_parts = []
    for i, doc in enumerate(documents, 1):
        context_parts.append(
            f"[Document {i}: {doc['title']}]\n{doc['content']}\n"
        )

    context_block = "\n".join(context_parts)

    return f"""You are a precise customer support assistant.
Your job is to answer the user's question using ONLY the information provided in the context documents below.

RULES:
1. Answer ONLY using the provided context. Do not use outside knowledge.
2. If the answer is not in the context, say: "I don't have enough information to answer that. Please contact support."
3. Be concise but complete. Use bullet points if helpful.
4. Cite which document(s) you used at the end.

CONTEXT DOCUMENTS:
{context_block}

USER QUESTION: {query}

ANSWER:
"""


def generate_rag_answer(query: str, documents: List[Dict], agent_config: Dict) -> Dict:
    """
    Full RAG pipeline: build prompt → call Gemini → return structured response.
    """

    if not documents:
        return {
            "answer": "I don't have enough information to answer that. Please contact support.",
            "citations": [],
            "model_used": agent_config.get("model_name", "unknown"),
            "sources": []
        }

    prompt = build_rag_prompt(query, documents)

    try:
        client = get_client()

        model_name = agent_config.get("model_name", "gemini-2.5-flash")

        response = client.models.generate_content(
            model=model_name,
            contents=prompt
        )

        answer = response.text.strip() if response.text else ""

        citations = [doc["title"] for doc in documents]

        return {
            "answer": answer,
            "citations": citations,
            "model_used": model_name,
            "sources": [
                {
                    "id": doc.get("id"),
                    "title": doc["title"],
                    "similarity": doc.get("similarity_score", 0)
                }
                for doc in documents
            ]
        }

    except Exception as e:
        return {
            "answer": f"Sorry, I encountered an error generating your answer: {str(e)}",
            "citations": [],
            "model_used": agent_config.get("model_name", "unknown"),
            "error": str(e)
        }