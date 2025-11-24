// ============================================
// User & Auth Types
// ============================================
export interface User {
  id: string;
  username: string;
  created_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ============================================
// Stock Types
// ============================================
export interface Stock {
  symbol: string;
  name: string;
  last_price: number;
  change: number;
  change_percent: number;
  volume: number;
  market_cap: number;
  updated_at: string;
}

export interface StockPrice {
  id: number;
  symbol: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ============================================
// Portfolio Types
// ============================================
export interface Portfolio {
  id: number;
  user_id: number;
  name: string;
  description: string;
  total_value: number;
  total_cost: number;
  total_gain: number;
  gain_percent: number;
}

export interface Holding {
  id: number;
  portfolio_id: number;
  symbol: string;
  quantity: number;
  avg_price: number;
  total_cost: number;
  current_price: number;
  market_value: number;
  gain: number;
  gain_percent: number;
}

export interface CreatePortfolioRequest {
  name: string;
  description: string;
}

export interface AddHoldingRequest {
  symbol: string;
  quantity: number;
  price: number;
}

// ============================================
// Analysis Types
// ============================================
export interface TechnicalIndicators {
  rsi?: number;
  macd?: {
    macd: number;
    signal: number;
    histogram: number;
  };
  moving_averages?: {
    sma_20?: number;
    sma_50?: number;
    sma_200?: number;
    ema_12?: number;
    ema_26?: number;
  };
  bollinger_bands?: {
    upper: number;
    middle: number;
    lower: number;
  };
  volume_trend?: string;
}

export interface SentimentAnalysis {
  overall_sentiment: string;
  confidence: number;
  sources: string[];
  summary: string;
}

export interface AIAnalysis {
  stock_symbol: string;
  analysis_type: string;
  summary: string;
  recommendation: string;
  confidence_score: number;
  key_points: string[];
  risks: string[];
  opportunities: string[];
  technical_indicators?: TechnicalIndicators;
  sentiment?: SentimentAnalysis;
  timestamp: string;
}

export interface AnalysisRequest {
  symbol: string;
  analysis_type?: string;
  include_technical?: boolean;
  include_sentiment?: boolean;
  custom_prompt?: string;
}

export interface AnalysisResponse {
  success: boolean;
  data?: AIAnalysis;
  error?: string;
  processing_time: number;
}

export interface AnalysisResult {
  symbol: string;
  company_name: string;
  current_price: number;
  price_change: number;
  price_change_percent: number;
  market_cap?: number;
  pe_ratio?: number;
  week_52_high?: number;
  week_52_low?: number;
  ai_analysis: string;
  recommendation?: 'BUY' | 'SELL' | 'HOLD';
  confidence_score?: number;
  risk_factors?: string[];
  analyzed_at: string;
}

// ============================================
// API Response Types
// ============================================
export interface ApiError {
  message: string;
  status: number;
}