# services/analysis-service/app/routes/analysis.py
from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List
import time
from datetime import datetime

from app.models.request import AnalysisRequest, CompareRequest, PortfolioAnalysisRequest
from app.models.analysis import AnalysisResponse, AIAnalysis, TechnicalIndicators, SentimentAnalysis
from app.services.ollama_service import ollama_service
from app.services.technical_analysis import technical_service
from app.services.sentiment_service import sentiment_service

router = APIRouter()

@router.post("/stock", response_model=AnalysisResponse)
async def analyze_stock(request: AnalysisRequest):
    """Analyze a single stock with AI-powered insights"""
    start_time = time.time()
    
    try:
        # Mock stock data - in production, fetch from data-service
        stock_data = {
            "symbol": request.symbol,
            "price": 150.00,
            "change_percent": 2.5,
            "volume": 50000000,
            "market_cap": 2400000000000
        }
        
        # Mock historical prices for technical analysis
        # In production, fetch from data-service API
        mock_prices = [145, 147, 146, 148, 150, 151, 149, 152, 150, 153, 
                       152, 154, 156, 155, 157, 159, 158, 160, 162, 161]
        mock_volumes = [45000000, 47000000, 46000000, 48000000, 50000000,
                        51000000, 49000000, 52000000, 50000000, 53000000,
                        52000000, 54000000, 56000000, 55000000, 57000000,
                        59000000, 58000000, 60000000, 62000000, 61000000]
        
        # Technical Analysis
        technical_indicators = None
        if request.include_technical:
            tech_data = technical_service.get_comprehensive_analysis(mock_prices, mock_volumes)
            technical_indicators = TechnicalIndicators(
                rsi=tech_data.get('rsi'),
                macd=tech_data.get('macd'),
                moving_averages=tech_data.get('moving_averages'),
                bollinger_bands=tech_data.get('bollinger_bands'),
                volume_trend=tech_data.get('volume_trend')
            )
            stock_data['technical_indicators'] = tech_data
        
        # Sentiment Analysis
        sentiment = None
        if request.include_sentiment:
            sentiment_data = await sentiment_service.analyze_news_sentiment(request.symbol)
            sentiment = SentimentAnalysis(
                overall_sentiment=sentiment_data['overall_sentiment'],
                confidence=sentiment_data['confidence'],
                sources=sentiment_data['sources'],
                summary=sentiment_data['summary']
            )
        
        # AI Analysis using Ollama
        if request.custom_prompt:
            ai_response = await ollama_service.generate(request.custom_prompt)
            summary = ai_response
            recommendation = "N/A"
            confidence_score = 0.5
            key_points = [ai_response[:100]]
            risks = []
            opportunities = []
        else:
            ai_response = await ollama_service.analyze_stock(request.symbol, stock_data)
            
            # Parse AI response
            summary = ai_response[:500] if len(ai_response) > 500 else ai_response
            
            # Extract recommendation (simple parsing)
            recommendation = "Hold"
            if "buy" in ai_response.lower() and "don't buy" not in ai_response.lower():
                recommendation = "Buy"
            elif "sell" in ai_response.lower():
                recommendation = "Sell"
            
            # Calculate confidence based on technical indicators
            confidence_score = 0.7
            if technical_indicators and technical_indicators.rsi:
                if 30 <= technical_indicators.rsi <= 70:
                    confidence_score = 0.8
            
            # Extract key points (simple extraction)
            key_points = [
                f"Current price: ${stock_data['price']}",
                f"Price change: {stock_data['change_percent']}%",
                f"Technical outlook: {technical_indicators.volume_trend if technical_indicators else 'N/A'}"
            ]
            
            risks = [
                "Market volatility",
                "Economic uncertainties"
            ]
            
            opportunities = [
                "Strong technical indicators" if technical_indicators and technical_indicators.rsi and technical_indicators.rsi < 50 else "Market momentum",
                "Positive sentiment" if sentiment and sentiment.overall_sentiment == "positive" else "Market positioning"
            ]
        
        # Create analysis result
        analysis = AIAnalysis(
            stock_symbol=request.symbol,
            analysis_type=request.analysis_type,
            summary=summary,
            recommendation=recommendation,
            confidence_score=confidence_score,
            key_points=key_points,
            risks=risks,
            opportunities=opportunities,
            technical_indicators=technical_indicators,
            sentiment=sentiment,
            timestamp=datetime.utcnow()
        )
        
        processing_time = time.time() - start_time
        
        return AnalysisResponse(
            success=True,
            data=analysis,
            processing_time=processing_time
        )
        
    except Exception as e:
        processing_time = time.time() - start_time
        return AnalysisResponse(
            success=False,
            error=str(e),
            processing_time=processing_time
        )

