"""
Agent Tools Registry
====================
A tool is a Python function the AI can call.
We register tools with a decorator so the AI knows what is available.
"""

import json
from typing import Callable, Dict, Any
from django.core.mail import send_mail


# ─── Tool Registry ───
# A dictionary mapping tool names to their functions and schemas
_TOOL_REGISTRY: Dict[str, Dict[str, Any]] = {}


def register_tool(name: str, description: str, parameters: dict):
    """
    Decorator to register a function as an AI-callable tool.
    
    Args:
        name: The function name the AI will use
        description: What this tool does (shown to the AI)
        parameters: JSON Schema describing required arguments
    
    Example:
        @register_tool(
            name="get_weather",
            description="Get current weather for a city",
            parameters={
                "type": "object",
                "properties": {
                    "city": {"type": "string", "description": "City name"}
                },
                "required": ["city"]
            }
        )
        def get_weather(city: str) -> str:
            return f"The weather in {city} is sunny."
    """
    def decorator(func: Callable) -> Callable:
        _TOOL_REGISTRY[name] = {
            'function': func,
            'description': description,
            'parameters': parameters
        }
        return func
    return decorator


def get_available_tools() -> list[dict]:
    """
    Return the tool definitions in OpenAI's expected format.
    This is sent to the LLM so it knows what tools exist.
    """
    tools = []
    for name, config in _TOOL_REGISTRY.items():
        tools.append({
            'type': 'function',
            'function': {
                'name': name,
                'description': config['description'],
                'parameters': config['parameters']
            }
        })
    return tools


def execute_tool(name: str, arguments: dict) -> str:
    """
    Execute a registered tool by name with the given arguments.
    
    Args:
        name: Tool name (must match a registered tool)
        arguments: Dict of arguments to pass to the function
    
    Returns:
        String result (this goes back to the LLM as a tool message)
    """
    if name not in _TOOL_REGISTRY:
        return f"Error: Tool '{name}' not found."
    
    tool = _TOOL_REGISTRY[name]
    func = tool['function']
    
    try:
        # Call the Python function with the provided arguments
        result = func(**arguments)
        return str(result)
    except Exception as e:
        return f"Error executing tool '{name}': {str(e)}"


# ─── REGISTERED TOOLS ───
# These are the actual tools your AI can use

@register_tool(
    name="create_support_ticket",
    description="Create a customer support ticket in the system. Use this when the user has a problem that requires human follow-up.",
    parameters={
        "type": "object",
        "properties": {
            "subject": {
                "type": "string",
                "description": "Short summary of the issue"
            },
            "priority": {
                "type": "string",
                "enum": ["low", "medium", "high", "urgent"],
                "description": "Priority level based on user frustration"
            },
            "category": {
                "type": "string",
                "enum": ["billing", "technical", "shipping", "general"],
                "description": "Category of the issue"
            }
        },
        "required": ["subject", "priority", "category"]
    }
)
def create_support_ticket(subject: str, priority: str, category: str) -> str:
    """
    Simulate creating a support ticket.
    In production, this would write to Zendesk, Jira, or your database.
    """
    # In a real app, you would save to a Ticket model here
    ticket_id = hash(subject + priority) % 100000  # Fake ID for demo
    return f"Support ticket #{ticket_id} created. Priority: {priority}. Category: {category}. A human agent will respond within 24 hours."


@register_tool(
    name="get_account_status",
    description="Check the user's account status, plan type, and billing information.",
    parameters={
        "type": "object",
        "properties": {
            "user_email": {
                "type": "string",
                "description": "Email address of the user to look up"
            }
        },
        "required": ["user_email"]
    }
)
def get_account_status(user_email: str) -> str:
    """
    Simulate looking up an account.
    In production, query your User/Subscription models.
    """
    # Fake data for demonstration
    return json.dumps({
        "email": user_email,
        "plan": "Pro Plan",
        "status": "active",
        "billing_cycle": "monthly",
        "next_payment": "2026-07-01"
    })


@register_tool(
    name="escalate_to_human",
    description="Escalate the conversation to a human agent immediately. Use this when the user is angry, asks for a human, or the AI cannot solve the problem.",
    parameters={
        "type": "object",
        "properties": {
            "reason": {
                "type": "string",
                "description": "Why the escalation is needed"
            },
            "urgency": {
                "type": "string",
                "enum": ["low", "medium", "high"],
                "description": "How urgent the escalation is"
            }
        },
        "required": ["reason", "urgency"]
    }
)
def escalate_to_human(reason: str, urgency: str) -> str:
    """
    Simulate escalating to a human.
    In production, this would send a Slack message, PagerDuty alert,
    or transfer to a live chat queue.
    """
    return f"Escalated to human agent. Reason: {reason}. Urgency: {urgency}. Expected response time: {'15 minutes' if urgency == 'high' else '1 hour'}."
