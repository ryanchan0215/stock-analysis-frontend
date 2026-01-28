import React from 'react';
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
  ReferenceLine,
} from 'recharts';
import { MACD, BollingerBands, Signal } from '../services/api';

interface CandleData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  macd?: number;
  signal?: number;
  histogram?: number;
}

interface AdvancedChartProps {
  symbol: string;
  data: CandleData[];
  ma50?: number;
  ma200?: number;
  macd?: MACD | null;
  bollingerBands?: BollingerBands | null;
  signals?: Signal[];
}

const AdvancedChart: React.FC<AdvancedChartProps> = ({
  symbol,
  data,
  ma50,
  ma200,
  macd,
  bollingerBands,
  signals = [],
}) => {
  // ✅ 過濾無效數據（處理港股停牌/缺失數據）
  const validData = React.useMemo(() => {
    const filtered = data.filter(d => {
      const isValid = 
        d &&
        d.date &&
        typeof d.open === 'number' && 
        typeof d.high === 'number' && 
        typeof d.low === 'number' && 
        typeof d.close === 'number' &&
        typeof d.volume === 'number' &&
        !isNaN(d.open) && 
        !isNaN(d.high) && 
        !isNaN(d.low) && 
        !isNaN(d.close) &&
        !isNaN(d.volume) &&
        d.high >= d.low &&
        d.close <= d.high &&
        d.close >= d.low &&
        d.open <= d.high &&
        d.open >= d.low;
      
      return isValid;
    });
    
    return filtered;
  }, [data]);

  // ✅ K 線蠟燭組件
  const CustomCandlestick = (props: any) => {
    const { x, y, width, height, payload } = props;
    
    if (!payload || typeof x !== 'number' || typeof y !== 'number' || 
        typeof width !== 'number' || typeof height !== 'number') {
      return null;
    }

    const { open, high, low, close } = payload;
    
    if (typeof open !== 'number' || typeof high !== 'number' || 
        typeof low !== 'number' || typeof close !== 'number' ||
        isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) {
      return null;
    }

    const priceRange = high - low;
    if (priceRange < 0 || high < low) {
      return null;
    }

    const isUp = close >= open;
    const color = isUp ? '#10b981' : '#ef4444';
    
    if (priceRange === 0 || Math.abs(priceRange) < 0.001) {
      return (
        <line
          x1={x}
          y1={y + height / 2}
          x2={x + width}
          y2={y + height / 2}
          stroke={color}
          strokeWidth={2}
        />
      );
    }

    const highY = y;
    const lowY = y + height;
    const bodyHeight = Math.abs(((close - open) / priceRange) * height);
    const bodyY = isUp ? lowY - bodyHeight : highY;

    if (isNaN(highY) || isNaN(lowY) || isNaN(bodyHeight) || isNaN(bodyY)) {
      return null;
    }

    return (
      <g>
        <line
          x1={x + width / 2}
          y1={highY}
          x2={x + width / 2}
          y2={lowY}
          stroke={color}
          strokeWidth={1}
        />
        <rect
          x={x}
          y={bodyY}
          width={width}
          height={Math.max(bodyHeight, 1)}
          fill={color}
          stroke={color}
        />
      </g>
    );
  };

  // ✅ MACD Histogram 自定義組件
  const CustomMACDBar = (props: any) => {
    const { x, y, width, height, payload } = props;
    
    if (!payload || 
        typeof payload.histogram !== 'number' || 
        isNaN(payload.histogram) ||
        typeof x !== 'number' || 
        typeof y !== 'number' || 
        typeof width !== 'number' || 
        typeof height !== 'number' ||
        isNaN(x) || isNaN(y) || isNaN(width) || isNaN(height)) {
      return null;
    }
    
    const histogram = payload.histogram;
    const isPositive = histogram >= 0;
    const color = isPositive ? '#10b981' : '#ef4444';
    
    const barHeight = Math.abs(height);
    const barY = height < 0 ? y + height : y;
    const finalHeight = Math.max(barHeight, 1);
    
    return (
      <rect
        x={x}
        y={barY}
        width={width}
        height={finalHeight}
        fill={color}
        opacity={0.6}
      />
    );
  };

  // ✅ Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      if (!data || typeof data.close !== 'number') {
        return null;
      }
      
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
            開: ${data.open.toFixed(2)} | 高: ${data.high.toFixed(2)} | 低: ${data.low.toFixed(2)}
          </p>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '4px' }}>
            成交量: {(data.volume / 1000000).toFixed(2)}M
          </p>
          {typeof data.macd === 'number' && data.macd !== 0 && (
            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                MACD: {data.macd.toFixed(2)} | Signal: {data.signal?.toFixed(2) || 'N/A'}
              </p>
              <p style={{ fontSize: '0.875rem', color: data.histogram > 0 ? '#10b981' : '#ef4444' }}>
                Histogram: {data.histogram?.toFixed(2) || 'N/A'}
              </p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // ✅ 檢查是否有有效數據
  if (!validData || validData.length === 0) {
    return (
      <div style={{ 
        width: '100%', 
        padding: '3rem', 
        textAlign: 'center',
        backgroundColor: '#fef3c7',
        border: '2px solid #f59e0b',
        borderRadius: '8px',
        marginTop: '2rem'
      }}>
        <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⚠️</p>
        <p style={{ fontSize: '1.125rem', fontWeight: '600', color: '#92400e', marginBottom: '0.5rem' }}>
          無有效 K 線數據
        </p>
        <p style={{ fontSize: '0.875rem', color: '#78350f' }}>
          {symbol} 可能停牌、數據缺失或格式錯誤（原始數據: {data.length} 條）
        </p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', marginTop: '2rem' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        📈 {symbol} K 線圖
        <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 'normal' }}>
          ({validData.length} 個交易日
          {signals.length > 0 && `, ${signals.length} 個信號`})
        </span>
      </h2>

      {/* 買賣信號提示 */}
     
      
      {/* K 線圖 + 布林通道 */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1.5rem', marginBottom: '1rem' }}>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={validData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const parts = value.split('/');
                return parts.length >= 3 ? `${parts[1]}/${parts[2]}` : value;
              }}
            />
            <YAxis
              domain={['dataMin - 5', 'dataMax + 5']}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `$${value.toFixed(0)}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {bollingerBands && (
              <>
                <Line
                  type="monotone"
                  dataKey={() => bollingerBands.upper}
                  stroke="#ef4444"
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={false}
                  name="布林上軌"
                />
                <Line
                  type="monotone"
                  dataKey={() => bollingerBands.middle}
                  stroke="#6b7280"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  dot={false}
                  name="布林中軌"
                />
                <Line
                  type="monotone"
                  dataKey={() => bollingerBands.lower}
                  stroke="#10b981"
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={false}
                  name="布林下軌"
                />
              </>
            )}
            
            <Bar
              dataKey="high"
              fill="transparent"
              shape={<CustomCandlestick />}
              name="K線"
            />
            
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

      {/* MACD 圖表 */}
      {macd && (() => {
        const macdData = validData.filter(d => 
          typeof d.macd === 'number' && 
          typeof d.signal === 'number' &&
          !isNaN(d.macd) &&
          !isNaN(d.signal) &&
          (d.macd !== 0 || d.signal !== 0)
        );
        
        if (macdData.length < 10) {
          return (
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '8px', 
              padding: '1.5rem', 
              marginBottom: '1rem' 
            }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
                📊 MACD 指標
              </h3>
              <div style={{ 
                padding: '2rem', 
                textAlign: 'center', 
                backgroundColor: '#fef3c7',
                borderRadius: '8px',
                border: '1px solid #fbbf24'
              }}>
                <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>⚠️</p>
                <p style={{ fontWeight: '600', color: '#92400e', marginBottom: '0.5rem' }}>
                  MACD 數據不足
                </p>
                <p style={{ fontSize: '0.875rem', color: '#78350f' }}>
                  有效數據: {macdData.length} / {validData.length}<br/>
                  需要至少 35 天歷史數據才能計算完整 MACD
                </p>
              </div>
            </div>
          );
        }
        
        return (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1.5rem', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
              📊 MACD 指標
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart 
                data={macdData}
                margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    const parts = value.split('/');
                    return parts.length >= 3 ? `${parts[1]}/${parts[2]}` : value;
                  }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  domain={['auto', 'auto']}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                
                <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="3 3" />
                
                <Bar
                  dataKey="histogram"
                  shape={<CustomMACDBar />}
                  name="Histogram"
                />
                
                <Line
                  type="monotone"
                  dataKey="macd"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  name="MACD"
                />
                
                <Line
                  type="monotone"
                  dataKey="signal"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                  name="Signal"
                />
              </ComposedChart>
            </ResponsiveContainer>
            
            <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#6b7280', flexWrap: 'wrap' }}>
              <span>MACD: <strong>{macd.macd.toFixed(2)}</strong></span>
              <span>Signal: <strong>{macd.signal.toFixed(2)}</strong></span>
              <span>Histogram: <strong style={{ color: macd.histogram > 0 ? '#10b981' : '#ef4444' }}>{macd.histogram.toFixed(2)}</strong></span>
              <span style={{ marginLeft: 'auto', color: '#9ca3af' }}>
                ({macdData.length} 個有效數據點)
              </span>
            </div>
          </div>
        );
      })()}

      {/* 成交量圖 */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
          📊 成交量
        </h3>
        <ResponsiveContainer width="100%" height={150}>
          <ComposedChart data={validData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const parts = value.split('/');
                return parts.length >= 3 ? `${parts[1]}/${parts[2]}` : value;
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

export default AdvancedChart;