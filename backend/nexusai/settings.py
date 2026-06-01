"""
NexusAI Settings
================
This file controls how Django behaves.
"""

import os
from pathlib import Path
import dj_database_url

# ─── BASE DIRECTORY ───
# "Path(__file__)" means "the folder this file lives in"
# ".resolve().parent.parent" means "go up two folders"
# Result: the absolute path to ~/nexusai/backend
BASE_DIR = Path(__file__).resolve().parent.parent

# ─── SECURITY SETTINGS ───
# SECRET_KEY: A password Django uses for encryption. NEVER share it.
# In production, we load this from environment variables.
SECRET_KEY = 'dev-key-change-in-production-123456789'

# DEBUG: When True, Django shows detailed error pages.
# When False (production), it shows generic "Server Error" pages.
DEBUG = True

# ALLOWED_HOSTS: Which domain names can access this site.
# '*' means "anyone" (only safe for local development).
ALLOWED_HOSTS = ['*']

# ─── INSTALLED APPS ───
# Django is modular. These are the "plugins" we activate.
INSTALLED_APPS = [
    # Django built-in apps
    'django.contrib.admin',        # The admin dashboard
    'django.contrib.auth',         # User login/logout system
    'django.contrib.contenttypes', # Generic framework for models
    'django.contrib.sessions',     # Keeps users logged in
    'django.contrib.messages',     # Flash messages (like "Saved!")
    'django.contrib.staticfiles',  # CSS, JavaScript, images
    
    # Third-party apps
    'rest_framework',              # Django REST Framework (for APIs)
    
    # Our custom apps (we will create these)
    'apps.core',                   # Core functionality
    'apps.agents',                 # AI Agent management
]

# ─── MIDDLEWARE ───
# Middleware = code that processes every request before it hits your views.
# Think of it as security guards at the door.
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',  # Prevents hacker forms
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# ─── URL CONFIGURATION ───
# Where Django looks when someone visits a URL.
ROOT_URLCONF = 'nexusai.urls'

# ─── TEMPLATES ───
# How Django generates HTML pages.
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],  # We'll add template folders later
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# ─── WSGI APPLICATION ───
# The entry point for the web server.
WSGI_APPLICATION = 'nexusai.wsgi.application'

# ─── DATABASE ───
# Django supports PostgreSQL, MySQL, SQLite, Oracle.
# We use PostgreSQL because it's production-grade and supports vector search.
DATABASES = {
    "default": dj_database_url.config(
        default=os.getenv("DATABASE_URL")
    )
}

# ─── PASSWORD VALIDATION ───
# Rules for user passwords.
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ─── INTERNATIONALIZATION ───
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# ─── STATIC FILES ───
# CSS, JavaScript, images.
STATIC_URL = 'static/'

# ─── DEFAULT PRIMARY KEY ───
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ─── DJANGO REST FRAMEWORK ───
# How our API behaves.
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',  # Open for now (we'll lock this later)
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
}