// src/components/stocks/StockCard.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Stock } from 'types';
import { formatCurrency, formatPercent, formatLargeNumber, getChangeColor, getChangeBgColor } from 'utils/formatters';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StockCardProps {
  stock: Stock;
}

const StockCard: React.FC<StockCardProps> = ({ stock }) => {
  const navigate = useNavigate();

  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:border-primary-300 hover:shadow-md transition-all cursor-pointer"
      onClick={() => navigate(`/stock/${stock.symbol}`)}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{stock.symbol}</h3>
          <p className="text-sm text-gray-600 mt-1">{stock.name}</p>
        </div>
        <div className={`px-2 py-1 rounded-md text-xs font-medium ${getChangeBgColor(stock.change_percent)}`}>
          {stock.change_percent >= 0 ? '+' : ''}{stock.change_percent.toFixed(2)}%
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold text-gray-900">
            {formatCurrency(stock.last_price)}
          </span>
          <div className="flex items-center">
            {stock.change >= 0 ? (
              <TrendingUp className="h-4 w-4 text-success-600 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 text-danger-600 mr-1" />
            )}
            <span className={`text-sm font-medium ${getChangeColor(stock.change)}`}>
              {formatCurrency(Math.abs(stock.change))}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Volume</p>
            <p className="font-medium text-gray-900 mt-1">
              {stock.volume.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Market Cap</p>
            <p className="font-medium text-gray-900 mt-1">
              {formatLargeNumber(stock.market_cap)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockCard;