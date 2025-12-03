// src/services/portfolioService.ts
import api from './api';
import { Portfolio, Holding, CreatePortfolioRequest, AddHoldingRequest } from '../types';

export const portfolioService = {
  /**
   * Get all portfolios for current user
   */
  getPortfolios: async (): Promise<Portfolio[]> => {
    const response = await api.get<Portfolio[]>('/portfolios');
    return response.data;
  },

  /**
   * Get single portfolio by ID
   */
  getPortfolio: async (id: string): Promise<Portfolio> => {
    const response = await api.get<Portfolio>(`/portfolios/${id}`);
    return response.data;
  },

  /**
   * Create new portfolio
   */
  createPortfolio: async (data: CreatePortfolioRequest): Promise<{ id: string; message: string }> => {
    const response = await api.post('/portfolios', data);
    return response.data;
  },

  /**
   * Get all holdings for a portfolio
   */
  getHoldings: async (portfolioId: string): Promise<Holding[]> => {
    const response = await api.get<Holding[]>(`/portfolios/${portfolioId}/holdings`);
    return response.data;
  },

  /**
   * Add holding to portfolio
   */
  addHolding: async (portfolioId: string, data: AddHoldingRequest): Promise<{ status: string }> => {
    const response = await api.post(`/portfolios/${portfolioId}/holdings`, data);
    return response.data;
  },

  /**
   * Delete portfolio
   */
  deletePortfolio: async (id: string): Promise<void> => {
    await api.delete(`/portfolios/${id}`);
  },

  /**
   * Delete holding from portfolio
   */
  deleteHolding: async (portfolioId: string, holdingId: string): Promise<void> => {
    await api.delete(`/portfolios/${portfolioId}/holdings/${holdingId}`);
  },
};