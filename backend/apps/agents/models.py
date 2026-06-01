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
from pgvector.django import IvfflatIndex, VectorField
import re

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
    # dimensions=3072 matches Gemini gemini-2.5-flash  output size. we used 1536  because of vector indexing > 2000 dimention does not work
    embedding = VectorField(
        dimensions=1536 ,
        null=True,
        blank=True,
        help_text="AI-generated meaning coordinates for semantic search"
    )
    
    class Meta:
        db_table = 'documents'
        ordering = ['-created_at']

        indexes = [
            
            IvfflatIndex(
                name='document_embedding_ivfflat_idx',
                fields=['embedding'],
                opclasses=['vector_cosine_ops'],
                lists=100
            )
        ]
    
    def __str__(self):
        return f"{self.title} ({self.agent.name})"
    
    def save(self, *args, **kwargs):
        """
        Save document and automatically generate embeddings.

        Small documents:
            - Generate one embedding for the whole document.

        Large documents (>1000 words):
            - Split into chunks.
            - Generate one embedding per chunk.
        """

        super().save(*args, **kwargs)

        if not self.content:
            return

        try:
            from .ai_service import get_embedding

            word_count = len(self.content.split())

            # SMALL DOCUMENTS
            if word_count <= 1000:

                embedding = get_embedding(self.content)

                Document.objects.filter(
                    pk=self.pk
                ).update(
                    embedding=embedding
                )

            # LARGE DOCUMENTS
            else:

                # remove old chunks
                self.chunks.all().delete()

                chunks = split_into_chunks(
                    self.content,
                    max_words=1000
                )

                for index, chunk_text in enumerate(chunks):

                    embedding = get_embedding(chunk_text)

                    DocumentChunk.objects.create(
                        document=self,
                        chunk_index=index,
                        content=chunk_text,
                        embedding=embedding
                    )

        except Exception as e:

            print(
                f"[EMBEDDING ERROR] Document '{self.title}': {e}"
            )

class DocumentChunk(models.Model):
    """
    Smaller chunks of a document used for RAG.
    Each chunk gets its own embedding.
    """

    document = models.ForeignKey(
        Document,
        on_delete=models.CASCADE,
        related_name="chunks"
    )

    chunk_index = models.IntegerField()

    content = models.TextField()

    embedding = VectorField(
        dimensions=1536,
        null=True,
        blank=True
    )

    class Meta:
        ordering = ["chunk_index"]

    def __str__(self):
        return f"{self.document.title} - Chunk {self.chunk_index}"



def split_into_chunks(text, max_words=1000):
    """
    Split document into chunks.

    First split by paragraphs.
    If a paragraph is too large,
    split it by sentences.
    """

    chunks = []

    paragraphs = text.split("\n\n")

    current_chunk = ""
    current_words = 0

    for paragraph in paragraphs:

        paragraph_words = len(paragraph.split())

        if current_words + paragraph_words <= max_words:
            current_chunk += "\n\n" + paragraph
            current_words += paragraph_words

        else:

            if current_chunk:
                chunks.append(current_chunk.strip())

            if paragraph_words > max_words:

                sentences = re.split(
                    r'(?<=[.!?])\s+',
                    paragraph
                )

                current_chunk = ""
                current_words = 0

                for sentence in sentences:

                    sentence_words = len(
                        sentence.split()
                    )

                    if current_words + sentence_words > max_words:

                        chunks.append(
                            current_chunk.strip()
                        )

                        current_chunk = sentence
                        current_words = sentence_words

                    else:

                        current_chunk += " " + sentence
                        current_words += sentence_words

            else:

                current_chunk = paragraph
                current_words = paragraph_words

    if current_chunk:
        chunks.append(current_chunk.strip())

    return chunks