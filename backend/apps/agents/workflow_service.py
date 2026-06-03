"""
Agent Workflow Service
=======================
Routes conversations based on intent, sentiment, and context.
Decides: answer, tools, escalation.
"""

from .tools import get_available_tools, execute_tool
from .ai_service import get_client
from .rag_service import prepare_rag_context


def classify_intent(query: str) -> str:
    query_lower = query.lower()

    escalation_words = [
        'human', 'agent', 'representative',
        'supervisor', 'manager', 'speak to someone'
    ]
    if any(word in query_lower for word in escalation_words):
        return 'escalation'

    complaint_words = [
        'angry', 'frustrated', 'terrible', 'awful',
        'worst', 'hate', 'useless', 'broken',
        'refund', 'lawsuit'
    ]
    if any(word in query_lower for word in complaint_words):
        return 'complaint'

    action_words = [
        'create', 'open', 'send', 'book',
        'schedule', 'check', 'look up', 'find'
    ]
    if any(word in query_lower for word in action_words):
        return 'action_request'

    return 'question'


def should_allow_tools(intent: str) -> bool:
    return intent in ('action_request', 'complaint', 'question')


def build_system_prompt(agent, intent: str) -> str:
    base = agent.system_prompt or "You are a helpful AI assistant."

    if intent == 'complaint':
        return base + "\n\nUser is upset. Be empathetic and solution-focused."

    if intent == 'escalation':
        return base + "\n\nUser requested a human. Do not attempt to solve. Acknowledge and escalate."

    if intent == 'action_request':
        return base + "\n\nUser wants an action. Prefer tools over explanations."

    return base + "\n\nAnswer using context if available."


def run_agent_workflow(agent, user, query: str, conversation_history: list, documents: list) -> dict:

    intent = classify_intent(query)
    system_prompt = build_system_prompt(agent, intent)

    client = get_client()

    # ─── RAG (clean separation) ───
    rag = prepare_rag_context(documents, query)
    context_block = rag["context"]
    sources = rag["sources"]

    # ─── HISTORY ───
    history_text = "\n".join(
        f"{msg['role']}: {msg['content']}"
        for msg in conversation_history[-8:]
    )

    # ─── TOOLS ───
    tools = get_available_tools() if should_allow_tools(intent) else []

    tool_names = [
        (t.get("function") or {}).get("name")
        for t in tools
        if (t.get("function") or {}).get("name")
    ]

    tool_hint = ""
    if tool_names:
        tool_hint = "\nAvailable tools: " + ", ".join(tool_names)

    # ─── PROMPT ───
    prompt = f"""
{system_prompt}

CONTEXT:
{context_block}

HISTORY:
{history_text}

USER:
{query}

{tool_hint}

Respond clearly and accurately.
""".strip()

    try:
        response = client.models.generate_content(
            model=agent.model_name or "gemini-2.5-flash",
            contents=prompt
        )

        answer = (response.text or "").strip()

        if not answer:
            answer = "I couldn't generate a response. Please try again."

        # ─── SIMPLE TOOL EXECUTION ───
        tools_used = []

        for name in tool_names:
            if name in query.lower():
                try:
                    result = execute_tool(name, {"query": query})
                    tools_used.append({
                        "tool": name,
                        "result": result
                    })
                except Exception as e:
                    tools_used.append({
                        "tool": name,
                        "error": str(e)
                    })

        return {
            "answer": answer,
            "intent": intent,
            "tools_used": tools_used,
            "sources": sources
        }

    except Exception as e:
        return {
            "answer": f"System error: {str(e)}",
            "intent": intent,
            "tools_used": [],
            "sources": []
        }