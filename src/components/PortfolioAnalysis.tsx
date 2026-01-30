import React, { useState } from 'react';
import { Brain, Save } from 'lucide-react';
import api from '../services/api';  // ✅ 改用呢個

interface Holding {
  id?: string;
  symbol: string;
  quantity: number;
  buy_price: number;
  current_price: number;
  pnl: number;
  pnl_percent: number;
}

interface PortfolioAnalysisProps {
  holdings: Holding[];
  portfolioId: string;
}

interface TechnicalSignal {
  text: string;
  score: number;
}

interface HoldingAdvice {
  symbol: string;
  action: 'HOLD' | 'BUY_MORE' | 'REDUCE' | 'SELL';
  confidence: number;
  targetPrice: number;
  stopLoss: number;
  addMorePrice: number;
  reasoning: string;
  technicalSignals: {
    macd: TechnicalSignal;
    rsi: TechnicalSignal;
    ma: TechnicalSignal;
    bollinger: TechnicalSignal;
    overall: string;
  };
}

interface PortfolioSummary {
  totalHoldings: number;
  actionsCount: {
    HOLD: number;
    BUY_MORE: number;
    REDUCE: number;
    SELL: number;
  };
  avgConfidence: number;
  needAction: number;
  highRisk: number;
  opportunities: number;
  suggestion: string;
}

