"""
NexusAI URL Configuration
=========================
The main router for the entire project.
"""

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    # Admin dashboard at /admin/
    path('admin/', admin.site.urls),
    
    # API endpoints at /api/agents/
    path('api/agents/', include('apps.agents.urls')),
]