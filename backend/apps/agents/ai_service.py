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
        contents=text,
        config={
            "output_dimensionality": 1536
        }
    )

    if not response.embeddings:
        raise RuntimeError(
            "Gemini returned no embeddings."
        )
    return response.embeddings[0].values


def stream_chat_response(prompt: str, model_name: str = "gemini-2.5-flash"):
    """
    Streams Gemini response token-by-token.
    """

    client = get_client()

    response = client.models.generate_content_stream(
        model=model_name,
        contents=prompt
    )

    for chunk in response:
        if chunk.text:
            yield chunk.text