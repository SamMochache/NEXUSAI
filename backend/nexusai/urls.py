"""
NexusAI URL Configuration (Module 2)
=====================================
Added JWT token endpoints.
"""

from django.contrib import admin
from django.http import JsonResponse
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from apps.users.views import CustomTokenObtainPairView

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),

    # Root health check
    path('', lambda request: JsonResponse({'message': 'NexusAI API is running'})),
    
    # API
    path('api/agents/', include('apps.agents.urls')),
    
    # Authentication (JWT)
    # POST /api/token/        → Give email/password, get access + refresh tokens
    # POST /api/token/refresh/ → Give refresh token, get new access token
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token-obtain'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('api/users/', include('apps.users.urls')),
]