# services/analysis-service/app/utils/helpers.py
from typing import Any, Dict, List, Optional
import json
from datetime import datetime, timedelta
import hashlib

def generate_cache_key(prefix: str, params: Dict) -> str:
    """Generate a cache key from parameters"""
    params_str = json.dumps(params, sort_keys=True)
    hash_obj = hashlib.md5(params_str.encode())
    return f"{prefix}:{hash_obj.hexdigest()}"

def format_large_number(number: float) -> str:
    """Format large numbers with K, M, B suffixes"""
    if number >= 1_000_000_000:
        return f"${number/1_000_000_000:.2f}B"
    elif number >= 1_000_000:
        return f"${number/1_000_000:.2f}M"
    elif number >= 1_000:
        return f"${number/1_000:.2f}K"
    else:
        return f"${number:.2f}"

def calculate_percentage_change(old_value: float, new_value: float) -> float:
    """Calculate percentage change between two values"""
    if old_value == 0:
        return 0.0
    return ((new_value - old_value) / old_value) * 100

def parse_date_range(period: str) -> tuple:
    """Parse period string to date range"""
    end_date = datetime.now()
    
    period_map = {
        "1d": timedelta(days=1),
        "1w": timedelta(weeks=1),
        "1m": timedelta(days=30),
        "3m": timedelta(days=90),
        "6m": timedelta(days=180),
        "1y": timedelta(days=365),
        "5y": timedelta(days=1825)
    }
    
    delta = period_map.get(period.lower(), timedelta(days=30))
    start_date = end_date - delta
    
    return start_date, end_date

def clean_text(text: str) -> str:
    """Clean and normalize text"""
    # Remove extra whitespace
    text = " ".join(text.split())
    # Remove special characters
    text = text.replace("\n", " ").replace("\r", " ")
    return text.strip()

def extract_json_from_text(text: str) -> Optional[Dict]:
    """Try to extract JSON from text response"""
    try:
        # Try direct parsing
        return json.loads(text)
    except json.JSONDecodeError:
        # Try to find JSON in text
        start = text.find("{")
        end = text.rfind("}") + 1
        if start != -1 and end != 0:
            try:
                return json.loads(text[start:end])
            except json.JSONDecodeError:
                pass
    return None

def validate_symbol(symbol: str) -> bool:
    """Validate stock symbol format"""
    if not symbol:
        return False
    # Basic validation: 1-5 uppercase letters
    return len(symbol) <= 5 and symbol.isalpha() and symbol.isupper()

def calculate_sharpe_ratio(returns: List[float], risk_free_rate: float = 0.02) -> float:
    """Calculate Sharpe ratio"""
    if not returns or len(returns) < 2:
        return 0.0
    
    import numpy as np
    returns_array = np.array(returns)
    excess_returns = returns_array - (risk_free_rate / 252)  # Daily risk-free rate
    
    if np.std(excess_returns) == 0:
        return 0.0
    
    return np.mean(excess_returns) / np.std(excess_returns) * np.sqrt(252)

def format_percentage(value: float, decimals: int = 2) -> str:
    """Format value as percentage"""
    return f"{value:.{decimals}f}%"

def truncate_text(text: str, max_length: int = 100, suffix: str = "...") -> str:
    """Truncate text to maximum length"""
    if len(text) <= max_length:
        return text
    return text[:max_length - len(suffix)] + suffix

def merge_dicts(*dicts: Dict) -> Dict:
    """Merge multiple dictionaries"""
    result = {}
    for d in dicts:
        result.update(d)
    return result

def safe_divide(numerator: float, denominator: float, default: float = 0.0) -> float:
    """Safely divide two numbers"""
    try:
        if denominator == 0:
            return default
        return numerator / denominator
    except (TypeError, ZeroDivisionError):
        return default