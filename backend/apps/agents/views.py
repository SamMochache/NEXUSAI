"""
Agents Views
============
"Views" are functions or classes that handle web requests.
When someone visits a URL, Django sends the request to a view,
and the view sends back a response.
"""

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Agent


@api_view(['GET'])
def agent_list(request):
    """
    GET /api/agents/
    Returns a list of all active AI agents.
    """
    # Fetch all active agents from the database
    agents = Agent.objects.filter(is_active=True)
    
    # Convert each agent to a dictionary (JSON needs dictionaries)
    data = []
    for agent in agents:
        data.append({
            'id': agent.id,
            'name': agent.name,
            'description': agent.description,
            'model_name': agent.model_name,
            'temperature': agent.temperature,
            'max_tokens': agent.max_tokens,
            'created_at': agent.created_at.isoformat(),
        })
    
    # Response is automatically converted to JSON by Django REST Framework
    return Response({
        'count': len(data),
        'agents': data
    })