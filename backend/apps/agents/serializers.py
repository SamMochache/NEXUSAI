"""
Agents Serializers
==================
Translates between Agent model instances and JSON.
"""

from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Agent, Document


class DocumentSerializer(serializers.ModelSerializer):
    """
    Serializer for the Document model.
    ModelSerializer automatically creates fields based on the model.
    """
    class Meta:
        model = Document
        fields = ['id', 'title', 'content', 'created_at']
        read_only_fields = ['agent', 'created_at']


class AgentSerializer(serializers.ModelSerializer):
    """
    Serializer for the Agent model.
    
    We add a 'document_count' field that doesn't exist in the model
    but is computed on the fly.
    """
    # Read-only computed field
    document_count = serializers.SerializerMethodField()
    
    # Show the owner's username instead of just the user ID
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    
    class Meta:
        model = Agent
        fields = [
            'id', 'name', 'description', 'role', 'system_prompt',
            'model_name', 'temperature', 'max_tokens', 'is_active',
            'owner', 'owner_username', 'document_count',
            'created_at', 'updated_at'
        ]
        # 'owner' is included so the API knows who owns it,
        # but we will override this in the view to auto-assign the current user.
        read_only_fields = ['id', 'created_at', 'updated_at', 'owner_username']
    
    def get_document_count(self, obj):
        """
        SerializerMethodField calls methods named get_<field_name>.
        Returns the number of documents attached to this agent.
        """
        return obj.documents.count()
    
    def validate_temperature(self, value):
        """
        Custom validation: temperature must be between 0 and 2.
        """
        if not 0.0 <= value <= 2.0:
            raise serializers.ValidationError("Temperature must be between 0.0 and 2.0.")
        return value
    
    def validate_max_tokens(self, value):
        """
        Custom validation: max_tokens must be positive.
        """
        if value < 1:
            raise serializers.ValidationError("Max tokens must be at least 1.")
        return value


class AgentListSerializer(serializers.ModelSerializer):
    """
    A lightweight serializer for list views.
    Doesn't include the full system_prompt (which could be very long).
    """
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    
    class Meta:
        model = Agent
        fields = [
            'id', 'name', 'role', 'model_name', 'is_active',
            'owner_username', 'created_at'
        ]