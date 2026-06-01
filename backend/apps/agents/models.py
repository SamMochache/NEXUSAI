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
from django.contrib.auth.models import User
from pgvector.django import VectorField

class Agent(models.Model):
    """
    Agent model - represents one AI assistant in our platform.
    """
    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='agents',
        help_text="The user who owns this agent"
    )
    
    ROLE_CHOICES = [
        ('support', 'Customer Support'),
        ('sales', 'Sales Assistant'),
        ('technical', 'Technical Support'),
    ]

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='support'
    )

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
        default="gemini-2.5-flash",
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


class Document(models.Model):
    """
    A document uploaded for RAG. Now stores a vector embedding
    so we can search by MEANING, not just keywords.
    """
    
    agent = models.ForeignKey(
        Agent,
        on_delete=models.CASCADE,
        related_name='documents',
        help_text="The agent this document belongs to"
    )
    
    title = models.CharField(max_length=255)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    # ─── NEW: The Vector Brain ───
    # VectorField stores a list of 1,536 floats inside PostgreSQL.
    # null=True allows documents to exist before their embedding is generated.
    # dimensions=1536 matches OpenAI's text-embedding-3-small output size.
    embedding = VectorField(
        dimensions=3072,
        null=True,
        blank=True,
        help_text="AI-generated meaning coordinates for semantic search"
    )
    
    class Meta:
        db_table = 'documents'
        ordering = ['-created_at']
        verbose_name = 'Document'
        verbose_name_plural = 'Documents'
    
    def __str__(self):
        return f"{self.title} ({self.agent.name})"
    
    def save(self, *args, **kwargs):
        """
        Auto-generate embedding when a document is created or updated.
        
        We override the default save() method. This is called every time
        you do document.save() or Document.objects.create().
        """
        # Only generate if we have content and no embedding yet
        if self.content and self.embedding is None:
            try:
                # Lazy import to avoid circular dependencies at module load time
                from .ai_service import get_embedding
                self.embedding = get_embedding(self.content)
            except Exception as e:
                # Production rule: NEVER crash the whole request
                # if the AI service fails. Log the error and continue.
                print(f"[EMBEDDING ERROR] Document '{self.title}': {e}")
                # self.embedding stays None, which is fine
        
        # Call the original save() to write to PostgreSQL
        super().save(*args, **kwargs)