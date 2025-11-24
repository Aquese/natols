// src/services/portfolioService.ts
import api from './api';
import { Portfolio, Holding, CreatePortfolioRequest, AddHoldingRequest } from 'types';

export const portfolioService = {
  /**
   * Get all portfolios for current user
   */
  getPortfolios: async (): Promise<Portfolio[]> => {
    const response = await api.get<Portfolio[]>('/api/v1/portfolios');
    return response.data;
  },

  /**
   * Get single portfolio by ID
   */
  getPortfolio: async (id: number): Promise<Portfolio> => {
    const response = await api.get<Portfolio>(`/api/v1/portfolios/${id}`);
    return response.data;
  },

  /**
   * Create new portfolio
   */
  createPortfolio: async (data: CreatePortfolioRequest): Promise<{ id: number; message: string }> => {
    const response = await api.post('/api/v1/portfolios', data);
    return response.data;
  },

  /**
   * Get all holdings for a portfolio
   */
  getHoldings: async (portfolioId: number): Promise<Holding[]> => {
    const response = await api.get<Holding[]>(`/api/v1/portfolios/${portfolioId}/holdings`);
    return response.data;
  },

  /**
   * Add holding to portfolio
   */
  addHolding: async (portfolioId: number, data: AddHoldingRequest): Promise<{ status: string }> => {
    const response = await api.post(`/api/v1/portfolios/${portfolioId}/holdings`, data);
    return response.data;
  },

  /**
   * Delete portfolio
   */
  deletePortfolio: async (id: number): Promise<void> => {
    await api.delete(`/api/v1/portfolios/${id}`);
  },
};