from django.urls import path
from . import views

# URL patterns for the agents app
urlpatterns = [
    path('', views.agent_list, name='agent-list'),
]