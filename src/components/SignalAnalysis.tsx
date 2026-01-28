import React from 'react';

interface SignalAnalysisProps {
  technical: any;
}

const SignalAnalysis: React.FC<SignalAnalysisProps> = ({ technical }) => {
  // ===== 計算 MACD 信號 (2.5分) =====
  const macdSignal = () => {
    if (!technical.macd) return { status: 'neutral', text: '無數據', color: '#6b7280', strength: 0, score: 0 };
    
    const { macd, signal, histogram } = technical.macd;
    
    if (macd > signal && histogram > 0) {
      const score = Math.min(2.5, Math.abs(histogram) * 0.5);
      return { 
        status: 'bullish', 
        text: `金叉 (DIF: ${macd.toFixed(2)} > DEA: ${signal.toFixed(2)})`,
        color: '#10b981',
        strength: Math.min(10, Math.abs(histogram) * 2),
        score: score
      };
    } else if (macd < signal && histogram < 0) {
      const score = Math.max(0.5, 2.5 - Math.abs(histogram) * 0.5);
      return { 
        status: 'bearish', 
        text: `死叉 (DIF: ${macd.toFixed(2)} < DEA: ${signal.toFixed(2)})`,
        color: '#ef4444',
        strength: Math.min(10, Math.abs(histogram) * 2),
        score: score
      };
    } else {
      return { 
        status: 'neutral', 
        text: `觀望中 (Histogram: ${histogram.toFixed(2)})`,
        color: '#f59e0b',
        strength: 5,
        score: 1.5
      };
    }
  };

  // ===== 計算 RSI 信號 (2.5分) =====
  const rsiSignal = () => {
    if (!technical.rsi) return { status: 'neutral', text: '無數據', color: '#6b7280', strength: 0, score: 0 };
    
    const rsi = technical.rsi;
    let score = 0;
    let status = 'neutral';
    let color = '#f59e0b';
    let text = '';
    let strength = 5;
    
    if (rsi > 70) {
      score = 0.5 + (80 - rsi) / 10;
      status = 'bearish';
      color = '#ef4444';
      text = `超買 (${rsi.toFixed(1)})`;
      strength = Math.min(10, (rsi - 70) / 3);
    } else if (rsi < 30) {
      score = 2.5;
      status = 'bullish';
      color = '#10b981';
      text = `超賣 (${rsi.toFixed(1)})`;
      strength = Math.min(10, (30 - rsi) / 3);
    } else if (rsi >= 50) {
      score = 1.5 + (rsi - 50) / 20;
      status = 'neutral';
      color = '#10b981';
      text = `偏強 (${rsi.toFixed(1)})`;
      strength = (rsi - 50) / 5;
    } else {
      score = 1.0 + rsi / 50;
      status = 'neutral';
      color = '#f59e0b';
      text = `偏弱 (${rsi.toFixed(1)})`;
      strength = (50 - rsi) / 5;
    }
    
    return { status, text, color, strength, score };
  };

  // ===== 計算 MA 信號 (2.5分) =====
  const maSignal = () => {
    if (!technical.ma50 || !technical.ma200) return { status: 'neutral', text: '無數據', color: '#6b7280', strength: 0, score: 0 };
    
    const { ma50, ma200 } = technical;
    const currentPrice = technical.currentPrice || 0;
    
    let signals = [];
    let score = 0;
    let status = 'neutral';
    let color = '#6b7280';
    let text = '';
    let strength = 5;
    
    if (currentPrice > ma50) {
      signals.push(`價格 > MA50 ✓`);
    } else {
      signals.push(`價格 < MA50 ✗`);
    }
    
    if (currentPrice > ma200) {
      signals.push(`價格 > MA200 ✓`);
    } else {
      signals.push(`價格 < MA200 ✗`);
    }
    
    if (ma50 > ma200) {
      status = 'bullish';
      color = '#10b981';
      strength = 8;
      
      if (currentPrice > ma50 && currentPrice > ma200) {
        score = 2.5;
        text = `黃金交叉 (MA50 > MA200)`;
      } else if (currentPrice > ma50) {
        score = 1.8;
        text = `黃金交叉（價格在 MA50 上方）`;
      } else {
        score = 1.2;
        text = `黃金交叉（但價格在均線下方）`;
      }
    } else {
      status = 'bearish';
      color = '#ef4444';
      strength = 8;
      
      if (currentPrice < ma50 && currentPrice < ma200) {
        score = 0.5;
        text = `死亡交叉 (MA50 < MA200)`;
      } else if (currentPrice > ma200) {
        score = 1.5;
        text = `死亡交叉（但價格在 MA200 上方）`;
      } else {
        score = 1.0;
        text = `死亡交叉`;
      }
    }
    
    return { status, text, detail: signals.join(' | '), color, strength, score };
  };

  // ===== 計算布林通道信號 (2.5分) =====
  const bollingerSignal = () => {
    if (!technical.bollingerBands) return { status: 'neutral', text: '無數據', color: '#6b7280', strength: 0, score: 0 };
    
    const { upper, middle, lower } = technical.bollingerBands;
    const currentPrice = technical.currentPrice || 0;
    
    const bandwidth = ((upper - lower) / middle * 100).toFixed(2);
    
    let score = 0;
    let status = 'neutral';
    let color = '#6b7280';
    let text = '';
    let strength = 5;
    
    if (currentPrice > upper) {
      score = 0.8;
      status = 'bearish';
      color = '#ef4444';
      text = `突破上軌 (${currentPrice.toFixed(2)} > ${upper.toFixed(2)})`;
      strength = 7;
    } else if (currentPrice < lower) {
      score = 2.5;
      status = 'bullish';
      color = '#10b981';
      text = `跌破下軌 (${currentPrice.toFixed(2)} < ${lower.toFixed(2)})`;
      strength = 7;
    } else if (currentPrice > middle) {
      score = 1.5;
      text = `上半區 (帶寬: ${bandwidth}%)`;
    } else {
      score = 1.2;
      text = `下半區 (帶寬: ${bandwidth}%)`;
    }
    
    return { status, text, detail: `帶寬: ${bandwidth}%`, color, strength, score };
  };

  // ===== 綜合評分 =====
  const calculateOverallSignal = () => {
    const signals = [macdSignal(), rsiSignal(), maSignal(), bollingerSignal()];
    
    let bullishScore = 0;
    let bearishScore = 0;
    
    signals.forEach(signal => {
      if (signal.status === 'bullish') bullishScore += signal.strength || 5;
      if (signal.status === 'bearish') bearishScore += signal.strength || 5;
    });
    
    const totalScore = bullishScore + bearishScore;
    const bullishPercent = totalScore > 0 ? (bullishScore / totalScore * 100).toFixed(0) : 50;
    const bearishPercent = totalScore > 0 ? (bearishScore / totalScore * 100).toFixed(0) : 50;
    
    // 計算總分（滿分 10 分）
    const totalSignalScore = signals.reduce((sum, sig) => sum + sig.score, 0);
    
    let recommendation = '';
    let recommendColor = '#6b7280';
    
    if (bullishScore > bearishScore * 1.5) {
      recommendation = '📈 建議買入';
      recommendColor = '#10b981';
    } else if (bearishScore > bullishScore * 1.5) {
      recommendation = '📉 建議賣出';
      recommendColor = '#ef4444';
    } else {
      recommendation = '⏸️ 觀望';
      recommendColor = '#f59e0b';
    }
    
    return { 
      bullishPercent, 
      bearishPercent, 
      recommendation, 
      recommendColor,
      totalSignalScore: totalSignalScore.toFixed(1)
    };
  };

  const macd = macdSignal();
  const rsi = rsiSignal();
  const ma = maSignal();
  const bb = bollingerSignal();
  const overall = calculateOverallSignal();

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      marginTop: '1.5rem'
    }}>
      <h2 style={{ 
        fontSize: '1.25rem', 
        fontWeight: 'bold', 
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        🎯 交易信號分析
        <span style={{ 
          fontSize: '0.875rem', 
          fontWeight: 'normal',
          color: '#6b7280',
          marginLeft: 'auto'
        }}>
          總分: {overall.totalSignalScore}/10
        </span>
      </h2>

      {/* 綜合評分 */}
      <div style={{
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        padding: '1rem',
        marginBottom: '1.5rem',
        border: `2px solid ${overall.recommendColor}`
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '0.75rem'
        }}>
          <span style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>
            綜合建議
          </span>
          <span style={{ 
            fontSize: '1.25rem', 
            fontWeight: 'bold',
            color: overall.recommendColor
          }}>
            {overall.recommendation}
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <div style={{
            flex: overall.bullishPercent,
            height: '24px',
            backgroundColor: '#10b981',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '0.75rem',
            fontWeight: 'bold'
          }}>
            {Number(overall.bullishPercent) > 15 && `看多 ${overall.bullishPercent}%`}
          </div>
          <div style={{
            flex: overall.bearishPercent,
            height: '24px',
            backgroundColor: '#ef4444',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '0.75rem',
            fontWeight: 'bold'
          }}>
            {Number(overall.bearishPercent) > 15 && `看空 ${overall.bearishPercent}%`}
          </div>
        </div>
      </div>

      {/* 個別指標分析 */}
      <div style={{ display: 'grid', gap: '1rem' }}>
        {/* MACD */}
        <div style={{
          padding: '1rem',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          borderLeft: `4px solid ${macd.color}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>📊 MACD</div>
              <div style={{ fontSize: '0.875rem', color: macd.color }}>{macd.text}</div>
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '0.25rem'
            }}>
              <div style={{
                padding: '0.25rem 0.75rem',
                backgroundColor: macd.color,
                color: 'white',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: 'bold'
              }}>
                {macd.score.toFixed(1)}/2.5
              </div>
              <div style={{
                fontSize: '0.7rem',
                color: '#6b7280'
              }}>
                {((macd.score / 2.5) * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </div>

        {/* RSI */}
        <div style={{
          padding: '1rem',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          borderLeft: `4px solid ${rsi.color}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>📈 RSI</div>
              <div style={{ fontSize: '0.875rem', color: rsi.color }}>{rsi.text}</div>
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '0.25rem'
            }}>
              <div style={{
                padding: '0.25rem 0.75rem',
                backgroundColor: rsi.color,
                color: 'white',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: 'bold'
              }}>
                {rsi.score.toFixed(1)}/2.5
              </div>
              <div style={{
                fontSize: '0.7rem',
                color: '#6b7280'
              }}>
                {((rsi.score / 2.5) * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </div>

        {/* MA */}
        <div style={{
          padding: '1rem',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          borderLeft: `4px solid ${ma.color}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>📉 移動平均線</div>
              <div style={{ fontSize: '0.875rem', color: ma.color }}>{ma.text}</div>
              {ma.detail && (
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  {ma.detail}
                </div>
              )}
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '0.25rem'
            }}>
              <div style={{
                padding: '0.25rem 0.75rem',
                backgroundColor: ma.color,
                color: 'white',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: 'bold'
              }}>
                {ma.score.toFixed(1)}/2.5
              </div>
              <div style={{
                fontSize: '0.7rem',
                color: '#6b7280'
              }}>
                {((ma.score / 2.5) * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </div>

        {/* Bollinger Bands */}
        <div style={{
          padding: '1rem',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          borderLeft: `4px solid ${bb.color}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>🎚️ 布林通道</div>
              <div style={{ fontSize: '0.875rem', color: bb.color }}>{bb.text}</div>
              {bb.detail && (
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  {bb.detail}
                </div>
              )}
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '0.25rem'
            }}>
              <div style={{
                padding: '0.25rem 0.75rem',
                backgroundColor: bb.color,
                color: 'white',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: 'bold'
              }}>
                {bb.score.toFixed(1)}/2.5
              </div>
              <div style={{
                fontSize: '0.7rem',
                color: '#6b7280'
              }}>
                {((bb.score / 2.5) * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignalAnalysis;