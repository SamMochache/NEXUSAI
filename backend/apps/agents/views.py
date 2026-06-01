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
            'role': agent.role,
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


@api_view(['GET'])
def agent_stats(request):

    total_agents = Agent.objects.count()

    active_agents = Agent.objects.filter(
        is_active=True
    ).count()

    models_used = list(
        Agent.objects.values_list(
            'model_name',
            flat=True
        ).distinct()
    )

    return Response({
        "total_agents": total_agents,
        "active_agents": active_agents,
        "models_used": models_used
    })