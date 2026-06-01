"""
Management Command: generate_embeddings
=======================================
Usage: python manage.py generate_embeddings

Scans all documents missing embeddings and generates them.
Run this once after installing Module 3, or whenever you add
a new embedding model.
"""

from django.core.management.base import BaseCommand
from apps.agents.models import Document
from apps.agents.ai_service import get_embedding


class Command(BaseCommand):
    help = 'Generate missing embeddings for all documents'

    def handle(self, *args, **options):
        # Find documents with NULL embedding
        docs = Document.objects.filter(embedding__isnull=True)
        total = docs.count()
        
        self.stdout.write(f"Found {total} documents without embeddings")
        
        success = 0
        failed = 0
        
        for doc in docs:
            try:
                doc.embedding = get_embedding(doc.content)
                doc.save(update_fields=['embedding'])
                success += 1
                self.stdout.write(
                    self.style.SUCCESS(f"✓ {doc.title}")
                )
            except Exception as e:
                failed += 1
                self.stdout.write(
                    self.style.ERROR(f"✗ {doc.title}: {e}")
                )
        
        self.stdout.write("-" * 40)
        self.stdout.write(f"Success: {success} | Failed: {failed}")