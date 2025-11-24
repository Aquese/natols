// src/pages/Analysis.tsx
import React, { useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Loading from '../components/common/Loading';
import { analysisService } from '../services/analysisService';
import { AnalysisResponse } from '../types';
import { TrendingUp, TrendingDown, AlertCircle, BarChart3 } from 'lucide-react';
import { formatCurrency, formatPercent } from '../utils/formatters';

const Analysis: React.FC = () => {
  const [symbol, setSymbol] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState('');

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!symbol.trim()) {
      setError('Please enter a stock symbol');
      return;
    }

    setLoading(true);
    setError('');
    setAnalysis(null);

    try {
      const result = await analysisService.analyzeStock({
        symbol: symbol.toUpperCase()
      });
      setAnalysis(result);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to analyze stock');
    } finally {
      setLoading(false);
    }
  };

  const analysisData = analysis?.data;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AI Stock Analysis</h1>
          <p className="text-gray-600 mt-2">
            Get AI-powered insights on stocks and ETFs using Ollama
          </p>
        </div>

        {/* Search Form */}
        <Card className="mb-8">
          <form onSubmit={handleAnalyze} className="flex gap-4">
            <div className="flex-1">
              <Input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="Enter stock symbol (e.g., AAPL, TSLA, SPY)"
                disabled={loading}
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Analyzing...' : 'Analyze'}
            </Button>
          </form>
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
              <p className="text-red-700">{error}</p>
            </div>
          )}
        </Card>

        {/* Loading State */}
        {loading && (
          <Card>
            <div className="text-center py-12">
              <Loading size="lg" text="Running AI analysis..." />
              <p className="text-sm text-gray-500 mt-4">
                This may take a few moments as we gather data and run the analysis
              </p>
            </div>
          </Card>
        )}

        {/* Analysis Results */}
        {analysisData && !loading && (
          <div className="space-y-6">
            {/* Stock Info Card */}
            <Card>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{analysisData.stock_symbol}</h2>
                  <p className="text-gray-600 mt-1">{analysisData.analysis_type}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    analysisData.recommendation === 'BUY' ? 'bg-green-100 text-green-800' :
                    analysisData.recommendation === 'SELL' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {analysisData.recommendation}
                  </span>
                </div>
              </div>
            </Card>

            {/* AI Analysis Card */}
            <Card title="AI Analysis">
              <div className="prose max-w-none">
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                  <div className="flex items-start">
                    <BarChart3 className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-blue-900">AI-Powered Insight</h4>
                      <p className="text-sm text-blue-800 mt-1">
                        Analysis generated using Ollama local AI model
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        Confidence Score: {(analysisData.confidence_score * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Summary</h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {analysisData.summary}
                  </p>
                </div>

                {/* Key Points */}
                {analysisData.key_points && analysisData.key_points.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Key Points</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {analysisData.key_points.map((point, index) => (
                        <li key={index} className="text-gray-700">{point}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Opportunities */}
                {analysisData.opportunities && analysisData.opportunities.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-green-900 mb-2">Opportunities</h3>
                    <ul className="space-y-2">
                      {analysisData.opportunities.map((opp, index) => (
                        <li key={index} className="flex items-start">
                          <TrendingUp className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{opp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Card>

            {/* Risk Factors */}
            {analysisData.risks && analysisData.risks.length > 0 && (
              <Card title="Risk Factors">
                <ul className="space-y-2">
                  {analysisData.risks.map((risk, index) => (
                    <li key={index} className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{risk}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Technical Indicators */}
            {analysisData.technical_indicators && (
              <Card title="Technical Indicators">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {analysisData.technical_indicators.rsi && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600">RSI</p>
                      <p className="text-lg font-semibold text-gray-900">{analysisData.technical_indicators.rsi.toFixed(2)}</p>
                    </div>
                  )}
                  {analysisData.technical_indicators.volume_trend && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600">Volume Trend</p>
                      <p className="text-sm font-semibold text-gray-900">{analysisData.technical_indicators.volume_trend}</p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Sentiment */}
            {analysisData.sentiment && (
              <Card title="Market Sentiment">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Overall Sentiment</span>
                    <span className={`font-semibold ${
                      analysisData.sentiment.overall_sentiment === 'positive' ? 'text-green-600' :
                      analysisData.sentiment.overall_sentiment === 'negative' ? 'text-red-600' :
                      'text-yellow-600'
                    }`}>
                      {analysisData.sentiment.overall_sentiment.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{analysisData.sentiment.summary}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Confidence: {(analysisData.sentiment.confidence * 100).toFixed(0)}%
                  </p>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Empty State */}
        {!analysisData && !loading && (
          <Card>
            <div className="text-center py-12">
              <BarChart3 className="mx-auto h-16 w-16 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No analysis yet</h3>
              <p className="mt-2 text-sm text-gray-600">
                Enter a stock symbol above to get started with AI-powered analysis
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Analysis;