const PortfolioAnalysis: React.FC<PortfolioAnalysisProps> = ({ holdings, portfolioId }) => {
  const [analysis, setAnalysis] = useState<HoldingAdvice[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});

  const analyzePortfolio = async () => {
    setLoading(true);
    setError('');

    try {
     const response = await api.post('/analysis/holdings', {  // ✅ 改呢行
        holdings: holdings.map(h => ({
          symbol: h.symbol,
          quantity: h.quantity,
          buy_price: h.buy_price,
          current_price: h.current_price
        }))
      });

      console.log('✅ AI Analysis Response:', response.data);
      
      const sortedAdvice = sortAdviceByPriority(response.data.data.advice);
      
      setAnalysis(sortedAdvice);
      setSummary(response.data.data.summary);
    } catch (err: any) {
      console.error('❌ Analysis Error:', err);
      setError(err.response?.data?.error || 'AI 組合分析失敗');
    } finally {
      setLoading(false);
    }
  };

  const sortAdviceByPriority = (adviceList: HoldingAdvice[]) => {
    return [...adviceList].sort((a, b) => {
      if (a.action === 'SELL' && b.action !== 'SELL') return -1;
      if (a.action !== 'SELL' && b.action === 'SELL') return 1;
      if (a.action === 'BUY_MORE' && b.action !== 'BUY_MORE') return -1;
      if (a.action !== 'BUY_MORE' && b.action === 'BUY_MORE') return 1;
      if (a.action === 'REDUCE' && b.action !== 'REDUCE') return -1;
      if (a.action !== 'REDUCE' && b.action === 'REDUCE') return 1;
      return b.confidence - a.confidence;
    });
  };

  const updatePrice = (symbol: string, priceType: 'stopLoss' | 'addMorePrice' | 'targetPrice') => {
    const holding = holdings.find(h => h.symbol === symbol);
    const advice = analysis.find(a => a.symbol === symbol);
    if (!holding || !advice) return;

    const priceLabels = {
      stopLoss: '止損價',
      addMorePrice: '加倉價',
      targetPrice: '目標價'
    };

    const minMax = {
      stopLoss: { min: holding.current_price * 0.70, max: holding.current_price * 0.95 },
      addMorePrice: { min: holding.current_price * 0.80, max: holding.current_price * 0.98 },
      targetPrice: { min: holding.current_price * 1.02, max: holding.current_price * 1.50 }
    };

    const range = minMax[priceType];
    const currentValue = advice[priceType];

    const newPrice = prompt(
      `設定 ${symbol} ${priceLabels[priceType]}：\n` +
      `建議範圍：$${range.min.toFixed(2)} - $${range.max.toFixed(2)}\n` +
      `目前設定：$${currentValue.toFixed(2)}`,
      currentValue.toString()
    );

    if (newPrice && !isNaN(parseFloat(newPrice))) {
      const parsedPrice = parseFloat(newPrice);
      
      if (parsedPrice < range.min || parsedPrice > range.max) {
        alert(`價位超出建議範圍！`);
        return;
      }

      setAnalysis(prev => prev.map(a => 
        a.symbol === symbol 
          ? { ...a, [priceType]: parsedPrice }
          : a
      ));
    }
  };

  const saveAISuggestions = async (advice: HoldingAdvice) => {
    const holding = holdings.find(h => h.symbol === advice.symbol);
    if (!holding) {
      alert('找不到對應的持倉數據');
      return;
    }

    const holdingId = (holding as any).id;
    if (!holdingId) {
      alert('持倉缺少 ID');
      return;
    }

    setSavingStates(prev => ({ ...prev, [advice.symbol]: true }));

    try {
      await api.patch(  // ✅ 改呢行
        `/holdings/${holdingId}/ai-suggestions`,
        {
          confidence: advice.confidence,
          stopLoss: advice.stopLoss,
          addMorePrice: advice.addMorePrice,
          targetPrice: advice.targetPrice,
          action: advice.action,
          reasoning: advice.reasoning,
          technicalSignals: advice.technicalSignals
        }
      );

      alert(`✅ ${advice.symbol} AI 建議已儲存`);

    } catch (error: any) {
      alert(`❌ 儲存失敗`);
    } finally {
      setSavingStates(prev => ({ ...prev, [advice.symbol]: false }));
    }
  };

  const getActionBadge = (action: string) => {
    const styles = {
      HOLD: { bg: '#dbeafe', color: '#1e40af', text: '✅ 繼續持有', icon: '🔒' },
      BUY_MORE: { bg: '#d1fae5', color: '#065f46', text: '📈 建議加倉', icon: '➕' },
      REDUCE: { bg: '#fef3c7', color: '#92400e', text: '⚠️ 建議減倉', icon: '➖' },
      SELL: { bg: '#fee2e2', color: '#991b1b', text: '🚨 建議清倉', icon: '❌' }
    };
    const style = styles[action as keyof typeof styles] || styles.HOLD;
    
    return (
      <span style={{
        backgroundColor: style.bg,
        color: style.color,
        padding: '0.5rem 1rem',
        borderRadius: '8px',
        fontWeight: '600',
        fontSize: '0.875rem',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <span style={{ fontSize: '1.25rem' }}>{style.icon}</span>
        {style.text}
      </span>
    );
  };

  const getConfidenceBadge = (confidence: number) => {
    const color = confidence >= 80 ? '#10b981' : confidence >= 60 ? '#f59e0b' : '#ef4444';
    return (
      <span style={{
        backgroundColor: `${color}20`,
        color: color,
        padding: '0.25rem 0.75rem',
        borderRadius: '6px',
        fontSize: '0.75rem',
        fontWeight: '600'
      }}>
        信心度: {confidence}%
      </span>
    );
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '1.5rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Brain size={28} color="#8b5cf6" />
            🎯 AI 組合診斷
          </h2>
          <button
            onClick={analyzePortfolio}
            disabled={loading || holdings.length === 0}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: loading ? '#9ca3af' : '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '🔍 分析中...' : `分析 ${holdings.length} 隻持倉`}
          </button>
        </div>

        <div style={{
          backgroundColor: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem',
          fontSize: '0.875rem',
          color: '#0c4a6e'
        }}>
          <strong>💡 AI 會分析：</strong> 技術指標評分（MACD、RSI、均線、布林通道各 2.5 分，總分 10 分）
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '1rem',
            color: '#991b1b',
            marginBottom: '1rem'
          }}>
            ❌ {error}
          </div>
        )}

        {summary && (
          <div style={{
            backgroundColor: '#fef3c7',
            border: '2px solid #fbbf24',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              📊 組合整體建議
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#92400e' }}>總持倉</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#92400e' }}>
                  {summary.totalHoldings}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#92400e' }}>平均信心度</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#92400e' }}>
                  {summary.avgConfidence}%
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#dc2626' }}>🚨 高風險</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626' }}>
                  {summary.highRisk}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#059669' }}>📈 機會</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#059669' }}>
                  {summary.opportunities}
                </div>
              </div>
            </div>

            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '1rem',
              fontSize: '0.875rem',
              color: '#92400e',
              fontWeight: '500'
            }}>
              {summary.suggestion}
            </div>

            <div style={{
              marginTop: '1rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '0.5rem',
              fontSize: '0.75rem'
            }}>
              <div style={{ textAlign: 'center', padding: '0.5rem', backgroundColor: '#dbeafe', borderRadius: '6px' }}>
                🔒 持有: {summary.actionsCount.HOLD}
              </div>
              <div style={{ textAlign: 'center', padding: '0.5rem', backgroundColor: '#d1fae5', borderRadius: '6px' }}>
                ➕ 加倉: {summary.actionsCount.BUY_MORE}
              </div>
              <div style={{ textAlign: 'center', padding: '0.5rem', backgroundColor: '#fef3c7', borderRadius: '6px' }}>
                ➖ 減倉: {summary.actionsCount.REDUCE}
              </div>
              <div style={{ textAlign: 'center', padding: '0.5rem', backgroundColor: '#fee2e2', borderRadius: '6px' }}>
                ❌ 清倉: {summary.actionsCount.SELL}
              </div>
            </div>
          </div>
        )}

        {analysis.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {analysis.map((advice) => {
              const holding = holdings.find(h => h.symbol === advice.symbol);
              if (!holding) return null;

              const isSaving = savingStates[advice.symbol] || false;

              return (
                <div
                  key={advice.symbol}
                  style={{
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    backgroundColor: '#fafafa'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '1rem'
                  }}>
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                        {advice.symbol}
                      </h3>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        {getActionBadge(advice.action)}
                        {getConfidenceBadge(advice.confidence)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        買入: ${holding.buy_price.toFixed(2)}
                      </p>
                      <p style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>
                        現價: ${holding.current_price.toFixed(2)}
                      </p>
                      <p style={{
                        fontSize: '0.875rem',
                        color: holding.pnl >= 0 ? '#10b981' : '#ef4444',
                        fontWeight: '600'
                      }}>
                        {holding.pnl >= 0 ? '+' : ''}${holding.pnl.toFixed(2)} 
                        ({holding.pnl_percent >= 0 ? '+' : ''}{holding.pnl_percent.toFixed(2)}%)
                      </p>
                    </div>
                  </div>

                  {/* 🔥 技術信號評分 */}
                  <div style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '1rem',
                    border: '1px solid #e5e7eb'
                  }}>
                    <h4 style={{ 
                      fontSize: '0.875rem', 
                      fontWeight: '600', 
                      marginBottom: '0.75rem', 
                      color: '#6b7280',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      <span>📊 技術信號評分</span>
                      <span style={{ color: '#8b5cf6' }}>
                        總分: {(
                          advice.technicalSignals.macd.score +
                          advice.technicalSignals.rsi.score +
                          advice.technicalSignals.ma.score +
                          advice.technicalSignals.bollinger.score
                        ).toFixed(1)}/10
                      </span>
                    </h4>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', fontSize: '0.875rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                        <span>📈 MACD:</span>
                        <span style={{ fontWeight: '700', color: '#3b82f6' }}>
                          {advice.technicalSignals.macd.score.toFixed(1)}/2.5
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                        <span>📊 RSI:</span>
                        <span style={{ fontWeight: '700', color: '#3b82f6' }}>
                          {advice.technicalSignals.rsi.score.toFixed(1)}/2.5
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                        <span>📉 均線:</span>
                        <span style={{ fontWeight: '700', color: '#3b82f6' }}>
                          {advice.technicalSignals.ma.score.toFixed(1)}/2.5
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                        <span>🎚️ 布林:</span>
                        <span style={{ fontWeight: '700', color: '#3b82f6' }}>
                          {advice.technicalSignals.bollinger.score.toFixed(1)}/2.5
                        </span>
                      </div>
                    </div>
                    
                    <div style={{ 
                      marginTop: '0.75rem', 
                      paddingTop: '0.75rem', 
                      borderTop: '1px solid #e5e7eb',
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      lineHeight: '1.6'
                    }}>
                      <div>📈 MACD: {advice.technicalSignals.macd.text}</div>
                      <div>📊 RSI: {advice.technicalSignals.rsi.text}</div>
                      <div>📉 MA: {advice.technicalSignals.ma.text}</div>
                      <div>🎚️ 布林: {advice.technicalSignals.bollinger.text}</div>
                      <div style={{ fontWeight: '600', color: '#8b5cf6', marginTop: '0.5rem' }}>
                        🎯 綜合: {advice.technicalSignals.overall}
                      </div>
                    </div>
                  </div>

                  {/* 價位目標 */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '1rem',
                    marginBottom: '1rem'
                  }}>
                    <div 
                      style={{
                        backgroundColor: '#fee2e2',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        textAlign: 'center',
                        cursor: 'pointer'
                      }}
                      onClick={() => updatePrice(advice.symbol, 'stopLoss')}
                    >
                      <div style={{ fontSize: '0.75rem', color: '#991b1b', marginBottom: '0.25rem' }}>
                        🚨 止損價
                      </div>
                      <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#991b1b' }}>
                        ${advice.stopLoss.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#991b1b' }}>
                        ({((advice.stopLoss / holding.current_price - 1) * 100).toFixed(1)}%)
                      </div>
                    </div>

                    <div 
                      style={{
                        backgroundColor: '#d1fae5',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        textAlign: 'center',
                        cursor: 'pointer'
                      }}
                      onClick={() => updatePrice(advice.symbol, 'addMorePrice')}
                    >
                      <div style={{ fontSize: '0.75rem', color: '#065f46', marginBottom: '0.25rem' }}>
                        💰 加倉價
                      </div>
                      <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#065f46' }}>
                        ${advice.addMorePrice.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#065f46' }}>
                        ({((advice.addMorePrice / holding.current_price - 1) * 100).toFixed(1)}%)
                      </div>
                    </div>

                    <div 
                      style={{
                        backgroundColor: '#dbeafe',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        textAlign: 'center',
                        cursor: 'pointer'
                      }}
                      onClick={() => updatePrice(advice.symbol, 'targetPrice')}
                    >
                      <div style={{ fontSize: '0.75rem', color: '#1e40af', marginBottom: '0.25rem' }}>
                        🎯 目標價
                      </div>
                      <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1e40af' }}>
                        ${advice.targetPrice.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#1e40af' }}>
                        (+{((advice.targetPrice / holding.current_price - 1) * 100).toFixed(1)}%)
                      </div>
                    </div>
                  </div>

                  <div style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    padding: '1rem',
                    border: '1px solid #e5e7eb',
                    marginBottom: '1rem'
                  }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#6b7280' }}>
                      💡 AI 建議理由
                    </h4>
                    <p style={{
                      fontSize: '0.875rem',
                      lineHeight: '1.6',
                      color: '#374151',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {advice.reasoning}
                    </p>
                  </div>

                  <button
                    onClick={() => saveAISuggestions(advice)}
                    disabled={isSaving}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      backgroundColor: isSaving ? '#9ca3af' : '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: isSaving ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    {isSaving ? (
                      <>
                        <div style={{
                          width: '16px',
                          height: '16px',
                          border: '2px solid white',
                          borderTopColor: 'transparent',
                          borderRadius: '50%',
                          animation: 'spin 0.6s linear infinite'
                        }} />
                        儲存中...
                      </>
                    ) : (
                      <>
                        <Save size={20} />
                        💾 儲存到持倉明細
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {!analysis.length && !loading && !error && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
            <Brain size={64} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
            <p style={{ fontSize: '1.125rem', fontWeight: '500' }}>
              點擊「分析持倉」獲取 AI 建議
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PortfolioAnalysis;