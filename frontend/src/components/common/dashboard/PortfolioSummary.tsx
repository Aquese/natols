import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from 'components/common/Card';
import Button from 'components/common/Button';
import { Portfolio } from 'types';
import { formatCurrency, formatPercent, getChangeColor } from 'utils/formatters';
import { TrendingUp, TrendingDown, Briefcase } from 'lucide-react';
interface PortfolioSummaryProps {
  portfolios: Portfolio[];
  loading?: boolean;
}

const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({ portfolios, loading }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <Card title="Portfolio Summary">
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </Card>
    );
  }

  if (!portfolios || portfolios.length === 0) {
    return (
      <Card title="Portfolio Summary">
        <div className="text-center py-8">
          <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No portfolios</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new portfolio.</p>
          <div className="mt-6">
            <Button onClick={() => navigate('/portfolio')}>
              Create Portfolio
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // Calculate totals
  const totalValue = portfolios.reduce((sum, p) => sum + p.total_value, 0);
  const totalCost = portfolios.reduce((sum, p) => sum + p.total_cost, 0);
  const totalGain = totalValue - totalCost;
  const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  return (
    <Card title="Portfolio Summary">
      <div className="space-y-6">
        {/* Overall stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Total Value</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {formatCurrency(totalValue)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Total Gain/Loss</p>
            <p className={`text-2xl font-bold mt-1 ${getChangeColor(totalGain)}`}>
              {formatCurrency(totalGain)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Return</p>
            <div className="flex items-center mt-1">
              {totalGain >= 0 ? (
                <TrendingUp className="h-5 w-5 text-success-600 mr-1" />
              ) : (
                <TrendingDown className="h-5 w-5 text-danger-600 mr-1" />
              )}
              <p className={`text-2xl font-bold ${getChangeColor(totalGainPercent)}`}>
                {formatPercent(totalGainPercent)}
              </p>
            </div>
          </div>
        </div>

        {/* Individual portfolios */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">Your Portfolios</h4>
          {portfolios.map((portfolio) => (
            <div
              key={portfolio.id}
              className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-primary-300 transition-colors cursor-pointer"
              onClick={() => navigate('/portfolio')}
            >
              <div>
                <h5 className="font-medium text-gray-900">{portfolio.name}</h5>
                <p className="text-sm text-gray-500">{portfolio.description}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">
                  {formatCurrency(portfolio.total_value)}
                </p>
                <p className={`text-sm ${getChangeColor(portfolio.gain_percent)}`}>
                  {formatPercent(portfolio.gain_percent)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <Button 
          variant="secondary" 
          fullWidth 
          onClick={() => navigate('/portfolio')}
        >
          View All Portfolios
        </Button>
      </div>
    </Card>
  );
};

export default PortfolioSummary;