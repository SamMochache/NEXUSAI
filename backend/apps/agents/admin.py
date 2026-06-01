from django.contrib import admin
from .models import Agent


@admin.register(Agent)
class AgentAdmin(admin.ModelAdmin):
    """
    Custom admin interface for the Agent model.
    This controls how agents look in the Django admin dashboard.
    """
    
    # Which columns show in the list view
    list_display = ['name', 'model_name', 'is_active', 'created_at', 'temperature']
    
    # Which fields can be clicked to edit
    list_display_links = ['name']
    
    # Filters on the right sidebar
    list_filter = ['is_active', 'model_name', 'created_at']
    
    # Search box fields
    search_fields = ['name', 'description', 'system_prompt']
    
    # Fields that show on the edit page, organized into sections
    fieldsets = (
        ('Basic Info', {
            'fields': ('name', 'description', 'is_active')
        }),
        ('AI Configuration', {
            'fields': ('system_prompt', 'model_name', 'temperature', 'max_tokens'),
            'description': 'These settings control how the AI behaves.'
        }),
    )