// src/services/analysisService.ts
import api from './api';
import { AnalysisRequest, AnalysisResponse } from 'types';

export const analysisService = {
  /**
   * Analyze stock with AI
   */
  analyzeStock: async (request: AnalysisRequest): Promise<AnalysisResponse> => {
    const response = await api.post<AnalysisResponse>('/analysis/generate', request);
    return response.data;
  },

  /**
   * Get sentiment analysis for a stock
   */
  getSentiment: async (symbol: string): Promise<any> => {
    const response = await api.get(`/analysis/sentiment/${symbol}`);
    return response.data;
  },

  /**
   * Get technical analysis for a stock
   */
  getTechnicalAnalysis: async (symbol: string): Promise<any> => {
    const response = await api.post(`/analysis/technical/${symbol}`);
    return response.data;
  },

  /**
   * Compare multiple stocks
   */
  compareStocks: async (symbols: string[], criteria: string[]): Promise<any> => {
    const response = await api.post('/analysis/compare', {
      symbols,
      criteria,
    });
    return response.data;
  },

  /**
   * Get Fear & Greed Index for a stock
   */
  getFearGreedIndex: async (symbol: string): Promise<any> => {
    const response = await api.get(`/analysis/fear-greed/${symbol}`);
    return response.data;
  },
};