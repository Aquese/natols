# services/analysis-service/app/services/technical_analysis.py
import numpy as np
from typing import List, Dict, Optional
from datetime import datetime, timedelta

class TechnicalAnalysisService:
    
    @staticmethod
    def calculate_rsi(prices: List[float], period: int = 14) -> Optional[float]:
        """Calculate Relative Strength Index"""
        if len(prices) < period + 1:
            return None
        
        deltas = np.diff(prices)
        gains = np.where(deltas > 0, deltas, 0)
        losses = np.where(deltas < 0, -deltas, 0)
        
        avg_gain = np.mean(gains[:period])
        avg_loss = np.mean(losses[:period])
        
        if avg_loss == 0:
            return 100.0
        
        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))
        
        return float(rsi)
    
    @staticmethod
    def calculate_moving_averages(prices: List[float]) -> Dict[str, float]:
        """Calculate various moving averages"""
        result = {}
        
        if len(prices) >= 20:
            result['sma_20'] = float(np.mean(prices[-20:]))
        if len(prices) >= 50:
            result['sma_50'] = float(np.mean(prices[-50:]))
        if len(prices) >= 200:
            result['sma_200'] = float(np.mean(prices[-200:]))
        
        # Calculate EMA (Exponential Moving Average)
        if len(prices) >= 12:
            result['ema_12'] = TechnicalAnalysisService._calculate_ema(prices, 12)
        if len(prices) >= 26:
            result['ema_26'] = TechnicalAnalysisService._calculate_ema(prices, 26)
        
        return result
    
    @staticmethod
    def _calculate_ema(prices: List[float], period: int) -> float:
        """Calculate Exponential Moving Average"""
        multiplier = 2 / (period + 1)
        ema = prices[0]
        
        for price in prices[1:]:
            ema = (price * multiplier) + (ema * (1 - multiplier))
        
        return float(ema)
    
    @staticmethod
    def calculate_macd(prices: List[float]) -> Optional[Dict[str, float]]:
        """Calculate MACD (Moving Average Convergence Divergence)"""
        if len(prices) < 26:
            return None
        
        ema_12 = TechnicalAnalysisService._calculate_ema(prices, 12)
        ema_26 = TechnicalAnalysisService._calculate_ema(prices, 26)
        
        macd_line = ema_12 - ema_26
        
        # Signal line (9-day EMA of MACD)
        # Simplified calculation
        signal_line = macd_line * 0.9
        
        return {
            'macd': float(macd_line),
            'signal': float(signal_line),
            'histogram': float(macd_line - signal_line)
        }
    
    @staticmethod
    def calculate_bollinger_bands(prices: List[float], period: int = 20) -> Optional[Dict[str, float]]:
        """Calculate Bollinger Bands"""
        if len(prices) < period:
            return None
        
        sma = np.mean(prices[-period:])
        std = np.std(prices[-period:])
        
        return {
            'upper': float(sma + (2 * std)),
            'middle': float(sma),
            'lower': float(sma - (2 * std))
        }
    
    @staticmethod
    def analyze_volume_trend(volumes: List[int]) -> str:
        """Analyze volume trend"""
        if len(volumes) < 10:
            return "insufficient_data"
        
        recent_avg = np.mean(volumes[-5:])
        older_avg = np.mean(volumes[-10:-5])
        
        if recent_avg > older_avg * 1.2:
            return "increasing"
        elif recent_avg < older_avg * 0.8:
            return "decreasing"
        else:
            return "stable"
    
    @staticmethod
    def get_comprehensive_analysis(prices: List[float], volumes: List[int]) -> Dict:
        """Get all technical indicators"""
        return {
            'rsi': TechnicalAnalysisService.calculate_rsi(prices),
            'moving_averages': TechnicalAnalysisService.calculate_moving_averages(prices),
            'macd': TechnicalAnalysisService.calculate_macd(prices),
            'bollinger_bands': TechnicalAnalysisService.calculate_bollinger_bands(prices),
            'volume_trend': TechnicalAnalysisService.analyze_volume_trend(volumes)
        }

technical_service = TechnicalAnalysisService()