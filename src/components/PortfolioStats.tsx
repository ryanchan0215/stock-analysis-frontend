import React from 'react';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface Holding {
  total_cost: number;
  current_value: number;
  pnl: number;
  pnl_percent: number;
  symbol: string;
}

interface PortfolioStatsProps {
  holdings: Holding[];
}

const PortfolioStats: React.FC<PortfolioStatsProps> = ({ holdings }) => {
  const totalCost = holdings.reduce((sum, h) => sum + h.total_cost, 0);
  const totalValue = holdings.reduce((sum, h) => sum + h.current_value, 0);
  const totalPnl = totalValue - totalCost;
  const totalPnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  const bestPerformer = holdings.reduce(
    (best, h) => (h.pnl_percent > (best?.pnl_percent || -Infinity) ? h : best),
    holdings[0]
  );

  const worstPerformer = holdings.reduce(
    (worst, h) => (h.pnl_percent < (worst?.pnl_percent || Infinity) ? h : worst),
    holdings[0]
  );

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
      gap: '1.5rem',
      marginBottom: '2rem'
    }}>
      {/* 總投入 */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        borderLeft: '4px solid #6b7280'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <DollarSign size={20} style={{ color: '#6b7280' }} />
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>總投入</span>
        </div>
        <p style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827' }}>
          ${totalCost.toFixed(2)}
        </p>
      </div>

      {/* 總市值 */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        borderLeft: '4px solid #3b82f6'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <TrendingUp size={20} style={{ color: '#3b82f6' }} />
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>總市值</span>
        </div>
        <p style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827' }}>
          ${totalValue.toFixed(2)}
        </p>
      </div>

      {/* 總盈虧 */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        borderLeft: `4px solid ${totalPnl >= 0 ? '#10b981' : '#ef4444'}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          {totalPnl >= 0 ? (
            <TrendingUp size={20} style={{ color: '#10b981' }} />
          ) : (
            <TrendingDown size={20} style={{ color: '#ef4444' }} />
          )}
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>總盈虧</span>
        </div>
        <p style={{ 
          fontSize: '1.875rem', 
          fontWeight: 'bold', 
          color: totalPnl >= 0 ? '#10b981' : '#ef4444' 
        }}>
          {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
        </p>
        <p style={{ fontSize: '0.875rem', color: totalPnl >= 0 ? '#10b981' : '#ef4444', marginTop: '0.25rem' }}>
          {totalPnl >= 0 ? '+' : ''}{totalPnlPercent.toFixed(2)}%
        </p>
      </div>

      {/* 最佳表現 */}
      {bestPerformer && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #10b981'
        }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.75rem' }}>
            🏆 最佳表現
          </div>
          <p style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#111827' }}>
            {bestPerformer.symbol}
          </p>
          <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#10b981', marginTop: '0.25rem' }}>
            {bestPerformer.pnl_percent >= 0 ? '+' : ''}{bestPerformer.pnl_percent.toFixed(2)}%
          </p>
        </div>
      )}

      {/* 最差表現 */}
      {worstPerformer && worstPerformer.pnl_percent < 0 && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #ef4444'
        }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.75rem' }}>
            ⚠️ 需要關注
          </div>
          <p style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#111827' }}>
            {worstPerformer.symbol}
          </p>
          <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#ef4444', marginTop: '0.25rem' }}>
            {worstPerformer.pnl_percent.toFixed(2)}%
          </p>
        </div>
      )}
    </div>
  );
};

export default PortfolioStats;