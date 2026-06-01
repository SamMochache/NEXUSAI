from django.shortcuts import get_object_or_404
from django.utils.dateparse import parse_date

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
from .ai_service import get_embedding
from pgvector.django import CosineDistance

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


class DocumentSearchView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, agent_id):
        # ─── 1. Verify agent ownership ───
        try:
            agent = Agent.objects.get(pk=agent_id, owner=request.user)
        except Agent.DoesNotExist:
            return Response(
                {'error': 'Agent not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # ─── 2. Validate query ───
        query = request.data.get('query', '').strip()
        if not query:
            return Response(
                {'error': 'Query is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ─── 3. Optional filters ───
        min_similarity = float(request.data.get('min_similarity', 0.7))
        created_after = request.data.get('created_after', None)

        # Convert similarity → distance threshold
        # similarity = 1 - distance → distance = 1 - similarity
        distance_threshold = 1 - min_similarity

        created_after_date = parse_date(created_after) if created_after else None

        # ─── 4. Generate embedding ───
        try:
            query_embedding = get_embedding(query)
        except Exception as e:
            return Response(
                {'error': f'Failed to process query: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # ─── 5. Build base queryset ───
        queryset = Document.objects.filter(
            agent=agent,
            embedding__isnull=False
        )

        # Apply date filter if provided
        if created_after_date:
            queryset = queryset.filter(created_at__gt=created_after_date)

        # ─── 6. Vector search ───
        results = queryset.annotate(
            distance=CosineDistance('embedding', query_embedding)
        ).filter(
            distance__lt=distance_threshold
        ).order_by('distance')[:5]

        # ─── 7. Format results ───
        data = []
        for doc in results:
            similarity = 1 - float(doc.distance)

            data.append({
                'id': doc.id,
                'title': doc.title,
                'content': doc.content[:300] + '...' if len(doc.content) > 300 else doc.content,
                'similarity_score': round(similarity, 4),
                'distance': round(float(doc.distance), 4)
            })

        # ─── 8. Empty result handling ───
        if not data:
            return Response({
                'query': query,
                'agent': agent.name,
                'results_count': 0,
                'results': [],
                'message': "No highly relevant documents found"
            })

        return Response({
            'query': query,
            'agent': agent.name,
            'results_count': len(data),
            'results': data
        })