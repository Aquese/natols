// src/pages/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { useAuthStore } from 'store/authStore';
import { portfolioService } from 'services/portfolioService';
import { Portfolio } from 'types';
import Card from '../components/common/Card';
import Loading from '../components/common/Loading';
import PortfolioSummary from '../components/common/dashboard/PortfolioSummary';
import StockSearch from '../components/common/dashboard/StockSearch';
import { Activity, TrendingUp, Users } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPortfolios();
  }, []);

  const loadPortfolios = async () => {
    try {
      const data = await portfolioService.getPortfolios();
      setPortfolios(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load portfolios');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.username}
          </h1>
          <p className="text-gray-600 mt-2">
            Here's what's happening with your investments today.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Portfolios</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {portfolios.length}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">AI Analysis</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">Enabled</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Account Status</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">Active</p>
              </div>
              <div className="bg-gray-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            <PortfolioSummary portfolios={portfolios} />
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <StockSearch />

            {/* Recent Activity placeholder */}
            <Card title="Recent Activity">
              <div className="text-center py-8">
                <Activity className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  No recent activity
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Search for stocks or analyze your portfolio to get started
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;