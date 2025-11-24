# services/analysis-service/app/routes/analysis.py
from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List
import time
from datetime import datetime
import httpx

from app.models.request import AnalysisRequest, CompareRequest, PortfolioAnalysisRequest
from app.models.analysis import AnalysisResponse, AIAnalysis, TechnicalIndicators, SentimentAnalysis
from app.services.ollama_service import ollama_service
from app.services.technical_analysis import technical_service
from app.services.sentiment_service import sentiment_service
from app.config import settings

router = APIRouter()

async def fetch_stock_data(symbol: str):
    """Fetch comprehensive stock data from Alpha Vantage"""
    api_key = settings.ALPHA_VANTAGE_API_KEY
    if not api_key:
        raise HTTPException(status_code=500, detail="Alpha Vantage API key not configured")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Get quote data
            quote_url = f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={symbol}&apikey={api_key}"
            quote_response = await client.get(quote_url)
            quote_data = quote_response.json()
            
            if "Global Quote" not in quote_data or not quote_data["Global Quote"]:
                raise HTTPException(status_code=404, detail=f"Stock symbol {symbol} not found")
            
            quote = quote_data["Global Quote"]
            
            # Get company overview (fundamentals, dividends, etc.)
            overview_url = f"https://www.alphavantage.co/query?function=OVERVIEW&symbol={symbol}&apikey={api_key}"
            overview_response = await client.get(overview_url)
            overview_data = overview_response.json()
            
            # Get time series data for technical analysis
            ts_url = f"https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol={symbol}&outputsize=compact&apikey={api_key}"
            ts_response = await client.get(ts_url)
            ts_data = ts_response.json()
            
            prices = []
            volumes = []
            
            if "Time Series (Daily)" in ts_data:
                time_series = ts_data["Time Series (Daily)"]
                for date in sorted(time_series.keys())[-20:]:  # Last 20 days
                    day_data = time_series[date]
                    prices.append(float(day_data["4. close"]))
                    volumes.append(int(day_data["5. volume"]))
            
            # Helper function to safely convert to float
            def safe_float(value, default=0.0):
                if value == "None" or value is None or value == "":
                    return default
                try:
                    return float(value)
                except (ValueError, TypeError):
                    return default
            
            # Extract key metrics
            return {
                "symbol": symbol,
                "name": overview_data.get("Name", symbol),
                "exchange": overview_data.get("Exchange", "N/A"),
                "currency": overview_data.get("Currency", "USD"),
                "sector": overview_data.get("Sector", "N/A"),
                "industry": overview_data.get("Industry", "N/A"),
                
                # Price data
                "price": float(quote.get("05. price", 0)),
                "change_percent": float(quote.get("10. change percent", "0").rstrip('%')),
                "volume": int(quote.get("06. volume", 0)),
                "high": float(quote.get("03. high", 0)),
                "low": float(quote.get("04. low", 0)),
                "open": float(quote.get("02. open", 0)),
                "previous_close": float(quote.get("08. previous close", 0)),
                
                # Valuation metrics
                "market_cap": int(overview_data.get("MarketCapitalization", 0)),
                "pe_ratio": safe_float(overview_data.get("PERatio")),
                "peg_ratio": safe_float(overview_data.get("PEGRatio")),
                "price_to_book": safe_float(overview_data.get("PriceToBookRatio")),
                "price_to_sales": safe_float(overview_data.get("PriceToSalesRatioTTM")),
                "ev_to_revenue": safe_float(overview_data.get("EVToRevenue")),
                "ev_to_ebitda": safe_float(overview_data.get("EVToEBITDA")),
                
                # Dividend metrics
                "dividend_yield": safe_float(overview_data.get("DividendYield")),
                "dividend_per_share": safe_float(overview_data.get("DividendPerShare")),
                "ex_dividend_date": overview_data.get("ExDividendDate", "N/A"),
                "dividend_date": overview_data.get("DividendDate", "N/A"),
                "payout_ratio": safe_float(overview_data.get("PayoutRatio")),
                
                # Financial health
                "profit_margin": safe_float(overview_data.get("ProfitMargin")),
                "operating_margin": safe_float(overview_data.get("OperatingMarginTTM")),
                "return_on_equity": safe_float(overview_data.get("ReturnOnEquityTTM")),
                "return_on_assets": safe_float(overview_data.get("ReturnOnAssetsTTM")),
                "debt_to_equity": safe_float(overview_data.get("DebtToEquity")),
                "current_ratio": safe_float(overview_data.get("CurrentRatio")),
                "book_value": safe_float(overview_data.get("BookValue")),
                
                # Growth metrics
                "revenue_ttm": int(overview_data.get("RevenueTTM", 0)),
                "revenue_per_share": safe_float(overview_data.get("RevenuePerShareTTM")),
                "quarterly_earnings_growth": safe_float(overview_data.get("QuarterlyEarningsGrowthYOY")),
                "quarterly_revenue_growth": safe_float(overview_data.get("QuarterlyRevenueGrowthYOY")),
                "eps": safe_float(overview_data.get("EPS")),
                "diluted_eps": safe_float(overview_data.get("DilutedEPSTTM")),
                
                # Analyst targets
                "analyst_target_price": safe_float(overview_data.get("AnalystTargetPrice")),
                "52_week_high": safe_float(overview_data.get("52WeekHigh")),
                "52_week_low": safe_float(overview_data.get("52WeekLow")),
                "50_day_ma": safe_float(overview_data.get("50DayMovingAverage")),
                "200_day_ma": safe_float(overview_data.get("200DayMovingAverage")),
                
                # Additional metrics
                "shares_outstanding": int(overview_data.get("SharesOutstanding", 0)),
                "beta": safe_float(overview_data.get("Beta")),
                "forward_pe": safe_float(overview_data.get("ForwardPE")),
                
                # Description
                "description": overview_data.get("Description", ""),
                
                # Technical data
                "prices": prices,
                "volumes": volumes
            }
    except httpx.HTTPError as e:
        raise HTTPException(status_code=503, detail=f"Failed to fetch stock data: {str(e)}")

