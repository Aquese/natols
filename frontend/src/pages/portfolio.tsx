// src/pages/Portfolio.tsx
import React, { useEffect, useState } from 'react';
import { portfolioService } from '../services/portfolioService';
import { Portfolio, Holding, CreatePortfolioRequest, AddHoldingRequest } from '../types';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Loading from '../components/common/Loading';
import { formatCurrency, formatPercent, getChangeColor } from '../utils/formatters';
import { Plus, Briefcase, TrendingUp, TrendingDown, Trash2 } from 'lucide-react';

const PortfolioPage: React.FC = () => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddHoldingModal, setShowAddHoldingModal] = useState(false);

  // Form states
  const [portfolioName, setPortfolioName] = useState('');
  const [portfolioDescription, setPortfolioDescription] = useState('');
  const [holdingSymbol, setHoldingSymbol] = useState('');
  const [holdingQuantity, setHoldingQuantity] = useState('');
  const [holdingPrice, setHoldingPrice] = useState('');

  useEffect(() => {
    loadPortfolios();
  }, []);

  useEffect(() => {
    if (selectedPortfolio) {
      loadHoldings(selectedPortfolio.id);
    }
  }, [selectedPortfolio]);

  const loadPortfolios = async () => {
    try {
      const data = await portfolioService.getPortfolios();
      setPortfolios(data);
      if (data.length > 0 && !selectedPortfolio) {
        setSelectedPortfolio(data[0]);
      }
    } catch (err) {
      console.error('Failed to load portfolios', err);
    } finally {
      setLoading(false);
    }
  };

  const loadHoldings = async (portfolioId: string) => {
    try {
      const data = await portfolioService.getHoldings(portfolioId);
      setHoldings(data);
    } catch (err) {
      console.error('Failed to load holdings', err);
    }
  };

  const handleCreatePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const request: CreatePortfolioRequest = {
      name: portfolioName,
      description: portfolioDescription,
    };

    try {
      await portfolioService.createPortfolio(request);
      setShowCreateModal(false);
      setPortfolioName('');
      setPortfolioDescription('');
      loadPortfolios();
    } catch (err) {
      console.error('Failed to create portfolio', err);
    }
  };

  const handleAddHolding = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPortfolio) return;

    const request: AddHoldingRequest = {
      symbol: holdingSymbol.toUpperCase(),
      quantity: parseFloat(holdingQuantity),
      price: parseFloat(holdingPrice),
    };

    try {
      await portfolioService.addHolding(selectedPortfolio.id, request);
      setShowAddHoldingModal(false);
      setHoldingSymbol('');
      setHoldingQuantity('');
      setHoldingPrice('');
      loadHoldings(selectedPortfolio.id);
      loadPortfolios();
    } catch (err) {
      console.error('Failed to add holding', err);
    }
  };

  const handleDeleteHolding = async (holdingId: string) => {
    if (!selectedPortfolio) return;
    
    if (!window.confirm('Are you sure you want to delete this holding?')) {
      return;
    }

    try {
      await portfolioService.deleteHolding(selectedPortfolio.id, holdingId);
      loadHoldings(selectedPortfolio.id);
      loadPortfolios();
    } catch (err) {
      console.error('Failed to delete holding', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading size="lg" text="Loading portfolios..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Portfolios</h1>
            <p className="text-gray-600 mt-2">Manage your investment portfolios</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Portfolio
          </Button>
        </div>

        {portfolios.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Briefcase className="mx-auto h-16 w-16 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No portfolios yet</h3>
              <p className="mt-2 text-sm text-gray-600">
                Get started by creating your first portfolio
              </p>
              <div className="mt-6">
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Portfolio
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Portfolio List */}
            <div className="lg:col-span-1">
              <Card title="Your Portfolios">
                <div className="space-y-2">
                  {portfolios.map((portfolio) => (
                    <button
                      key={portfolio.id}
                      onClick={() => setSelectedPortfolio(portfolio)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedPortfolio?.id === portfolio.id
                          ? 'bg-primary-50 border-2 border-primary-500'
                          : 'bg-white border border-gray-200 hover:border-primary-300'
                      }`}
                    >
                      <h4 className="font-medium text-gray-900">{portfolio.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatCurrency(portfolio.total_value)}
                      </p>
                      <p className={`text-xs mt-1 ${getChangeColor(portfolio.gain_percent)}`}>
                        {formatPercent(portfolio.gain_percent)}
                      </p>
                    </button>
                  ))}
                </div>
              </Card>
            </div>

            {/* Portfolio Details */}
            <div className="lg:col-span-3 space-y-6">
              {selectedPortfolio && (
                <>
                  {/* Portfolio Summary */}
                  <Card>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          {selectedPortfolio.name}
                        </h2>
                        <p className="text-gray-600 mt-1">{selectedPortfolio.description}</p>
                      </div>
                      <Button onClick={() => setShowAddHoldingModal(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Holding
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">Total Value</p>
                        <p className="text-xl font-bold text-gray-900 mt-1">
                          {formatCurrency(selectedPortfolio.total_value)}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">Total Cost</p>
                        <p className="text-xl font-bold text-gray-900 mt-1">
                          {formatCurrency(selectedPortfolio.total_cost)}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">Total Gain/Loss</p>
                        <p className={`text-xl font-bold mt-1 ${getChangeColor(selectedPortfolio.total_gain)}`}>
                          {formatCurrency(selectedPortfolio.total_gain)}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">Return</p>
                        <div className="flex items-center mt-1">
                          {selectedPortfolio.gain_percent >= 0 ? (
                            <TrendingUp className="h-5 w-5 text-success-600 mr-1" />
                          ) : (
                            <TrendingDown className="h-5 w-5 text-danger-600 mr-1" />
                          )}
                          <p className={`text-xl font-bold ${getChangeColor(selectedPortfolio.gain_percent)}`}>
                            {formatPercent(selectedPortfolio.gain_percent)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Holdings Table */}
                  <Card title="Holdings">
                    {holdings.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-600">No holdings yet</p>
                        <Button
                          variant="secondary"
                          className="mt-4"
                          onClick={() => setShowAddHoldingModal(true)}
                        >
                          Add First Holding
                        </Button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Price</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Current Price</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Market Value</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Gain/Loss</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Return</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {holdings.map((holding) => (
                              <tr key={holding.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="font-medium text-gray-900">{holding.symbol}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900">
                                  {holding.quantity}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900">
                                  {formatCurrency(holding.average_cost)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900">
                                  {formatCurrency(holding.current_price)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900">
                                  {formatCurrency(holding.market_value)}
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-right font-medium ${getChangeColor(holding.gain)}`}>
                                  {formatCurrency(holding.gain)}
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-right font-medium ${getChangeColor(holding.gain_percent)}`}>
                                  {formatPercent(holding.gain_percent)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                  <button
                                    onClick={() => handleDeleteHolding(holding.id)}
                                    className="text-red-600 hover:text-red-800 transition-colors"
                                    title="Delete holding"
                                  >
                                    <Trash2 className="h-5 w-5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Card>
                </>
              )}
            </div>
          </div>
        )}

        {/* Create Portfolio Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Portfolio</h3>
              <form onSubmit={handleCreatePortfolio} className="space-y-4">
                <Input
                  label="Portfolio Name"
                  value={portfolioName}
                  onChange={(e) => setPortfolioName(e.target.value)}
                  placeholder="My Investment Portfolio"
                  required
                />
                <Input
                  label="Description"
                  value={portfolioDescription}
                  onChange={(e) => setPortfolioDescription(e.target.value)}
                  placeholder="Long-term growth stocks"
                />
                <div className="flex space-x-3">
                  <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Holding Modal */}
        {showAddHoldingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Holding</h3>
              <form onSubmit={handleAddHolding} className="space-y-4">
                <Input
                  label="Stock Symbol"
                  value={holdingSymbol}
                  onChange={(e) => setHoldingSymbol(e.target.value)}
                  placeholder="AAPL"
                  required
                />
                <Input
                  label="Quantity"
                  type="number"
                  step="0.01"
                  value={holdingQuantity}
                  onChange={(e) => setHoldingQuantity(e.target.value)}
                  placeholder="10"
                  required
                />
                <Input
                  label="Purchase Price"
                  type="number"
                  step="0.01"
                  value={holdingPrice}
                  onChange={(e) => setHoldingPrice(e.target.value)}
                  placeholder="150.00"
                  required
                />
                <div className="flex space-x-3">
                  <Button type="button" variant="secondary" onClick={() => setShowAddHoldingModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Holding</Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioPage;