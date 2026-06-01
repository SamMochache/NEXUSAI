from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Agent, Document
from .serializers import (
    AgentSerializer,
    AgentListSerializer,
    DocumentSerializer,
)


class AgentListView(APIView):
    """
    GET  /api/agents/
    POST /api/agents/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):

        agents = Agent.objects.filter(
            owner=request.user
        )

        serializer = AgentListSerializer(
            agents,
            many=True
        )

        return Response({
            "count": agents.count(),
            "agents": serializer.data
        })

    def post(self, request):

        serializer = AgentSerializer(
            data=request.data,
            context={"request": request}
        )

        if serializer.is_valid():

            serializer.save(
                owner=request.user
            )

            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class AgentDetailView(APIView):
    """
    GET    /api/agents/<id>/
    PUT    /api/agents/<id>/
    DELETE /api/agents/<id>/
    """
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, user):

        try:
            return Agent.objects.get(
                pk=pk,
                owner=user
            )

        except Agent.DoesNotExist:
            return None

    def get(self, request, pk):

        agent = self.get_object(
            pk,
            request.user
        )

        if not agent:
            return Response(
                {"error": "Not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = AgentSerializer(agent)

        return Response(serializer.data)

    def put(self, request, pk):

        agent = self.get_object(
            pk,
            request.user
        )

        if not agent:
            return Response(
                {"error": "Not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = AgentSerializer(
            agent,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():

            serializer.save()

            return Response(serializer.data)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    def delete(self, request, pk):

        agent = self.get_object(
            pk,
            request.user
        )

        if not agent:
            return Response(
                {"error": "Not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        agent.delete()

        return Response(
            {"message": "Agent deleted"},
            status=status.HTTP_204_NO_CONTENT
        )


class AgentStatsView(APIView):
    """
    GET /api/agents/stats/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):

        agents = Agent.objects.filter(
            owner=request.user
        )

        models_used = list(
            set(
                agents.values_list(
                    "model_name",
                    flat=True
                )
            )
        )

        return Response({
            "total_agents": agents.count(),
            "active_agents": agents.filter(
                is_active=True
            ).count(),
            "models_used": models_used,
        })


# =====================================================
# DOCUMENT ENDPOINTS
# =====================================================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def document_list(request, agent_id):
    """
    GET /api/agents/<agent_id>/documents/
    """

    agent = get_object_or_404(
        Agent,
        id=agent_id,
        owner=request.user
    )

    documents = agent.documents.all()

    serializer = DocumentSerializer(
        documents,
        many=True
    )

    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_document(request, agent_id):
    """
    POST /api/agents/<agent_id>/documents/
    """

    agent = get_object_or_404(
        Agent,
        id=agent_id,
        owner=request.user
    )

    serializer = DocumentSerializer(
        data=request.data
    )

    if serializer.is_valid():

        serializer.save(
            agent=agent
        )

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_document(request, agent_id, doc_id):
    """
    DELETE /api/agents/<agent_id>/documents/<doc_id>/
    """

    document = get_object_or_404(
        Document,
        id=doc_id,
        agent__id=agent_id,
        agent__owner=request.user
    )

    document.delete()

    return Response(
        {"message": "Document deleted"},
        status=status.HTTP_204_NO_CONTENT
    )