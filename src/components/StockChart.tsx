import React, { useState, useEffect } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface CandleData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface StockChartProps {
  symbol: string;
  data: CandleData[];
  ma50?: number;
  ma200?: number;
}

const StockChart: React.FC<StockChartProps> = ({ symbol, data, ma50, ma200 }) => {
  // 自定義 K 線蠟燭圖
  const CustomCandlestick = (props: any) => {
    const { x, y, width, height, payload } = props;
    
    if (!payload) return null;

    const isUp = payload.close >= payload.open;
    const color = isUp ? '#10b981' : '#ef4444'; // 綠漲紅跌
    
    const highY = y;
    const lowY = y + height;
    const bodyHeight = Math.abs(
      ((payload.close - payload.open) / (payload.high - payload.low)) * height
    );
    const bodyY = isUp ? y + height - bodyHeight : y;

    return (
      <g>
        {/* 上下影線 */}
        <line
          x1={x + width / 2}
          y1={highY}
          x2={x + width / 2}
          y2={lowY}
          stroke={color}
          strokeWidth={1}
        />
        {/* K 線實體 */}
        <rect
          x={x}
          y={bodyY}
          width={width}
          height={bodyHeight || 1}
          fill={color}
          stroke={color}
        />
      </g>
    );
  };

  // 自定義 Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isUp = data.close >= data.open;
      
      return (
        <div
          style={{
            backgroundColor: 'white',
            padding: '12px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>{data.date}</p>
          <p style={{ color: isUp ? '#10b981' : '#ef4444', fontWeight: '600' }}>
            收: ${data.close.toFixed(2)}
          </p>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            開: ${data.open.toFixed(2)}
          </p>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            高: ${data.high.toFixed(2)}
          </p>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            低: ${data.low.toFixed(2)}
          </p>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '4px' }}>
            成交量: {(data.volume / 1000000).toFixed(2)}M
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', marginTop: '2rem' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        📈 {symbol} K 線圖
      </h2>
      
      {/* K 線圖 */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1.5rem', marginBottom: '1rem' }}>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const parts = value.split('/');
                return `${parts[1]}/${parts[2]}`; // 只顯示月/日
              }}
            />
            <YAxis
              domain={['dataMin - 5', 'dataMax + 5']}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `$${value.toFixed(0)}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {/* K 線蠟燭 */}
            <Bar
              dataKey="high"
              fill="transparent"
              shape={<CustomCandlestick />}
              name="K線"
            />
            
            {/* MA50 */}
            {ma50 && (
              <Line
                type="monotone"
                dataKey={() => ma50}
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
                name="MA50"
              />
            )}
            
            {/* MA200 */}
            {ma200 && (
              <Line
                type="monotone"
                dataKey={() => ma200}
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={false}
                name="MA200"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* 成交量圖 */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
          📊 成交量
        </h3>
        <ResponsiveContainer width="100%" height={150}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const parts = value.split('/');
                return `${parts[1]}/${parts[2]}`;
              }}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
            />
            <Tooltip
              formatter={(value: number) => [(value / 1000000).toFixed(2) + 'M', '成交量']}
            />
            <Bar
              dataKey="volume"
              fill="#3b82f6"
              opacity={0.6}
              name="成交量"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StockChart;