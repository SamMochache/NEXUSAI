"""
AI Service Layer
================
All communication with Gemini lives here.
"""

from google import genai
from django.conf import settings

_client = None


def get_client():
    global _client

    if _client is None:
        if not settings.GEMINI_API_KEY:
            raise RuntimeError(
                "GEMINI_API_KEY is not set in settings/.env"
            )

        _client = genai.Client(
            api_key=settings.GEMINI_API_KEY
        )

    return _client


def get_embedding(text: str) -> list[float]:
    """
    Generate embeddings using Gemini.
    """

    text = text.strip()

    if not text:
        raise ValueError(
            "Cannot generate embedding for empty text"
        )

    client = get_client()

    response = client.models.embed_content(
        model="gemini-embedding-001",
        contents=text
    )

    return response.embeddings[0].values