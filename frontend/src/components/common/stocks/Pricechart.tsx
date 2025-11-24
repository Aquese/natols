import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface PriceData {
  date: string;
  price: number;
  volume?: number;
}

interface PricechartProps {
  data: PriceData[];
  symbol?: string;
}

const Pricechart: React.FC<PricechartProps> = ({ data, symbol }) => {
  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">No price data available</p>
      </div>
    );
  }

  // Format data for Recharts
  const chartData = data.map(item => ({
    date: format(new Date(item.date), 'MMM dd'),
    price: item.price,
    volume: item.volume || 0,
  }));

  // Calculate price range for better Y-axis scaling
  const prices = data.map(d => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;
  const yAxisMin = minPrice - (priceRange * 0.1);
  const yAxisMax = maxPrice + (priceRange * 0.1);

  // Determine if overall trend is positive or negative
  const firstPrice = data[0]?.price || 0;
  const lastPrice = data[data.length - 1]?.price || 0;
  const isPositive = lastPrice >= firstPrice;
  const lineColor = isPositive ? '#10b981' : '#ef4444'; // green or red

  return (
    <div className="w-full h-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {symbol ? `${symbol} ` : ''}Price History
        </h3>
        <p className="text-sm text-gray-600">
          {data.length} day{data.length !== 1 ? 's' : ''} of data
        </p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            tick={{ fill: '#6b7280' }}
          />
          <YAxis
            domain={[yAxisMin, yAxisMax]}
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            tick={{ fill: '#6b7280' }}
            tickFormatter={(value) => `$${value.toFixed(2)}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '8px',
            }}
            formatter={(value: any) => [`$${value.toFixed(2)}`, 'Price']}
            labelStyle={{ color: '#374151', fontWeight: 'bold' }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '10px' }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke={lineColor}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
            name="Price"
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-600">First Price</p>
          <p className="text-lg font-semibold text-gray-900">
            ${firstPrice.toFixed(2)}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-600">Last Price</p>
          <p className="text-lg font-semibold text-gray-900">
            ${lastPrice.toFixed(2)}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-600">Change</p>
          <p className={`text-lg font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? '+' : ''}${(lastPrice - firstPrice).toFixed(2)}
            <span className="text-sm ml-1">
              ({((lastPrice - firstPrice) / firstPrice * 100).toFixed(2)}%)
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Pricechart;