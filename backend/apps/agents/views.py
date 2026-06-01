"""
Agents Views (Module 2)
========================
Using Django REST Framework's APIView for full control.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .models import Agent
from .serializers import AgentSerializer, AgentListSerializer


class AgentListView(APIView):
    """
    GET  /api/agents/     → List all agents owned by the current user
    POST /api/agents/     → Create a new agent (auto-assigns current user as owner)
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        List view. Only returns agents where owner = current user.
        """
        # request.user is the currently logged-in user (from JWT token)
        agents = Agent.objects.filter(owner=request.user)
        
        # Use lightweight serializer for lists
        serializer = AgentListSerializer(agents, many=True)
        
        return Response({
            'count': agents.count(),
            'agents': serializer.data
        })
    
    def post(self, request):
        """
        Create view. Auto-assigns owner to the current user.
        """
        # We pass request context so the serializer can access the user if needed
        serializer = AgentSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            # Save but override the owner field to current user
            # (prevents users from creating agents for other users)
            serializer.save(owner=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        # If validation fails, return 400 with error details
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AgentDetailView(APIView):
    """
    GET    /api/agents/<id>/  → Retrieve one agent
    PUT    /api/agents/<id>/  → Update an agent
    DELETE /api/agents/<id>/  → Delete an agent
    """
    permission_classes = [IsAuthenticated]
    
    def get_object(self, pk, user):
        """
        Helper method: fetch agent or return 404.
        Also ensures the agent belongs to the requesting user.
        """
        try:
            return Agent.objects.get(pk=pk, owner=user)
        except Agent.DoesNotExist:
            return None
    
    def get(self, request, pk):
        agent = self.get_object(pk, request.user)
        if not agent:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = AgentSerializer(agent)
        return Response(serializer.data)
    
    def put(self, request, pk):
        agent = self.get_object(pk, request.user)
        if not agent:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = AgentSerializer(agent, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, pk):
        agent = self.get_object(pk, request.user)
        if not agent:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        
        agent.delete()
        return Response({'message': 'Agent deleted'}, status=status.HTTP_204_NO_CONTENT)


class AgentStatsView(APIView):
    """
    GET /api/agents/stats/ → Statistics for the current user's agents
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        agents = Agent.objects.filter(owner=request.user)
        
        # Get unique model names using Python set comprehension
        models_used = list(set(agents.values_list('model_name', flat=True)))
        
        data = {
            'total_agents': agents.count(),
            'active_agents': agents.filter(is_active=True).count(),
            'models_used': models_used,
        }
        
        return Response(data)