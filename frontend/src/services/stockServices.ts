// src/services/stockService.ts
import api from './api';
import { Stock, StockPrice } from 'types';

export const stockService = {
  /**
   * Search stocks by symbol or name
   */
  searchStocks: async (query: string): Promise<Stock[]> => {
    const response = await api.get<Stock[]>(`/api/v1/stocks?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  /**
   * Get stock details by symbol
   */
  getStock: async (symbol: string): Promise<Stock> => {
    const response = await api.get<Stock>(`/api/v1/stocks/${symbol}`);
    return response.data;
  },

  /**
   * Get historical stock prices
   */
  getStockPrices: async (
    symbol: string,
    startDate?: string,
    endDate?: string
  ): Promise<StockPrice[]> => {
    let url = `/api/v1/stocks/${symbol}/prices`;
    const params = new URLSearchParams();
    
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await api.get<StockPrice[]>(url);
    return response.data;
  },

  /**
   * Update stock data (admin/background task)
   */
  updateStock: async (stockData: Partial<Stock>): Promise<{ status: string }> => {
    const response = await api.put(`/api/v1/stocks/${stockData.symbol}`, stockData);
    return response.data;
  },
};