def calculate_investment_scores(stock_data, technical_indicators):
    """Calculate suitability scores for different investment strategies"""
    scores = {
        "dividend_investing": 0,
        "dividend_growth": 0,
        "day_trading": 0,
        "swing_trading": 0,
        "options_trading": 0,
        "long_term_growth": 0,
        "value_investing": 0
    }
    
    # Dividend Investing Score (0-100)
    if stock_data.get("dividend_yield", 0) > 0:
        scores["dividend_investing"] += min(stock_data["dividend_yield"] * 1000, 40)
        if stock_data.get("payout_ratio", 0) > 0 and stock_data["payout_ratio"] < 0.7:
            scores["dividend_investing"] += 20
        if stock_data.get("debt_to_equity", 100) < 1.0:
            scores["dividend_investing"] += 20
        if stock_data.get("profit_margin", 0) > 0.1:
            scores["dividend_investing"] += 20
    
    # Dividend Growth Score (0-100)
    if stock_data.get("dividend_yield", 0) > 0.01:
        scores["dividend_growth"] += 20
        if stock_data.get("quarterly_earnings_growth", 0) > 0:
            scores["dividend_growth"] += 30
        if stock_data.get("quarterly_revenue_growth", 0) > 0:
            scores["dividend_growth"] += 20
        if stock_data.get("payout_ratio", 0) < 0.6:
            scores["dividend_growth"] += 30
    
    # Day Trading Score (0-100)
    if technical_indicators:
        if technical_indicators.rsi:
            if 30 < technical_indicators.rsi < 70:
                scores["day_trading"] += 30
        if technical_indicators.volume_trend == "increasing":
            scores["day_trading"] += 30
    
    price_volatility = abs(stock_data.get("change_percent", 0))
    if price_volatility > 1:
        scores["day_trading"] += min(price_volatility * 10, 40)
    
    # Options Trading Score (0-100)
    if stock_data.get("beta", 0) > 1:
        scores["options_trading"] += 30
    if stock_data.get("volume", 0) > 1000000:
        scores["options_trading"] += 40
    if price_volatility > 2:
        scores["options_trading"] += 30
    
    # Long-term Growth Score (0-100)
    if stock_data.get("quarterly_revenue_growth", 0) > 0.1:
        scores["long_term_growth"] += 30
    if stock_data.get("quarterly_earnings_growth", 0) > 0.1:
        scores["long_term_growth"] += 30
    if stock_data.get("return_on_equity", 0) > 0.15:
        scores["long_term_growth"] += 20
    if stock_data.get("debt_to_equity", 100) < 1:
        scores["long_term_growth"] += 20
    
    # Value Investing Score (0-100)
    if stock_data.get("pe_ratio", 100) > 0 and stock_data["pe_ratio"] < 20:
        scores["value_investing"] += 30
    if stock_data.get("price_to_book", 100) < 2:
        scores["value_investing"] += 30
    if stock_data.get("price", 0) < stock_data.get("book_value", 0):
        scores["value_investing"] += 20
    if stock_data.get("dividend_yield", 0) > 0.02:
        scores["value_investing"] += 20
    
    return scores

