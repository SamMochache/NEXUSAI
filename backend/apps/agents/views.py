from django.http import StreamingHttpResponse
from django.shortcuts import get_object_or_404
from django.utils.dateparse import parse_date
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Agent, ChatMessage, Document
from .serializers import (
    AgentSerializer,
    AgentListSerializer,
    DocumentSerializer,
)
from .ai_service import get_embedding, stream_chat_response
from pgvector.django import CosineDistance
from .memory_service import add_message_to_memory, get_conversation_history
from .workflow_service import run_agent_workflow


# =====================================================
# AGENTS
# =====================================================

class AgentListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        agents = Agent.objects.filter(owner=request.user)

        serializer = AgentListSerializer(agents, many=True)

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
            serializer.save(owner=request.user)

            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AgentDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, user):
        try:
            return Agent.objects.get(pk=pk, owner=user)
        except Agent.DoesNotExist:
            return None

    def get(self, request, pk):
        agent = self.get_object(pk, request.user)

        if not agent:
            return Response({"error": "Not found"}, status=404)

        return Response(AgentSerializer(agent).data)

    def put(self, request, pk):
        agent = self.get_object(pk, request.user)

        if not agent:
            return Response({"error": "Not found"}, status=404)

        serializer = AgentSerializer(agent, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        agent = self.get_object(pk, request.user)

        if not agent:
            return Response({"error": "Not found"}, status=404)

        agent.delete()

        return Response(
            {"message": "Agent deleted"},
            status=status.HTTP_204_NO_CONTENT
        )


class AgentStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        agents = Agent.objects.filter(owner=request.user)

        models_used = list(set(
            agents.values_list("model_name", flat=True)
        ))

        return Response({
            "total_agents": agents.count(),
            "active_agents": agents.filter(is_active=True).count(),
            "models_used": models_used,
        })


# =====================================================
# DOCUMENTS
# =====================================================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def document_list(request, agent_id):
    agent = get_object_or_404(Agent, id=agent_id, owner=request.user)

    serializer = DocumentSerializer(agent.documents.all(), many=True)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_document(request, agent_id):
    agent = get_object_or_404(Agent, id=agent_id, owner=request.user)

    serializer = DocumentSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save(agent=agent)

        return Response(serializer.data, status=201)

    return Response(serializer.errors, status=400)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_document(request, agent_id, doc_id):
    document = get_object_or_404(
        Document,
        id=doc_id,
        agent__id=agent_id,
        agent__owner=request.user
    )

    document.delete()

    return Response({"message": "Document deleted"}, status=204)


class DocumentSearchView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, agent_id):
        try:
            agent = Agent.objects.get(pk=agent_id, owner=request.user)
        except Agent.DoesNotExist:
            return Response({'error': 'Agent not found'}, status=404)

        query = request.data.get('query', '').strip()
        if not query:
            return Response({'error': 'Query is required'}, status=400)

        min_similarity = float(request.data.get('min_similarity', 0.7))
        created_after = request.data.get('created_after')

        distance_threshold = 1 - min_similarity
        created_after_date = parse_date(created_after) if created_after else None

        try:
            query_embedding = get_embedding(query)
        except Exception as e:
            return Response({'error': str(e)}, status=500)

        queryset = Document.objects.filter(
            agent=agent,
            embedding__isnull=False
        )

        if created_after_date:
            queryset = queryset.filter(created_at__gt=created_after_date)

        results = queryset.annotate(
            distance=CosineDistance('embedding', query_embedding)
        ).filter(
            distance__lt=distance_threshold
        ).order_by('distance')[:5]

        data = []
        for doc in results:
            similarity = 1 - float(doc.distance)

            data.append({
                "id": doc.id,
                "title": doc.title,
                "content": doc.content[:300],
                "similarity_score": round(similarity, 4),
                "distance": round(float(doc.distance), 4)
            })

        return Response({
            "query": query,
            "agent": agent.name,
            "results_count": len(data),
            "results": data
        })


# =====================================================
# CHAT PIPELINE
# =====================================================

class AgentChatView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, agent_id):

        try:
            agent = Agent.objects.get(pk=agent_id, owner=request.user)
        except Agent.DoesNotExist:
            return Response({"error": "Agent not found"}, status=404)

        query = request.data.get("query", "").strip()
        if not query:
            return Response({"error": "Query is required"}, status=400)

        # Memory
        history = get_conversation_history(agent_id, request.user.id, limit=10)

        # RAG
        documents_data = []
        try:
            query_embedding = get_embedding(query)

            docs = Document.objects.filter(
                agent=agent,
                embedding__isnull=False
            ).annotate(
                distance=CosineDistance('embedding', query_embedding)
            ).filter(
                distance__lt=0.4
            ).order_by('distance')[:3]

            for doc in docs:
                documents_data.append({
                    "id": doc.id,
                    "title": doc.title,
                    "content": doc.content,
                    "similarity_score": round(1 - float(doc.distance), 4)
                })

        except Exception as e:
            print(f"[RAG ERROR] {e}")

        # Save user message
        add_message_to_memory(
            agent_id=agent_id,
            user_id=request.user.id,
            role="user",
            content=query,
            metadata={"rag_docs_found": len(documents_data)}
        )

        # Workflow
        result = run_agent_workflow(
            agent=agent,
            user=request.user,
            query=query,
            conversation_history=history,
            documents=documents_data
        )

        # Save assistant message
        add_message_to_memory(
            agent_id=agent_id,
            user_id=request.user.id,
            role="assistant",
            content=result["answer"],
            metadata={
                "model_used": agent.model_name,
                "intent": result["intent"],
                "tools_used": [t["tool"] for t in result["tools_used"]],
                "sources": [s.get("title", "") for s in result.get("sources", [])]
            }
        )

        return Response({
            "query": query,
            "agent": agent.name,
            "response": result["answer"],
            "intent": result["intent"],
            "tools_used": result["tools_used"],
            "sources": result["sources"],
            "conversation_length": len(history) + 2
        })


class ChatHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, agent_id):

        try:
            agent = Agent.objects.get(pk=agent_id, owner=request.user)
        except Agent.DoesNotExist:
            return Response({"error": "Agent not found"}, status=404)

        messages = ChatMessage.objects.filter(
            agent=agent,
            user=request.user
        ).order_by("-created_at")[:50]

        return Response({
            "agent": agent.name,
            "messages": [
                {
                    "role": m.role,
                    "content": m.content,
                    "metadata": m.metadata,
                    "created_at": m.created_at.isoformat()
                }
                for m in reversed(messages)
            ]
        })


# =====================================================
# STREAMING CHAT
# =====================================================

class AgentChatStreamView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, agent_id):

        query = request.data.get("query", "").strip()

        if not query:
            return StreamingHttpResponse(
                "event: error\ndata: Query is required\n\n",
                content_type="text/event-stream"
            )

        try:
            agent = Agent.objects.get(pk=agent_id, owner=request.user)
        except Agent.DoesNotExist:
            return StreamingHttpResponse(
                "event: error\ndata: Agent not found\n\n",
                content_type="text/event-stream"
            )

        prompt = f"""
You are {agent.name}.
System: {agent.system_prompt}

User: {query}
"""

        def event_stream():
            try:
                for token in stream_chat_response(prompt, agent.model_name):
                    yield f"data: {token}\n\n"
            except Exception as e:
                yield f"data: ERROR: {str(e)}\n\n"

        return StreamingHttpResponse(
            event_stream(),
            content_type="text/event-stream"
        )