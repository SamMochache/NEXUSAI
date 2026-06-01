"""
RAG Service (Retrieval-Augmented Generation)
============================================
Builds prompts that force the LLM to answer using ONLY
your documents. Prevents hallucination.
"""

from typing import List, Dict
from django.conf import settings
from .ai_service import get_client


def build_rag_prompt(query: str, documents: List[Dict]) -> str:
    """
    Construct a system prompt that grounds the LLM in retrieved facts.
    
    Args:
        query: The user's question
        documents: List of dicts with 'title' and 'content' keys
    
    Returns:
        A formatted prompt string
    """
    # Build the context block
    context_parts = []
    for i, doc in enumerate(documents, 1):
        context_parts.append(
            f"[Document {i}: {doc['title']}]\n{doc['content']}\n"
        )
    
    context_block = "\n".join(context_parts)
    
    # This prompt structure is battle-tested in production RAG systems
    prompt = f"""You are a precise customer support assistant. 
Your job is to answer the user's question using ONLY the information provided in the context documents below.

RULES:
1. Answer ONLY using the provided context. Do not use outside knowledge.
2. If the answer is not in the context, say: "I don't have enough information to answer that. Please contact support."
3. Be concise but complete. Use bullet points if helpful.
4. Cite which document(s) you used at the end of your answer.

CONTEXT DOCUMENTS:
{context_block}

USER QUESTION: {query}

ANSWER:"""
    
    return prompt


def generate_rag_answer(query: str, documents: List[Dict], agent_config: Dict) -> Dict:
    """
    Full RAG pipeline: build prompt → call LLM → return structured response.
    
    Args:
        query: User's question
        documents: Retrieved documents from semantic search
        agent_config: Dict with 'model_name', 'temperature', 'max_tokens', 'system_prompt'
    
    Returns:
        Dict with 'answer', 'citations', 'model_used'
    """
    if not documents:
        return {
            'answer': "I don't have enough information to answer that. Please contact support.",
            'citations': [],
            'model_used': agent_config.get('model_name', 'unknown'),
            'sources': []
        }
    
    # Build the grounded prompt
    rag_prompt = build_rag_prompt(query, documents)
    
    # Call the LLM
    try:
        client = get_client()
        response = client.chat.completions.create(
            model=agent_config.get('model_name', 'gemini-2.5-flash'),
            messages=[
                {
                    "role": "system",
                    "content": agent_config.get('system_prompt', 'You are a helpful assistant.')
                },
                {
                    "role": "user",
                    "content": rag_prompt
                }
            ],
            temperature=agent_config.get('temperature', 0.7),
            max_tokens=agent_config.get('max_tokens', 512)
        )
        
        answer = response.choices[0].message.content.strip()
        
        # Extract citations (which documents were used)
        citations = [doc['title'] for doc in documents]
        
        return {
            'answer': answer,
            'citations': citations,
            'model_used': agent_config.get('model_name'),
            'sources': [
                {
                    'id': doc.get('id'),
                    'title': doc['title'],
                    'similarity': doc.get('similarity_score', 0)
                }
                for doc in documents
            ]
        }
        
    except Exception as e:
        return {
            'answer': f"Sorry, I encountered an error generating your answer: {str(e)}",
            'citations': [],
            'model_used': agent_config.get('model_name'),
            'error': str(e)
        }