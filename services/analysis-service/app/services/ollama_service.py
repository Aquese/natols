# services/analysis-service/app/services/ollama_service.py
import httpx
import json
from typing import Optional, Dict, Any
from app.config import settings

class OllamaService:
    def __init__(self):
        self.base_url = settings.OLLAMA_URL
        self.model = settings.OLLAMA_MODEL
        
    async def generate(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """Generate text using Ollama"""
        url = f"{self.base_url}/api/generate"
        
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False
        }
        
        if system_prompt:
            payload["system"] = system_prompt
        
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                result = response.json()
                return result.get("response", "")
        except Exception as e:
            raise Exception(f"Ollama generation failed: {str(e)}")
    
    async def analyze_stock(self, symbol: str, data: Dict[str, Any]) -> str:
        """Analyze stock using Ollama"""
        system_prompt = """You are a professional financial analyst with expertise in stock market analysis.
Provide clear, concise, and actionable insights based on the data provided.
Focus on key metrics, trends, and potential risks/opportunities."""
        
        prompt = f"""Analyze the following stock: {symbol}

Current Data:
- Price: ${data.get('price', 'N/A')}
- Change: {data.get('change_percent', 'N/A')}%
- Volume: {data.get('volume', 'N/A')}
- Market Cap: ${data.get('market_cap', 'N/A')}

Technical Indicators:
{json.dumps(data.get('technical_indicators', {}), indent=2)}

Please provide:
1. Overall assessment (2-3 sentences)
2. Key strengths (bullet points)
3. Key risks (bullet points)
4. Recommendation (Buy/Hold/Sell with reasoning)

Keep your response concise and actionable."""
        
        return await self.generate(prompt, system_prompt)
    
    async def compare_stocks(self, stocks_data: Dict[str, Any]) -> str:
        """Compare multiple stocks"""
        system_prompt = """You are a financial analyst comparing investment opportunities.
Provide objective comparisons focusing on key metrics and relative strengths."""
        
        prompt = f"""Compare the following stocks:

{json.dumps(stocks_data, indent=2)}

Provide:
1. Comparative analysis of key metrics
2. Best choice for growth potential
3. Best choice for value investing
4. Risk assessment for each
5. Final recommendation

Be concise and data-driven."""
        
        return await self.generate(prompt, system_prompt)
    
    async def portfolio_analysis(self, portfolio_data: Dict[str, Any]) -> str:
        """Analyze entire portfolio"""
        system_prompt = """You are a portfolio management advisor.
Analyze portfolio composition, diversification, and provide rebalancing recommendations."""
        
        prompt = f"""Analyze this investment portfolio:

{json.dumps(portfolio_data, indent=2)}

Provide:
1. Portfolio health assessment
2. Diversification analysis
3. Risk assessment
4. Rebalancing recommendations
5. Potential improvements

Be specific and actionable."""
        
        return await self.generate(prompt, system_prompt)
    
    async def sentiment_analysis(self, symbol: str, news_data: str) -> Dict[str, Any]:
        """Analyze sentiment from news/social media"""
        system_prompt = """You are a sentiment analysis expert for financial markets.
Analyze the sentiment and provide a clear classification."""
        
        prompt = f"""Analyze the sentiment for {symbol} based on this news:

{news_data}

Respond in JSON format:
{{
    "sentiment": "positive/negative/neutral",
    "confidence": 0.0-1.0,
    "summary": "Brief summary of overall sentiment",
    "key_themes": ["theme1", "theme2"]
}}"""
        
        response = await self.generate(prompt, system_prompt)
        
        try:
            # Try to parse as JSON
            return json.loads(response)
        except json.JSONDecodeError:
            # If not valid JSON, return basic structure
            return {
                "sentiment": "neutral",
                "confidence": 0.5,
                "summary": response[:200],
                "key_themes": []
            }

# Singleton instance
ollama_service = OllamaService()