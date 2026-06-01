"""
Conversation Memory Service
===========================
Manages short-term (Redis) and long-term (PostgreSQL) memory.
"""

import json
import redis
from django.conf import settings
from django.contrib.auth.models import User
from .models import Agent, ChatMessage


# Connect to Redis once when Django starts
_redis_client = None


def get_redis():
    """Lazy initialization of Redis connection."""
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.from_url(
            settings.REDIS_URL,
            decode_responses=True  # Auto-convert bytes to strings
        )
    return _redis_client


def _get_conversation_key(agent_id: int, user_id: int) -> str:
    """
    Create a unique Redis key for this agent-user pair.
    Format: nexusai:conversation:agent:{id}:user:{id}
    """
    return f"nexusai:conversation:agent:{agent_id}:user:{user_id}"


def add_message_to_memory(agent_id: int, user_id: int, role: str, content: str, metadata: dict = None):
    """
    Add a message to BOTH short-term (Redis) and long-term (PostgreSQL) memory.
    
    Args:
        agent_id: The AI agent involved
        user_id: The human user involved
        role: 'user', 'assistant', 'system', or 'tool'
        content: The message text
        metadata: Extra data (model name, tokens used, etc.)
    """
    # ─── 1. Save to PostgreSQL (permanent) ───
    ChatMessage.objects.create(
        agent_id=agent_id,
        user_id=user_id,
        role=role,
        content=content,
        metadata=metadata or {}
    )
    
    # ─── 2. Save to Redis (fast cache, last 20 messages) ───
    redis_client = get_redis()
    key = _get_conversation_key(agent_id, user_id)
    
    message_data = json.dumps({
        'role': role,
        'content': content,
        'metadata': metadata or {}
    })
    
    # Push to the right side of a list (append)
    redis_client.rpush(key, message_data)
    
    # Keep only the last 20 messages (trim old ones)
    # This prevents memory from growing forever
    redis_client.ltrim(key, -20, -1)
    
    # Set expiration: delete this conversation cache after 24 hours of inactivity
    # (we have it in PostgreSQL forever, so Redis is just a cache)
    redis_client.expire(key, 86400)  # 86400 seconds = 24 hours


def get_conversation_history(agent_id: int, user_id: int, limit: int = 10) -> list[dict]:
    """
    Retrieve recent conversation history from Redis (fast).
    If Redis is empty, fall back to PostgreSQL (slower but reliable).
    
    Args:
        agent_id: The AI agent
        user_id: The human user
        limit: How many messages to return (default 10)
    
    Returns:
        List of dicts: [{'role': 'user', 'content': '...'}, ...]
        Ordered oldest → newest (suitable for LLM prompt)
    """
    redis_client = get_redis()
    key = _get_conversation_key(agent_id, user_id)
    
    # Try Redis first (fast, < 1ms)
    raw_messages = redis_client.lrange(key, -limit, -1)
    
    if raw_messages:
        # Parse JSON strings back into dicts
        messages = [json.loads(m) for m in raw_messages]
        # lrange returns oldest-to-newest within the range, which is correct
        return messages
    
    # ─── Fallback to PostgreSQL ───
    # This happens if Redis was restarted or the conversation is old
    messages = ChatMessage.objects.filter(
        agent_id=agent_id,
        user_id=user_id
    ).order_by('created_at').values('role', 'content', 'metadata')[:limit]
    
    # Convert QuerySet to list of dicts
    return list(messages)


def clear_conversation_memory(agent_id: int, user_id: int):
    """
    Clear the short-term Redis memory for a conversation.
    Does NOT delete from PostgreSQL (that is the permanent record).
    """
    redis_client = get_redis()
    key = _get_conversation_key(agent_id, user_id)
    redis_client.delete(key)
