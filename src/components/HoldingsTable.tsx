import React from 'react';
import { Trash2, Target, TrendingDown, TrendingUp } from 'lucide-react';

interface Holding {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  buy_price: number;
  buy_date: string;
  current_price: number;
  current_value: number;
  total_cost: number;
  pnl: number;
  pnl_percent: number;
  change_percent: number;
  ai_suggestions?: {
    confidence: number;
    stopLoss: number;
    addMorePrice: number;
    targetPrice: number;
    action: string;
    updatedAt: string;
  };
  ai_updated_at?: string;
}

interface HoldingsTableProps {
  holdings: Holding[];
  onDelete: (id: string) => void;
}

const HoldingsTable: React.FC<HoldingsTableProps> = ({ holdings, onDelete }) => {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
            <th style={headerStyle}>股票</th>
            <th style={headerStyle}>持股</th>
            <th style={headerStyle}>成本</th>
            <th style={headerStyle}>現價</th>
            <th style={headerStyle}>市值</th>
            <th style={headerStyle}>盈虧</th>
            <th style={headerStyle}>今日</th>
            {/* 🔥 新增 4 欄 */}
            <th style={headerStyle}>🎯 信心度</th>
            <th style={headerStyle}>🚨 止蝕價</th>
            <th style={headerStyle}>💰 加倉價</th>
            <th style={headerStyle}>📈 目標價</th>
            <th style={headerStyle}>買入日</th>
            <th style={headerStyle}>操作</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((h) => {
            const hasAI = h.ai_suggestions && h.ai_suggestions.confidence > 0;

            return (
              <tr key={h.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                {/* 股票 */}
                <td style={cellStyle}>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#111827' }}>{h.symbol}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{h.name}</div>
                  </div>
                </td>

                {/* 持股 */}
                <td style={cellStyle}>
                  <span style={{ fontWeight: '600' }}>{h.quantity}</span>
                </td>

                {/* 成本 */}
                <td style={cellStyle}>
                  <div>
                    <div style={{ fontWeight: '600' }}>${h.buy_price.toFixed(2)}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      ${h.total_cost.toFixed(2)}
                    </div>
                  </div>
                </td>

                {/* 現價 */}
                <td style={cellStyle}>
                  <span style={{ fontWeight: '600' }}>${h.current_price.toFixed(2)}</span>
                </td>

                {/* 市值 */}
                <td style={cellStyle}>
                  <span style={{ fontWeight: '600' }}>${h.current_value.toFixed(2)}</span>
                </td>

                {/* 盈虧 */}
                <td style={cellStyle}>
                  <div>
                    <div style={{ 
                      fontWeight: 'bold', 
                      color: h.pnl >= 0 ? '#10b981' : '#ef4444' 
                    }}>
                      {h.pnl >= 0 ? '+' : ''}${h.pnl.toFixed(2)}
                    </div>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: h.pnl >= 0 ? '#10b981' : '#ef4444' 
                    }}>
                      {h.pnl >= 0 ? '+' : ''}{h.pnl_percent.toFixed(2)}%
                    </div>
                  </div>
                </td>

                {/* 今日變化 */}
                <td style={cellStyle}>
                  <span style={{ 
                    fontSize: '0.875rem',
                    color: h.change_percent >= 0 ? '#10b981' : '#ef4444',
                    fontWeight: '600'
                  }}>
                    {h.change_percent >= 0 ? '+' : ''}{h.change_percent.toFixed(2)}%
                  </span>
                </td>

                {/* 🔥 信心度 */}
                <td style={cellStyle}>
                  {hasAI ? (
                    <div style={{
                      backgroundColor: h.ai_suggestions!.confidence >= 80 ? '#d1fae5' :
                                     h.ai_suggestions!.confidence >= 60 ? '#fef3c7' : '#fee2e2',
                      color: h.ai_suggestions!.confidence >= 80 ? '#065f46' :
                             h.ai_suggestions!.confidence >= 60 ? '#92400e' : '#991b1b',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      textAlign: 'center'
                    }}>
                      {h.ai_suggestions!.confidence}%
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>-</span>
                  )}
                </td>

                {/* 🔥 止蝕價 */}
                <td style={cellStyle}>
                  {hasAI ? (
                    <div>
                      <div style={{ 
                        fontWeight: '600', 
                        color: '#991b1b',
                        fontSize: '0.875rem'
                      }}>
                        ${h.ai_suggestions!.stopLoss.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                        {((h.ai_suggestions!.stopLoss / h.current_price - 1) * 100).toFixed(1)}%
                      </div>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>-</span>
                  )}
                </td>

                {/* 🔥 加倉價 */}
                <td style={cellStyle}>
                  {hasAI ? (
                    <div>
                      <div style={{ 
                        fontWeight: '600', 
                        color: '#065f46',
                        fontSize: '0.875rem'
                      }}>
                        ${h.ai_suggestions!.addMorePrice.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                        {((h.ai_suggestions!.addMorePrice / h.current_price - 1) * 100).toFixed(1)}%
                      </div>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>-</span>
                  )}
                </td>

                {/* 🔥 目標價 */}
                <td style={cellStyle}>
                  {hasAI ? (
                    <div>
                      <div style={{ 
                        fontWeight: '600', 
                        color: '#1e40af',
                        fontSize: '0.875rem'
                      }}>
                        ${h.ai_suggestions!.targetPrice.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                        +{((h.ai_suggestions!.targetPrice / h.current_price - 1) * 100).toFixed(1)}%
                      </div>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>-</span>
                  )}
                </td>

                {/* 買入日期 */}
                <td style={cellStyle}>
                  <div>
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {new Date(h.buy_date).toLocaleDateString('zh-HK')}
                    </span>
                    {hasAI && h.ai_updated_at && (
                      <div style={{ 
                        fontSize: '0.7rem', 
                        color: '#10b981',
                        marginTop: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        <Target size={10} />
                        AI: {new Date(h.ai_updated_at).toLocaleDateString('zh-HK')}
                      </div>
                    )}
                  </div>
                </td>

                {/* 操作 */}
                <td style={cellStyle}>
                  <button
                    onClick={() => onDelete(h.id)}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      color: '#dc2626',
                    }}
                    title="刪除持倉"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const headerStyle: React.CSSProperties = {
  padding: '1rem',
  textAlign: 'left',
  fontSize: '0.875rem',
  fontWeight: '600',
  color: '#6b7280',
  textTransform: 'uppercase',
};

const cellStyle: React.CSSProperties = {
  padding: '1rem',
  fontSize: '0.875rem',
};

export default HoldingsTable;