# services/analysis-service/app/__init__.py
"""
Natols Analysis Service

AI-powered stock analysis using Ollama LLM and technical indicators.
"""

__version__ = "1.0.0"
__author__ = "Natols Team"

from .config import settings

__all__ = ['settings']