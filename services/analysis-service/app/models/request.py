# services/analysis-service/app/models/request.py
from pydantic import BaseModel, Field
from typing import Optional, List

class AnalysisRequest(BaseModel):
    symbol: str = Field(..., description="Stock symbol (e.g., AAPL)")
    analysis_type: str = Field(
        default="comprehensive",
        description="Type of analysis: fundamental, technical, sentiment, or comprehensive"
    )
    include_technical: bool = Field(default=True, description="Include technical analysis")
    include_sentiment: bool = Field(default=True, description="Include sentiment analysis")
    custom_prompt: Optional[str] = Field(None, description="Custom analysis prompt")

class CompareRequest(BaseModel):
    symbols: List[str] = Field(..., description="List of stock symbols to compare")
    criteria: List[str] = Field(
        default=["valuation", "growth", "profitability"],
        description="Comparison criteria"
    )

class PortfolioAnalysisRequest(BaseModel):
    portfolio_id: int = Field(..., description="Portfolio ID to analyze")
    include_recommendations: bool = Field(default=True, description="Include rebalancing recommendations")