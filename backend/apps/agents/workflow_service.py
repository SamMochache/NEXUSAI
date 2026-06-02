"""
Agent Workflow Service
=======================
Routes conversations based on intent, sentiment, and context.
Decides: Should the AI answer? Should it call a tool? Should it escalate?
"""

from .tools import get_available_tools, execute_tool
from .ai_service import get_client


def classify_intent(query: str) -> str:
    query_lower = query.lower()

    escalation_words = ['human', 'agent', 'representative', 'supervisor', 'manager', 'speak to someone']
    if any(word in query_lower for word in escalation_words):
        return 'escalation'

    complaint_words = ['angry', 'frustrated', 'terrible', 'awful', 'worst', 'hate', 'useless', 'broken', 'refund now', 'lawsuit']
    if any(word in query_lower for word in complaint_words):
        return 'complaint'

    action_words = ['create', 'open', 'send', 'book', 'schedule', 'check my', 'look up', 'find my']
    if any(word in query_lower for word in action_words):
        return 'action_request'

    return 'question'


def should_use_rag(intent: str) -> bool:
    return intent == 'question'


def should_allow_tools(intent: str) -> bool:
    return intent in ('action_request', 'complaint', 'question')


def build_system_prompt(agent, intent: str) -> str:
    base_prompt = agent.system_prompt or "You are a helpful AI assistant."

    if intent == 'complaint':
        return base_prompt + """
CRITICAL: The user seems frustrated or angry.
- Acknowledge frustration.
- Apologize sincerely.
- Offer solutions.
- Escalate if needed.
"""

    elif intent == 'escalation':
        return base_prompt + """
CRITICAL: User requested a human.
- Do NOT attempt to solve.
- Acknowledge immediately.
- Trigger escalation workflow.
"""

    elif intent == 'action_request':
        return base_prompt + """
You may help the user perform actions using available tools.
Use tools when appropriate instead of describing steps.
"""

    else:
        return base_prompt + """
Answer using provided context if available.
If you don't know, say so.
"""


def run_agent_workflow(agent, user, query: str, conversation_history: list, documents: list) -> dict:
    intent = classify_intent(query)
    system_prompt = build_system_prompt(agent, intent)

    client = get_client()

    # ─── Build context ───
    context_block = ""

    if should_use_rag(intent) and documents:
        context_block = "\n".join(
            f"[Document {i+1}: {doc['title']}]\n{doc['content']}"
            for i, doc in enumerate(documents)
        )

    # ─── Build final prompt ───
    history_text = "\n".join(
        f"{msg['role']}: {msg['content']}"
        for msg in conversation_history[-6:]
    )

    tools = get_available_tools() if should_allow_tools(intent) else []

    tool_hint = ""
    if tools:
        tool_names = [t.get("function", {}).get("name") for t in tools]
        tool_hint = f"\nAvailable tools: {', '.join(filter(None, tool_names))}"

    prompt = f"""
{system_prompt}

CONTEXT:
{context_block}

HISTORY:
{history_text}

USER: {query}

{tool_hint}

Return a helpful response.
"""

    try:
        response = client.models.generate_content(
            model=agent.model_name or "gemini-2.5-flash",
            contents=prompt
        )

        answer = response.text.strip() if response.text else ""

        # ─── SIMPLE TOOL EXECUTION (no OpenAI function calling) ───
        tools_used = []

        if tools:
            for tool in tools:
                tool_name = tool.get("function", {}).get("name")

                if tool_name and tool_name in query.lower():
                    result = execute_tool(tool_name, {"query": query})
                    tools_used.append({
                        "tool": tool_name,
                        "result": result
                    })

        return {
            "answer": answer,
            "intent": intent,
            "tools_used": tools_used,
            "sources": [
                {"id": d.get("id"), "title": d["title"]}
                for d in documents
            ] if documents else []
        }

    except Exception as e:
        return {
            "answer": f"Sorry, I'm having trouble processing your request: {str(e)}",
            "intent": intent,
            "tools_used": [],
            "sources": []
        }