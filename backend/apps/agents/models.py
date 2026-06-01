"""
Agents Models
=============
An "Agent" is an AI assistant configuration.
Think of it like creating a new employee profile:
- Name: What do we call this agent?
- Description: What does it do?
- System Prompt: The hidden instructions given to the AI
- Model: Which AI brain to use (GPT-4, Claude, etc.)
- Is Active: Is this agent currently working?
"""

from django.db import models


class Agent(models.Model):
    """
    Agent model - represents one AI assistant in our platform.
    """
    
    # Auto-created fields (Django handles these automatically)
    id = models.BigAutoField(primary_key=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Fields we fill in
    name = models.CharField(
        max_length=255,
        help_text="Display name for this AI agent"
    )
    
    description = models.TextField(
        blank=True,
        help_text="What does this agent do?"
    )
    
    system_prompt = models.TextField(
        default="You are a helpful AI assistant.",
        help_text="Hidden instructions sent to the AI every time"
    )
    
    model_name = models.CharField(
        max_length=100,
        default="gpt-4o-mini",
        help_text="Which AI model to use (e.g., gpt-4o-mini, claude-3-haiku)"
    )
    
    temperature = models.FloatField(
        default=0.7,
        help_text="Creativity level: 0 = robotic, 2 = chaotic"
    )
    
    max_tokens = models.IntegerField(
        default=512,
        help_text="Maximum response length in tokens"
    )
    
    is_active = models.BooleanField(
        default=True,
        help_text="Is this agent currently available?"
    )
    
    class Meta:
        # Database table name
        db_table = 'agents'
        
        # How results are ordered by default
        ordering = ['-created_at']
        
        # Human-readable names in the admin
        verbose_name = 'AI Agent'
        verbose_name_plural = 'AI Agents'
    
    def __str__(self):
        """
        String representation. Django uses this in the admin panel.
        """
        return f"{self.name} ({self.model_name})"