@router.post("/generate", response_model=AnalysisResponse)
@router.post("/stock", response_model=AnalysisResponse)
async def analyze_stock(request: AnalysisRequest):
    """Analyze a single stock with AI-powered insights"""
    start_time = time.time()
    
    try:
        # Fetch comprehensive stock data
        stock_data = await fetch_stock_data(request.symbol)
        
        # Technical Analysis
        technical_indicators = None
        if request.include_technical and stock_data.get('prices'):
            tech_data = technical_service.get_comprehensive_analysis(
                stock_data['prices'], 
                stock_data['volumes']
            )
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
        
        # Calculate investment strategy scores
        investment_scores = calculate_investment_scores(stock_data, technical_indicators)
        
        # Build comprehensive prompt for AI - Pre-format all conditional values
        dividend_yield_str = f"{stock_data['dividend_yield']*100:.2f}%" if stock_data['dividend_yield'] else "No dividend"
        dividend_per_share_str = f"${stock_data['dividend_per_share']:.2f}" if stock_data['dividend_per_share'] else "N/A"
        payout_ratio_str = f"{stock_data['payout_ratio']*100:.1f}%" if stock_data['payout_ratio'] else "N/A"
        
        pe_ratio_str = f"{stock_data['pe_ratio']:.2f}" if stock_data['pe_ratio'] else "N/A"
        peg_ratio_str = f"{stock_data['peg_ratio']:.2f}" if stock_data['peg_ratio'] else "N/A"
        price_to_book_str = f"{stock_data['price_to_book']:.2f}" if stock_data['price_to_book'] else "N/A"
        price_to_sales_str = f"{stock_data['price_to_sales']:.2f}" if stock_data['price_to_sales'] else "N/A"
        
        profit_margin_str = f"{stock_data['profit_margin']*100:.1f}%" if stock_data['profit_margin'] else "N/A"
        roe_str = f"{stock_data['return_on_equity']*100:.1f}%" if stock_data['return_on_equity'] else "N/A"
        debt_to_equity_str = f"{stock_data['debt_to_equity']:.2f}" if stock_data['debt_to_equity'] else "N/A"
        current_ratio_str = f"{stock_data['current_ratio']:.2f}" if stock_data['current_ratio'] else "N/A"
        
        quarterly_revenue_growth_str = f"{stock_data['quarterly_revenue_growth']*100:.1f}%" if stock_data['quarterly_revenue_growth'] else "N/A"
        quarterly_earnings_growth_str = f"{stock_data['quarterly_earnings_growth']*100:.1f}%" if stock_data['quarterly_earnings_growth'] else "N/A"
        eps_str = f"${stock_data['eps']:.2f}" if stock_data['eps'] else "N/A"
        
        rsi_line = f"- RSI: {technical_indicators.rsi:.1f}" if technical_indicators and technical_indicators.rsi else ""
        volume_trend_line = f"- Volume Trend: {technical_indicators.volume_trend}" if technical_indicators else ""
        
        ma_50_str = f"${stock_data['50_day_ma']:.2f}" if stock_data['50_day_ma'] else "N/A"
        ma_200_str = f"${stock_data['200_day_ma']:.2f}" if stock_data['200_day_ma'] else "N/A"
        
        analyst_target_str = f"${stock_data['analyst_target_price']:.2f}" if stock_data['analyst_target_price'] else "N/A"
        
        ai_prompt = f"""Analyze {stock_data['name']} ({request.symbol}) comprehensively:

COMPANY INFO:
- Sector: {stock_data['sector']}
- Industry: {stock_data['industry']}
- Market Cap: ${stock_data['market_cap']:,}

CURRENT PRICE DATA:
- Price: ${stock_data['price']:.2f}
- Change: {stock_data['change_percent']:.2f}%
- 52-Week Range: ${stock_data['52_week_low']:.2f} - ${stock_data['52_week_high']:.2f}
- Volume: {stock_data['volume']:,}

VALUATION METRICS:
- P/E Ratio: {pe_ratio_str}
- PEG Ratio: {peg_ratio_str}
- Price/Book: {price_to_book_str}
- Price/Sales: {price_to_sales_str}

DIVIDEND INFORMATION:
- Dividend Yield: {dividend_yield_str}
- Dividend Per Share: {dividend_per_share_str}
- Payout Ratio: {payout_ratio_str}
- Ex-Dividend Date: {stock_data['ex_dividend_date']}

FINANCIAL HEALTH:
- Profit Margin: {profit_margin_str}
- ROE: {roe_str}
- Debt/Equity: {debt_to_equity_str}
- Current Ratio: {current_ratio_str}

GROWTH METRICS:
- Quarterly Revenue Growth: {quarterly_revenue_growth_str}
- Quarterly Earnings Growth: {quarterly_earnings_growth_str}
- EPS: {eps_str}

TECHNICAL INDICATORS:
{rsi_line}
{volume_trend_line}
- 50-Day MA: {ma_50_str}
- 200-Day MA: {ma_200_str}

ANALYST TARGET: {analyst_target_str}

Provide:
1. Clear BUY, HOLD, or SELL recommendation with reasoning
2. Key strengths and weaknesses
3. Price target and upside/downside potential
4. Risk factors to consider
5. Dividend sustainability assessment (if applicable)
6. Best suited for which type of investor (growth, value, dividend, day trader, etc.)"""

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
            ai_response = await ollama_service.generate(ai_prompt)
            
            # Parse AI response
            summary = ai_response
            
            # Extract recommendation (improved logic)
            recommendation = "Hold"
            ai_lower = ai_response.lower()
            
            if "strong buy" in ai_lower or "buy recommendation" in ai_lower:
                recommendation = "Strong Buy"
            elif "buy" in ai_lower and "don't buy" not in ai_lower and "not a buy" not in ai_lower:
                recommendation = "Buy"
            elif "sell" in ai_lower and "don't sell" not in ai_lower:
                if "strong sell" in ai_lower:
                    recommendation = "Strong Sell"
                else:
                    recommendation = "Sell"
            
            # Calculate confidence based on multiple factors
            confidence_score = 0.5
            if technical_indicators and technical_indicators.rsi:
                if 30 <= technical_indicators.rsi <= 70:
                    confidence_score += 0.2
            if stock_data.get("pe_ratio", 0) > 0 and stock_data["pe_ratio"] < 30:
                confidence_score += 0.1
            if stock_data.get("debt_to_equity", 100) < 1:
                confidence_score += 0.1
            if stock_data.get("profit_margin", 0) > 0.1:
                confidence_score += 0.1
            
            confidence_score = min(confidence_score, 1.0)
            
            # Build comprehensive key points
            key_points = [
                f"Current price: ${stock_data['price']:.2f} ({stock_data['change_percent']:+.2f}%)",
                f"Market Cap: ${stock_data['market_cap']/1e9:.1f}B",
                f"P/E Ratio: {stock_data['pe_ratio']:.1f}" if stock_data.get('pe_ratio') else "P/E: N/A",
            ]
            
            if stock_data.get('dividend_yield', 0) > 0:
                key_points.append(f"Dividend Yield: {stock_data['dividend_yield']*100:.2f}%")
            
            if stock_data.get('quarterly_revenue_growth'):
                key_points.append(f"Revenue Growth: {stock_data['quarterly_revenue_growth']*100:.1f}% YoY")
            
            if technical_indicators and technical_indicators.rsi:
                rsi_signal = "Oversold" if technical_indicators.rsi < 30 else "Overbought" if technical_indicators.rsi > 70 else "Neutral"
                key_points.append(f"RSI: {technical_indicators.rsi:.1f} ({rsi_signal})")
            
            if stock_data.get('analyst_target_price'):
                upside = ((stock_data['analyst_target_price'] / stock_data['price']) - 1) * 100
                key_points.append(f"Analyst Target: ${stock_data['analyst_target_price']:.2f} ({upside:+.1f}% upside)")
            
            # Extract risks
            risks = []
            if stock_data.get('debt_to_equity', 0) > 2:
                risks.append(f"High debt-to-equity ratio: {stock_data['debt_to_equity']:.1f}")
            if stock_data.get('payout_ratio', 0) > 0.8:
                risks.append(f"High payout ratio may limit dividend growth: {stock_data['payout_ratio']*100:.0f}%")
            if technical_indicators and technical_indicators.rsi and technical_indicators.rsi > 70:
                risks.append("Stock appears overbought based on RSI")
            if stock_data['price'] > stock_data.get('52_week_high', float('inf')) * 0.95:
                risks.append("Trading near 52-week high")
            if "risk" in ai_lower or "concern" in ai_lower:
                risks.append("AI identified risks - see full analysis")
            
            # Extract opportunities
            opportunities = []
            if stock_data.get('quarterly_revenue_growth', 0) > 0.15:
                opportunities.append(f"Strong revenue growth: {stock_data['quarterly_revenue_growth']*100:.1f}% YoY")
            if stock_data.get('dividend_yield', 0) > 0.03 and stock_data.get('payout_ratio', 1) < 0.6:
                opportunities.append("Sustainable dividend with room for growth")
            if technical_indicators and technical_indicators.rsi and technical_indicators.rsi < 30:
                opportunities.append("Stock appears oversold - potential buying opportunity")
            if stock_data.get('pe_ratio', 100) < stock_data.get('peg_ratio', 0) and stock_data.get('peg_ratio', 0) > 0:
                opportunities.append("Attractive valuation relative to growth")
            if stock_data['price'] < stock_data.get('analyst_target_price', 0):
                opportunities.append(f"Trading below analyst target by {((stock_data.get('analyst_target_price', 0) / stock_data['price']) - 1) * 100:.1f}%")
        
        # Add investment strategy suitability to key points
        best_strategy = max(investment_scores, key=investment_scores.get)
        best_score = investment_scores[best_strategy]
        
        strategy_names = {
            "dividend_investing": "Dividend Income",
            "dividend_growth": "Dividend Growth",
            "day_trading": "Day Trading",
            "swing_trading": "Swing Trading",
            "options_trading": "Options Trading",
            "long_term_growth": "Long-term Growth",
            "value_investing": "Value Investing"
        }
        
        if best_score > 50:
            key_points.append(f"Best suited for: {strategy_names[best_strategy]} (Score: {best_score}/100)")
        
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
        
    except HTTPException:
        raise
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
        stocks_data = {}
        for symbol in request.symbols:
            stocks_data[symbol] = {
                "price": 150.00,
                "market_cap": 2400000000000,
                "pe_ratio": 25.5,
                "revenue_growth": 15.2,
                "profit_margin": 21.5
            }
        
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