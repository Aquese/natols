# services/analysis-service/app/services/sentiment_service.py
import httpx
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from app.config import settings

class SentimentService:
    """Service for analyzing market sentiment from news and social media"""
    
    def __init__(self):
        self.news_api_key = settings.NEWS_API_KEY
        self.news_api_url = "https://newsapi.org/v2/everything"
    
    async def fetch_news(self, symbol: str, company_name: Optional[str] = None, days: int = 7) -> List[Dict]:
        """Fetch news articles for a stock"""
        if not self.news_api_key:
            return []
        
        from_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
        
        # Build search query
        query = f"{symbol}"
        if company_name:
            query = f"{company_name} OR {symbol}"
        
        params = {
            "q": query,
            "from": from_date,
            "sortBy": "relevancy",
            "language": "en",
            "apiKey": self.news_api_key
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(self.news_api_url, params=params)
                response.raise_for_status()
                data = response.json()
                return data.get("articles", [])[:10]  # Limit to 10 articles
        except Exception as e:
            print(f"Error fetching news: {str(e)}")
            return []
    
    def analyze_text_sentiment(self, text: str) -> Dict[str, any]:
        """Simple rule-based sentiment analysis"""
        positive_words = [
            'growth', 'profit', 'gain', 'success', 'strong', 'bullish', 
            'upgrade', 'beat', 'outperform', 'positive', 'surge', 'rally',
            'breakthrough', 'innovation', 'record', 'high', 'boom', 'rise'
        ]
        
        negative_words = [
            'loss', 'decline', 'fall', 'weak', 'bearish', 'downgrade',
            'miss', 'underperform', 'negative', 'crash', 'drop', 'concern',
            'risk', 'warning', 'low', 'crisis', 'debt', 'struggle'
        ]
        
        text_lower = text.lower()
        
        positive_count = sum(1 for word in positive_words if word in text_lower)
        negative_count = sum(1 for word in negative_words if word in text_lower)
        
        total = positive_count + negative_count
        
        if total == 0:
            return {
                'sentiment': 'neutral',
                'score': 0.0,
                'positive_count': 0,
                'negative_count': 0
            }
        
        sentiment_score = (positive_count - negative_count) / total
        
        if sentiment_score > 0.2:
            sentiment = 'positive'
        elif sentiment_score < -0.2:
            sentiment = 'negative'
        else:
            sentiment = 'neutral'
        
        return {
            'sentiment': sentiment,
            'score': sentiment_score,
            'positive_count': positive_count,
            'negative_count': negative_count
        }
    
    async def analyze_news_sentiment(self, symbol: str, company_name: Optional[str] = None) -> Dict:
        """Analyze sentiment from news articles"""
        articles = await self.fetch_news(symbol, company_name)
        
        if not articles:
            return {
                'overall_sentiment': 'neutral',
                'confidence': 0.0,
                'article_count': 0,
                'sources': [],
                'summary': 'No recent news available for analysis'
            }
        
        sentiments = []
        sources = []
        positive_count = 0
        negative_count = 0
        neutral_count = 0
        
        for article in articles:
            title = article.get('title', '')
            description = article.get('description', '')
            content = f"{title} {description}"
            
            sentiment_result = self.analyze_text_sentiment(content)
            sentiments.append(sentiment_result)
            
            source = article.get('source', {}).get('name', 'Unknown')
            if source not in sources:
                sources.append(source)
            
            if sentiment_result['sentiment'] == 'positive':
                positive_count += 1
            elif sentiment_result['sentiment'] == 'negative':
                negative_count += 1
            else:
                neutral_count += 1
        
        # Calculate overall sentiment
        total_articles = len(articles)
        if positive_count > negative_count and positive_count > neutral_count:
            overall_sentiment = 'positive'
            confidence = positive_count / total_articles
        elif negative_count > positive_count and negative_count > neutral_count:
            overall_sentiment = 'negative'
            confidence = negative_count / total_articles
        else:
            overall_sentiment = 'neutral'
            confidence = neutral_count / total_articles
        
        # Generate summary
        summary = f"Analyzed {total_articles} articles. "
        summary += f"{positive_count} positive, {negative_count} negative, {neutral_count} neutral. "
        summary += f"Overall sentiment is {overall_sentiment}."
        
        return {
            'overall_sentiment': overall_sentiment,
            'confidence': round(confidence, 2),
            'article_count': total_articles,
            'positive_count': positive_count,
            'negative_count': negative_count,
            'neutral_count': neutral_count,
            'sources': sources[:5],  # Top 5 sources
            'summary': summary,
            'recent_headlines': [
                {
                    'title': article.get('title', ''),
                    'source': article.get('source', {}).get('name', 'Unknown'),
                    'url': article.get('url', ''),
                    'published_at': article.get('publishedAt', '')
                }
                for article in articles[:5]  # Top 5 headlines
            ]
        }
    
    def calculate_fear_greed_index(self, market_data: Dict) -> Dict:
        """Calculate a simplified Fear & Greed Index"""
        # This is a simplified version - production would use more sophisticated metrics
        
        score = 50  # Neutral starting point
        
        # Price momentum (±20 points)
        if 'price_change_percent' in market_data:
            change = market_data['price_change_percent']
            score += min(20, max(-20, change * 2))
        
        # Volume (±15 points)
        if 'volume_trend' in market_data:
            if market_data['volume_trend'] == 'increasing':
                score += 10
            elif market_data['volume_trend'] == 'decreasing':
                score -= 10
        
        # RSI (±15 points)
        if 'rsi' in market_data:
            rsi = market_data['rsi']
            if rsi > 70:
                score += 15  # Overbought = Greed
            elif rsi < 30:
                score -= 15  # Oversold = Fear
        
        # Ensure score is between 0 and 100
        score = max(0, min(100, score))
        
        # Determine sentiment
        if score >= 75:
            sentiment = "Extreme Greed"
        elif score >= 60:
            sentiment = "Greed"
        elif score >= 45:
            sentiment = "Neutral"
        elif score >= 25:
            sentiment = "Fear"
        else:
            sentiment = "Extreme Fear"
        
        return {
            'score': round(score, 1),
            'sentiment': sentiment,
            'interpretation': self._get_fear_greed_interpretation(score)
        }
    
    def _get_fear_greed_interpretation(self, score: float) -> str:
        """Get interpretation of fear/greed score"""
        if score >= 75:
            return "Market showing extreme greed. Consider taking profits or being cautious with new positions."
        elif score >= 60:
            return "Market is greedy. Good time to review positions and consider risk management."
        elif score >= 45:
            return "Market sentiment is neutral. Look for opportunities based on fundamentals."
        elif score >= 25:
            return "Market shows fear. Could be buying opportunity for quality stocks."
        else:
            return "Extreme fear in the market. Historically good time for long-term investors to buy."

sentiment_service = SentimentService()