@router.post("/compare")
async def compare_stocks(request: CompareRequest):
    """Compare multiple stocks"""
    start_time = time.time()
    
    try:
        # Mock data for comparison
        stocks_data = {}
        for symbol in request.symbols:
            stocks_data[symbol] = {
                "price": 150.00,
                "market_cap": 2400000000000,
                "pe_ratio": 25.5,
                "revenue_growth": 15.2,
                "profit_margin": 21.5
            }
        
        # Get AI comparison
        comparison = await ollama_service.compare_stocks(stocks_data)
        
        processing_time = time.time() - start_time
        
        return {
            "success": True,
            "symbols": request.symbols,
            "criteria": request.criteria,
            "comparison": comparison,
            "processing_time": processing_time
        }
        
    except Exception as e:
        processing_time = time.time() - start_time
        return {
            "success": False,
            "error": str(e),
            "processing_time": processing_time
        }

@router.post("/portfolio")
async def analyze_portfolio(request: PortfolioAnalysisRequest):
    """Analyze entire portfolio"""
    start_time = time.time()
    
    try:
        # Mock portfolio data
        # In production, fetch from data-service
        portfolio_data = {
            "portfolio_id": request.portfolio_id,
            "total_value": 100000,
            "total_cost": 90000,
            "total_gain": 10000,
            "holdings": [
                {"symbol": "AAPL", "quantity": 100, "value": 15000, "weight": 15},
                {"symbol": "GOOGL", "quantity": 50, "value": 12500, "weight": 12.5},
                {"symbol": "MSFT", "quantity": 75, "value": 22500, "weight": 22.5}
            ]
        }
        
        # Get AI analysis
        analysis = await ollama_service.portfolio_analysis(portfolio_data)
        
        processing_time = time.time() - start_time
        
        return {
            "success": True,
            "portfolio_id": request.portfolio_id,
            "analysis": analysis,
            "include_recommendations": request.include_recommendations,
            "processing_time": processing_time
        }
        
    except Exception as e:
        processing_time = time.time() - start_time
        return {
            "success": False,
            "error": str(e),
            "processing_time": processing_time
        }

@router.get("/sentiment/{symbol}")
async def get_sentiment(symbol: str):
    """Get sentiment analysis for a stock"""
    try:
        sentiment_data = await sentiment_service.analyze_news_sentiment(symbol)
        
        return {
            "success": True,
            "symbol": symbol,
            "sentiment": sentiment_data
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/fear-greed/{symbol}")
async def get_fear_greed_index(symbol: str):
    """Calculate Fear & Greed index for a stock"""
    try:
        # Mock market data
        market_data = {
            "price_change_percent": 2.5,
            "volume_trend": "increasing",
            "rsi": 55
        }
        
        fear_greed = sentiment_service.calculate_fear_greed_index(market_data)
        
        return {
            "success": True,
            "symbol": symbol,
            "fear_greed_index": fear_greed
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/technical/{symbol}")
async def get_technical_analysis(symbol: str):
    """Get technical analysis for a stock"""
    try:
        # Mock historical data
        mock_prices = [145, 147, 146, 148, 150, 151, 149, 152, 150, 153, 
                       152, 154, 156, 155, 157, 159, 158, 160, 162, 161]
        mock_volumes = [45000000, 47000000, 46000000, 48000000, 50000000,
                        51000000, 49000000, 52000000, 50000000, 53000000,
                        52000000, 54000000, 56000000, 55000000, 57000000,
                        59000000, 58000000, 60000000, 62000000, 61000000]
        
        analysis = technical_service.get_comprehensive_analysis(mock_prices, mock_volumes)
        
        return {
            "success": True,
            "symbol": symbol,
            "technical_analysis": analysis
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))