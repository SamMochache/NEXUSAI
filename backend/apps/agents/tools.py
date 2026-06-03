"""
Agent Tools Registry
====================
A tool is a Python function the AI can call.
"""

import json
from typing import Callable, Dict, Any

_TOOL_REGISTRY: Dict[str, Dict[str, Any]] = {}


def register_tool(name: str, description: str, parameters: dict):
    def decorator(func: Callable) -> Callable:
        _TOOL_REGISTRY[name] = {
            "function": func,
            "description": description,
            "parameters": parameters
        }
        return func
    return decorator


def get_available_tools() -> list[dict]:
    tools = []

    for name, config in _TOOL_REGISTRY.items():
        tools.append({
            "type": "function",
            "function": {
                "name": name,
                "description": config["description"],
                "parameters": config["parameters"]
            }
        })

    return tools


def execute_tool(name: str, arguments: dict) -> str:
    if name not in _TOOL_REGISTRY:
        return f"Tool '{name}' not found."

    func = _TOOL_REGISTRY[name]["function"]

    try:
        return str(func(**arguments))
    except Exception as e:
        return f"Tool error: {str(e)}"


# ─── REGISTERED TOOLS ───

@register_tool(
    name="create_support_ticket",
    description="Create a support ticket",
    parameters={
        "type": "object",
        "properties": {
            "subject": {"type": "string"},
            "priority": {"type": "string"},
            "category": {"type": "string"}
        },
        "required": ["subject", "priority", "category"]
    }
)
def create_support_ticket(subject: str, priority: str, category: str) -> str:
    return f"Ticket created: {subject} ({priority}, {category})"


@register_tool(
    name="get_account_status",
    description="Get user account status",
    parameters={
        "type": "object",
        "properties": {
            "user_email": {"type": "string"}
        },
        "required": ["user_email"]
    }
)
def get_account_status(user_email: str) -> str:
    return json.dumps({
        "email": user_email,
        "plan": "Pro",
        "status": "active"
    })


@register_tool(
    name="escalate_to_human",
    description="Escalate to human agent",
    parameters={
        "type": "object",
        "properties": {
            "reason": {"type": "string"},
            "urgency": {"type": "string"}
        },
        "required": ["reason", "urgency"]
    }
)
def escalate_to_human(reason: str, urgency: str) -> str:
    return f"Escalated: {reason} ({urgency})"