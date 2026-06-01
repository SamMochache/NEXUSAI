"""
NexusAI URL Configuration (Module 2)
=====================================
Added JWT token endpoints.
"""

from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # API
    path('api/agents/', include('apps.agents.urls')),
    
    # Authentication (JWT)
    # POST /api/token/        → Give email/password, get access + refresh tokens
    # POST /api/token/refresh/ → Give refresh token, get new access token
    path('api/token/', TokenObtainPairView.as_view(), name='token-obtain'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('api/users/', include('apps.users.urls')),
]