// src/components/dashboard/StockSearch.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from 'components/common/Card';
import Input from 'components/common/Input';
import Button from 'components/common/Button';
import { stockService } from 'services/stockServices';
import { Stock } from 'types';
import { formatCurrency, formatPercent, getChangeColor } from 'utils/formatters';
import { Search, TrendingUp } from 'lucide-react';

const StockSearch: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      setError('Please enter a stock symbol or name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const stocks = await stockService.searchStocks(query);
      setResults(stocks);
      
      if (stocks.length === 0) {
        setError('No stocks found matching your search');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to search stocks');
    } finally {
      setLoading(false);
    }
  };

  const handleStockClick = (symbol: string) => {
    navigate(`/stock/${symbol}`);
    setQuery('');
    setResults([]);
  };

  return (
    <Card title="Search Stocks" subtitle="Search for stocks by symbol or company name">
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="flex space-x-2">
          <div className="flex-1">
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter stock symbol (e.g., AAPL, TSLA)"
              icon={<Search className="h-4 w-4 text-gray-400" />}
              error={error}
            />
          </div>
          <Button type="submit" loading={loading}>
            Search
          </Button>
        </div>
      </form>

      {/* Search Results */}
      {results.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Search Results</h4>
          <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
            {results.map((stock) => (
              <div
                key={stock.symbol}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleStockClick(stock.symbol)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center">
                      <h5 className="font-medium text-gray-900">{stock.symbol}</h5>
                      <span className="ml-2 text-sm text-gray-500">{stock.name}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Volume: {stock.volume.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {formatCurrency(stock.last_price)}
                    </p>
                    <div className="flex items-center justify-end mt-1">
                      <TrendingUp className={`h-4 w-4 mr-1 ${getChangeColor(stock.change_percent)}`} />
                      <p className={`text-sm ${getChangeColor(stock.change_percent)}`}>
                        {formatPercent(stock.change_percent)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default StockSearch;