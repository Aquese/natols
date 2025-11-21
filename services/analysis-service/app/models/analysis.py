# services/analysis-service/app/models/analysis.py
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime

class TechnicalIndicators(BaseModel):
    rsi: Optional[float] = None
    macd: Optional[Dict[str, float]] = None
    moving_averages: Optional[Dict[str, float]] = None
    bollinger_bands: Optional[Dict[str, float]] = None
    volume_trend: Optional[str] = None

class SentimentAnalysis(BaseModel):
    overall_sentiment: str  # positive, negative, neutral
    confidence: float
    sources: List[str]
    summary: str

class AIAnalysis(BaseModel):
    stock_symbol: str
    analysis_type: str  # fundamental, technical, sentiment, comprehensive
    summary: str
    recommendation: str  # buy, sell, hold
    confidence_score: float
    key_points: List[str]
    risks: List[str]
    opportunities: List[str]
    technical_indicators: Optional[TechnicalIndicators] = None
    sentiment: Optional[SentimentAnalysis] = None
    timestamp: datetime

class AnalysisResponse(BaseModel):
    success: bool
    data: Optional[AIAnalysis] = None
    error: Optional[str] = None
    processing_time: float