"""
Conversation Memory Service
===========================
Redis + PostgreSQL memory system.
"""

import json
import redis
from django.conf import settings
from .models import ChatMessage


_redis_client = None


def get_redis():
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.from_url(
            settings.REDIS_URL,
            decode_responses=True
        )
    return _redis_client


def _key(agent_id: int, user_id: int) -> str:
    return f"nexusai:agent:{agent_id}:user:{user_id}"


def add_message_to_memory(agent_id: int, user_id: int, role: str, content: str, metadata=None):
    ChatMessage.objects.create(
        agent_id=agent_id,
        user_id=user_id,
        role=role,
        content=content,
        metadata=metadata or {}
    )

    r = get_redis()
    key = _key(agent_id, user_id)

    r.rpush(key, json.dumps({
        "role": role,
        "content": content,
        "metadata": metadata or {}
    }))

    r.ltrim(key, -20, -1)
    r.expire(key, 86400)


def get_conversation_history(agent_id: int, user_id: int, limit: int = 10):
    r = get_redis()
    key = _key(agent_id, user_id)

    raw = r.lrange(key, -limit, -1)

    if raw:
        return [json.loads(x) for x in raw]

    qs = ChatMessage.objects.filter(
        agent_id=agent_id,
        user_id=user_id
    ).order_by("created_at").values("role", "content", "metadata")[:limit]

    return list(qs)


def clear_conversation_memory(agent_id: int, user_id: int):
    get_redis().delete(_key(agent_id, user_id))