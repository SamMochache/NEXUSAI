from django.urls import path
from . import views

urlpatterns = [
    path('', views.AgentListView.as_view(), name='agent-list'),
    path('stats/', views.AgentStatsView.as_view(), name='agent-stats'),
    path('<int:pk>/', views.AgentDetailView.as_view(), name='agent-detail'),
    path('<int:agent_id>/documents/',views.document_list),
    path('<int:agent_id>/documents/create/',views.create_document),
    path('<int:agent_id>/documents/<int:doc_id>/',views.delete_document),
    path('<int:agent_id>/search/', views.DocumentSearchView.as_view(), name='document-search'),
    path('<int:agent_id>/chat/', views.AgentChatView.as_view(), name='agent-chat'),

]