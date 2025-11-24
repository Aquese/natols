// src/pages/Analysis.tsx
import React, { useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Loading from '../components/common/Loading';
import { analysisService } from '../services/analysisService';
import { AnalysisResponse } from '../types';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  BarChart3, 
  DollarSign,
  Activity,
  Shield,
  Target,
  Award,
  Info
} from 'lucide-react';
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

  const getRecommendationColor = (rec: string) => {
    const r = rec.toLowerCase();
    if (r.includes('strong buy')) return 'bg-green-600 text-white';
    if (r.includes('buy')) return 'bg-green-500 text-white';
    if (r.includes('strong sell')) return 'bg-red-600 text-white';
    if (r.includes('sell')) return 'bg-red-500 text-white';
    return 'bg-yellow-500 text-white';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-blue-600 rounded-xl">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Stock Analysis</h1>
              <p className="text-gray-600 mt-1">
                Get AI-powered insights using Ollama local AI model
              </p>
            </div>
          </div>
        </div>

        {/* Search Form */}
        <Card className="mb-8 shadow-lg">
          <form onSubmit={handleAnalyze} className="flex gap-4">
            <div className="flex-1">
              <Input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="Enter stock symbol (e.g., AAPL, TSLA, MSFT)"
                disabled={loading}
                className="text-lg"
              />
            </div>
            <Button 
              type="submit" 
              disabled={loading}
              className="px-8 py-3 text-lg font-semibold"
            >
              {loading ? 'Analyzing...' : 'Analyze'}
            </Button>
          </form>
          {error && (
            <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
              <p className="text-red-700">{error}</p>
            </div>
          )}
        </Card>

        {/* Loading State */}
        {loading && (
          <Card className="shadow-lg">
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
                <Activity className="h-10 w-10 text-blue-600 animate-pulse" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Running AI Analysis...</h3>
              <p className="text-gray-600 mb-4">
                Fetching real-time data and generating insights
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <p className="text-xs text-gray-400 mt-4">This may take 1-2 minutes</p>
            </div>
          </Card>
        )}

        {/* Analysis Results */}
        {analysisData && !loading && (
          <div className="space-y-6">
            {/* Header Card with Recommendation */}
            <Card className="shadow-lg border-l-4 border-blue-600">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-3xl font-bold text-gray-900">{analysisData.stock_symbol}</h2>
                    <span className={`px-4 py-2 rounded-lg text-sm font-bold shadow-md ${getRecommendationColor(analysisData.recommendation)}`}>
                      {analysisData.recommendation}
                    </span>
                  </div>
                  <p className="text-gray-600 capitalize">{analysisData.analysis_type} Analysis</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
                  <Award className="h-5 w-5 text-blue-600" />
                  <div className="text-right">
                    <div className="text-xs text-gray-600">Confidence</div>
                    <div className="text-lg font-bold text-blue-600">
                      {(analysisData.confidence_score * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {analysisData.key_points.slice(0, 6).map((point, index) => (
                <Card key={index} className="shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Info className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 font-medium">{point}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* AI Analysis Card */}
            <Card className="shadow-lg">
              <div className="border-l-4 border-blue-500 pl-4 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <h3 className="text-xl font-bold text-gray-900">AI-Powered Analysis</h3>
                </div>
                <p className="text-sm text-blue-700 font-medium">
                  Generated using Ollama local AI model • Confidence: {(analysisData.confidence_score * 100).toFixed(0)}%
                </p>
              </div>

              <div className="prose max-w-none">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Summary</h4>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {analysisData.summary}
                  </p>
                </div>
              </div>
            </Card>

            {/* Opportunities */}
            {analysisData.opportunities && analysisData.opportunities.length > 0 && (
              <Card className="shadow-lg border-l-4 border-green-500">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-green-900">Opportunities</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysisData.opportunities.map((opp, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{opp}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Risk Factors */}
            {analysisData.risks && analysisData.risks.length > 0 && (
              <Card className="shadow-lg border-l-4 border-yellow-500">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Shield className="h-5 w-5 text-yellow-600" />
                  </div>
                  <h3 className="text-xl font-bold text-yellow-900">Risk Factors</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysisData.risks.map((risk, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{risk}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Technical Indicators */}
            {analysisData.technical_indicators && (
              <Card className="shadow-lg border-l-4 border-purple-500">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Activity className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold text-purple-900">Technical Indicators</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {analysisData.technical_indicators.rsi && (
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                      <p className="text-xs text-purple-700 font-semibold mb-1">RSI</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {analysisData.technical_indicators.rsi.toFixed(2)}
                      </p>
                      <p className="text-xs text-purple-600 mt-1">
                        {analysisData.technical_indicators.rsi < 30 ? 'Oversold' : 
                         analysisData.technical_indicators.rsi > 70 ? 'Overbought' : 'Neutral'}
                      </p>
                    </div>
                  )}
                  {analysisData.technical_indicators.volume_trend && (
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                      <p className="text-xs text-blue-700 font-semibold mb-1">Volume Trend</p>
                      <p className="text-lg font-bold text-blue-900 capitalize">
                        {analysisData.technical_indicators.volume_trend}
                      </p>
                    </div>
                  )}
                  {analysisData.technical_indicators.moving_averages && (
                    <>
                      {analysisData.technical_indicators.moving_averages.sma_20 && (
                        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4">
                          <p className="text-xs text-indigo-700 font-semibold mb-1">SMA (20)</p>
                          <p className="text-lg font-bold text-indigo-900">
                            ${analysisData.technical_indicators.moving_averages.sma_20.toFixed(2)}
                          </p>
                        </div>
                      )}
                      {analysisData.technical_indicators.moving_averages.ema_12 && (
                        <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-4">
                          <p className="text-xs text-pink-700 font-semibold mb-1">EMA (12)</p>
                          <p className="text-lg font-bold text-pink-900">
                            ${analysisData.technical_indicators.moving_averages.ema_12.toFixed(2)}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </Card>
            )}

            {/* Sentiment */}
            {analysisData.sentiment && (
              <Card className="shadow-lg border-l-4 border-indigo-500">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Target className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-bold text-indigo-900">Market Sentiment</h3>
                </div>
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">Overall Sentiment</span>
                    <span className={`px-4 py-1 rounded-full font-bold text-sm ${
                      analysisData.sentiment.overall_sentiment === 'positive' ? 'bg-green-200 text-green-800' :
                      analysisData.sentiment.overall_sentiment === 'negative' ? 'bg-red-200 text-red-800' :
                      'bg-yellow-200 text-yellow-800'
                    }`}>
                      {analysisData.sentiment.overall_sentiment.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{analysisData.sentiment.summary}</p>
                  <p className="text-xs text-gray-500">
                    Confidence: {(analysisData.sentiment.confidence * 100).toFixed(0)}%
                  </p>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Empty State */}
        {!analysisData && !loading && (
          <Card className="shadow-lg">
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mb-6">
                <BarChart3 className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Ready to Analyze</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Enter a stock symbol above to get comprehensive AI-powered analysis with real-time data, 
                technical indicators, and investment insights.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Analysis;