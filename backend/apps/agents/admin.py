from django.contrib import admin
from .models import Agent, Document


class DocumentInline(admin.TabularInline):
    """
    Show documents inside the Agent edit page.
    Like a mini-spreadsheet at the bottom of the form.
    """
    model = Document
    extra = 1  # Show 1 blank row for adding new documents


@admin.register(Agent)
class AgentAdmin(admin.ModelAdmin):
    list_display = ['name', 'owner', 'role', 'model_name', 'is_active', 'created_at']
    list_display_links = ['name']
    list_filter = ['is_active', 'model_name', 'role', 'created_at']
    search_fields = ['name', 'description', 'system_prompt', 'owner__username']
    
    fieldsets = (
        ('Ownership', {
            'fields': ('owner',),
            'description': 'Who owns this agent?'
        }),
        ('Basic Info', {
            'fields': ('name', 'description', 'role', 'is_active')
        }),
        ('AI Configuration', {
            'fields': ('system_prompt', 'model_name', 'temperature', 'max_tokens'),
            'description': 'These settings control how the AI behaves.'
        }),
    )
    
    inlines = [DocumentInline]


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ['title', 'agent', 'created_at']
    list_filter = ['created_at']
    search_fields = ['title', 'content', 'agent__name']