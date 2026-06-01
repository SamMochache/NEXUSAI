"""
Agent Workflow Service
=======================
Routes conversations based on intent, sentiment, and context.
Decides: Should the AI answer? Should it call a tool? Should it escalate?
"""

from .tools import get_available_tools, execute_tool


def classify_intent(query: str) -> str:
    """
    Simple rule-based intent classifier.
    In production, you might use a small LLM or NLP model here.
    
    Returns one of: 'question', 'action_request', 'complaint', 'escalation'
    """
    query_lower = query.lower()
    
    # Escalation triggers (user wants human)
    escalation_words = ['human', 'agent', 'representative', 'supervisor', 'manager', 'speak to someone']
    if any(word in query_lower for word in escalation_words):
        return 'escalation'
    
    # Complaint triggers (angry/frustrated user)
    complaint_words = ['angry', 'frustrated', 'terrible', 'awful', 'worst', 'hate', 'useless', 'broken', 'refund now', 'lawsuit']
    if any(word in query_lower for word in complaint_words):
        return 'complaint'
    
    # Action triggers (user wants something done)
    action_words = ['create', 'open', 'send', 'book', 'schedule', 'check my', 'look up', 'find my']
    if any(word in query_lower for word in action_words):
        return 'action_request'
    
    # Default: general question
    return 'question'


def should_use_rag(intent: str) -> bool:
    """Should we search documents before answering?"""
    return intent == 'question'


def should_allow_tools(intent: str) -> bool:
    """Should we give the AI access to tools?"""
    return intent in ('action_request', 'complaint', 'question')


def build_system_prompt(agent, intent: str) -> str:
    """
    Build a dynamic system prompt based on the conversation intent.
    
    Different intents get different personalities and constraints.
    """
    base_prompt = agent.system_prompt or "You are a helpful AI assistant."
    
    if intent == 'complaint':
        return base_prompt + """
CRITICAL: The user seems frustrated or angry.
- Acknowledge their frustration immediately.
- Apologize sincerely for the inconvenience.
- Offer concrete solutions.
- If you cannot resolve it, offer to escalate to a human agent.
- NEVER argue with the user or make excuses.
"""
    elif intent == 'escalation':
        return base_prompt + """
CRITICAL: The user has requested a human agent.
- Do NOT try to solve the problem yourself.
- Immediately acknowledge the request.
- Use the escalate_to_human tool.
- Provide the user with an estimated response time.
"""
    elif intent == 'action_request':
        return base_prompt + """
You have access to tools to help the user. If their request requires
creating a ticket, looking up account info, or escalating, use the
appropriate tool rather than just describing what you would do.
"""
    else:
        return base_prompt + """
Answer the user's question using the provided context documents.
If the answer is not in the context, say you don't know.
"""


def run_agent_workflow(agent, user, query: str, conversation_history: list, documents: list) -> dict:
    """
    The main workflow engine.
    
    1. Classify intent
    2. Decide strategy (RAG, tools, escalation)
    3. Build appropriate prompt
    4. Call LLM (with or without tools)
    5. Handle tool calls if needed
    6. Return final response
    
    Args:
        agent: Agent model instance
        user: User model instance
        query: User's message
        conversation_history: List of previous messages
        documents: List of retrieved documents (from RAG)
    
    Returns:
        Dict with 'answer', 'intent', 'tools_used', 'sources'
    """
    from .ai_service import get_client
    from .rag_service import build_rag_prompt
    from django.conf import settings
    import json
    
    # ─── 1. Classify Intent ───
    intent = classify_intent(query)
    
    # ─── 2. Build System Prompt ───
    system_prompt = build_system_prompt(agent, intent)
    
    # ─── 3. Build Message List for LLM ───
    messages = [{"role": "system", "content": system_prompt}]
    
    # Add conversation history (last 6 messages to save tokens)
    for msg in conversation_history[-6:]:
        messages.append({
            "role": msg['role'],
            "content": msg['content']
        })
    
    # Add user query (with RAG context if applicable)
    if should_use_rag(intent) and documents:
        context_block = "\n".join([
            f"[Document {i+1}: {doc['title']}]\n{doc['content']}"
            for i, doc in enumerate(documents)
        ])
        user_content = f"Context:\n{context_block}\n\nUser question: {query}"
    else:
        user_content = query
    
    messages.append({"role": "user", "content": user_content})
    
    # ─── 4. Call LLM ───
    client = get_client()
    tools = get_available_tools() if should_allow_tools(intent) else None
    
    try:
        response = client.chat.completions.create(
            model=agent.model_name or "gpt-4o-mini",
            messages=messages,
            tools=tools,
            tool_choice="auto" if tools else None,
            temperature=agent.temperature or 0.7,
            max_tokens=agent.max_tokens or 512
        )
    except Exception as e:
        return {
            'answer': f"Sorry, I'm having trouble processing your request: {str(e)}",
            'intent': intent,
            'tools_used': [],
            'sources': []
        }
    
    message = response.choices[0].message
    
    # ─── 5. Handle Tool Calls ───
    tools_used = []
    
    if message.tool_calls:
        # The AI decided to call one or more tools
        # We must execute them and send results back to the AI
        for tool_call in message.tool_calls:
            function_name = tool_call.function.name
            arguments = json.loads(tool_call.function.arguments)
            
            # Execute the Python function
            result = execute_tool(function_name, arguments)
            tools_used.append({
                'tool': function_name,
                'arguments': arguments,
                'result': result
            })
            
            # Add the tool result to messages for the follow-up LLM call
            messages.append({
                "role": "assistant",
                "content": None,
                "tool_calls": [
                    {
                        "id": tool_call.id,
                        "type": "function",
                        "function": {
                            "name": function_name,
                            "arguments": tool_call.function.arguments
                        }
                    }
                ]
            })
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": result
            })
        
        # ─── 6. Second LLM call with tool results ───
        follow_up = client.chat.completions.create(
            model=agent.model_name or "gpt-4o-mini",
            messages=messages,
            temperature=agent.temperature or 0.7,
            max_tokens=agent.max_tokens or 512
        )
        
        final_answer = follow_up.choices[0].message.content
    else:
        # No tool calls, just a regular response
        final_answer = message.content
    
    return {
        'answer': final_answer,
        'intent': intent,
        'tools_used': tools_used,
        'sources': [
            {'id': d.get('id'), 'title': d['title']}
            for d in documents
        ] if documents else []
    }
