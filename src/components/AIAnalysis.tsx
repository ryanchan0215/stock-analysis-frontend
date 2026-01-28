import React, { useState } from 'react';
import { Brain, Loader } from 'lucide-react';
import axios from 'axios';

interface AIAnalysisProps {
  symbol: string;
  stockData?: any;  // ✅ 新加：接收完整股票數據
}

const AIAnalysis: React.FC<AIAnalysisProps> = ({ symbol, stockData }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ✅ 計算信號分析（同 SignalAnalysis 一樣）
  const calculateSignals = () => {
    if (!stockData?.technical) return null;

    const { technical, quote } = stockData;

    // MACD 信號
    const macdSignal = () => {
      if (!technical.macd) return { status: 'neutral', text: '無數據', strength: 0 };
      const { macd, signal, histogram } = technical.macd;
      if (macd > signal && histogram > 0) {
        return { 
          status: 'bullish', 
          text: `金叉 (DIF: ${macd.toFixed(2)} > DEA: ${signal.toFixed(2)})`,
          strength: Math.min(10, Math.abs(histogram) * 2)
        };
      } else if (macd < signal && histogram < 0) {
        return { 
          status: 'bearish', 
          text: `死叉 (DIF: ${macd.toFixed(2)} < DEA: ${signal.toFixed(2)})`,
          strength: Math.min(10, Math.abs(histogram) * 2)
        };
      }
      return { status: 'neutral', text: `觀望中`, strength: 5 };
    };

    // RSI 信號
    const rsiSignal = () => {
      if (!technical.rsi) return { status: 'neutral', text: '無數據', strength: 0 };
      const rsi = technical.rsi;
      if (rsi > 70) {
        return { status: 'bearish', text: `超買 (${rsi.toFixed(1)})`, strength: Math.min(10, (rsi - 70) / 3) };
      } else if (rsi < 30) {
        return { status: 'bullish', text: `超賣 (${rsi.toFixed(1)})`, strength: Math.min(10, (30 - rsi) / 3) };
      } else if (rsi > 50) {
        return { status: 'neutral', text: `偏強 (${rsi.toFixed(1)})`, strength: (rsi - 50) / 5 };
      } else {
        return { status: 'neutral', text: `偏弱 (${rsi.toFixed(1)})`, strength: (50 - rsi) / 5 };
      }
    };

    // MA 信號
    const maSignal = () => {
      if (!technical.ma50 || !technical.ma200) return { status: 'neutral', text: '無數據', strength: 0 };
      const { ma50, ma200 } = technical;
      if (ma50 > ma200) {
        return { status: 'bullish', text: `黃金交叉`, strength: 8 };
      } else {
        return { status: 'bearish', text: `死亡交叉`, strength: 8 };
      }
    };

    // 布林通道信號
    const bollingerSignal = () => {
      if (!technical.bollingerBands) return { status: 'neutral', text: '無數據', strength: 0 };
      const { upper, lower } = technical.bollingerBands;
      const currentPrice = quote?.currentPrice || 0;
      if (currentPrice > upper) {
        return { status: 'bearish', text: `突破上軌`, strength: 7 };
      } else if (currentPrice < lower) {
        return { status: 'bullish', text: `跌破下軌`, strength: 7 };
      }
      return { status: 'neutral', text: `喺軌道內`, strength: 5 };
    };

    const signals = {
      macd: macdSignal(),
      rsi: rsiSignal(),
      ma: maSignal(),
      bollinger: bollingerSignal()
    };

    // 計算綜合評分
    let bullishScore = 0;
    let bearishScore = 0;
    Object.values(signals).forEach((sig: any) => {
      if (sig.status === 'bullish') bullishScore += sig.strength || 5;
      if (sig.status === 'bearish') bearishScore += sig.strength || 5;
    });

    const totalScore = bullishScore + bearishScore;
    const bullishPercent = totalScore > 0 ? ((bullishScore / totalScore) * 100).toFixed(0) : 50;
    const bearishPercent = totalScore > 0 ? ((bearishScore / totalScore) * 100).toFixed(0) : 50;

    let recommendation = '⏸️ 觀望';
    if (bullishScore > bearishScore * 1.5) {
      recommendation = '📈 建議買入';
    } else if (bearishScore > bullishScore * 1.5) {
      recommendation = '📉 建議賣出';
    }

    return {
      signals,
      overall: { bullishPercent, bearishPercent, recommendation }
    };
  };

  const generateAnalysis = async () => {
    setLoading(true);
    setError('');

    try {
      // ✅ 計算信號
      const signalData = calculateSignals();

      // ✅ 構建 Prompt（包含信號分析）
      const enhancedPrompt = buildEnhancedPrompt(stockData, signalData);

        // ✅ Debug Log
    console.log('📤 Sending Prompt to AI:');
    console.log(enhancedPrompt);
    console.log('📰 News in Prompt:', enhancedPrompt.includes('📰 **最新新聞'));


      const response = await axios.post(
        `http://localhost:5000/api/analysis/stock/${symbol}`,
        {
          customPrompt: enhancedPrompt  // ✅ 傳送自訂 Prompt
        }
      );

      setAnalysis(response.data.data.analysis);
    } catch (err: any) {
      setError(err.response?.data?.error || 'AI 分析失敗');
    } finally {
      setLoading(false);
    }
  };

 // ✅ 構建增強版 Prompt
const buildEnhancedPrompt = (data: any, signals: any) => {
  if (!data || !signals) return '';

  const { quote, technical, profile, news } = data;  // ✅ 加入 news

   console.log('🔍 AI Prompt Data:', {
    hasNews: !!news,
    newsCount: news?.length || 0,
    news: news
  });

  const { overall, signals: sig } = signals;

  return `請用繁體中文、廣東話風格分析以下股票，並**重點參考我哋系統計算出嘅信號分析**：

📊 **系統信號分析結果**：
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 綜合建議：${overall.recommendation}
   看多：${overall.bullishPercent}% | 看空：${overall.bearishPercent}%

📊 MACD：${sig.macd.text} (強度: ${sig.macd.strength.toFixed(1)}/10)
📈 RSI：${sig.rsi.text} (強度: ${sig.rsi.strength.toFixed(1)}/10)
📉 移動平均線：${sig.ma.text} (強度: ${sig.ma.strength.toFixed(1)}/10)
🎚️ 布林通道：${sig.bollinger.text} (強度: ${sig.bollinger.strength.toFixed(1)}/10)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

股票：${symbol} - ${profile?.name || 'N/A'}

市場數據：
- 現價：$${quote?.currentPrice?.toFixed(2)}
- 今日變動：${quote?.changePercent >= 0 ? '+' : ''}${quote?.changePercent?.toFixed(2)}%
- 最高/最低：$${quote?.high?.toFixed(2)} / $${quote?.low?.toFixed(2)}

技術指標：
- RSI：${technical?.rsi?.toFixed(2)} (${technical?.rsiLevel?.level})
- 趨勢：${technical?.trend}
- MA50：$${technical?.ma50?.toFixed(2)} (現價${quote?.currentPrice > technical?.ma50 ? '在上方✓' : '在下方✗'})
- MA200：$${technical?.ma200?.toFixed(2)} (現價${quote?.currentPrice > technical?.ma200 ? '在上方✓' : '在下方✗'})

${technical?.macd ? `
MACD 數值：
- DIF (MACD)：${technical.macd.macd.toFixed(2)}
- DEA (Signal)：${technical.macd.signal.toFixed(2)}
- Histogram：${technical.macd.histogram.toFixed(2)}
` : ''}

${technical?.bollingerBands ? `
布林通道：
- 上軌：$${technical.bollingerBands.upper.toFixed(2)}
- 中軌：$${technical.bollingerBands.middle.toFixed(2)}
- 下軌：$${technical.bollingerBands.lower.toFixed(2)}
` : ''}

${news && news.length > 0 ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📰 **最新新聞（近 7 日）- 必須逐條分析**：
${news.slice(0, 5).map((n: any, i: number) => `
${i + 1}. 《${n.headline}》
   來源：${n.source}
   時間：${new Date(parseInt(n.datetime) * 1000).toLocaleDateString('zh-HK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
   摘要：${n.summary ? n.summary.substring(0, 200) : '(無摘要)'}
   
   **呢條新聞對股價嘅影響：**
   ${i === 0 && n.headline.includes('Loses') ? '（稀釋風險，短期利空）' : ''}
   ${i === 1 && n.headline.includes('Upgrade') ? '（分析師升級，長期利好）' : ''}
   ${i === 2 && n.headline.includes('registers') ? '（股份轉售，供應壓力）' : ''}
   ${i === 3 && n.headline.includes('Too Late') ? '（估值分析，參考意見）' : ''}
   ${i === 4 && n.headline.includes('Down') ? '（融資稀釋，短期利空）' : ''}
`).join('\n')}

**🔥 新聞分析要求（必須做）：**
1. 逐條分析每條新聞對股價嘅正面/負面影響
2. 解釋點解呢啲新聞會影響投資決策
3. 如果有矛盾嘅新聞（例如：有升級預測，但又有稀釋風險），要解釋點樣平衡
4. 最後總結：新聞整體係利好定利空？影響有幾大？
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**⚠️ 重要提示（必須遵守）**：
1. 請**同我哋系統計算嘅信號分析做對比**
2. 如果你嘅分析同系統唔同，請解釋原因
3. 要指出系統可能冇考慮到嘅因素（例如：基本面、市場情緒、新聞事件）
${news && news.length > 0 ? `
4. **🔥 最重要：你必須逐條分析上面 ${news.length} 條新聞，唔可以只提一句「有新聞」就算！**
   - 每條新聞要講係利好定利空
   - 要解釋點解會影響股價
   - 要講呢啲新聞改變咗你幾多投資決策
` : ''}

請按以下結構分析（用繁體中文、廣東話）：

## 🤖 AI 分析 vs 系統信號

### 📊 技術面確認
（你係咪同意系統嘅 ${overall.recommendation}？點解？）

### 🔍 系統冇考慮到嘅因素

${news && news.length > 0 ? `
#### 📰 新聞分析（必須逐條講）
**請逐條分析呢 ${news.length} 條新聞：**
${news.slice(0, 5).map((n: any, i: number) => `
${i + 1}. 《${n.headline.substring(0, 60)}...》
   → 呢條新聞係利好定利空？
   → 對股價影響有幾大（1-10 分）？
   → 改變咗你幾多投資決策？
`).join('\n')}

**新聞整體影響總結：**
- 正面新聞 vs 負面新聞比例？
- 整體係利好定利空？
- 新聞影響短期定長期？

---
` : ''}

#### 🏢 基本面分析
（業務發展、財務表現、行業趨勢）

#### 📊 宏觀經濟
（全球經濟、科技行業趨勢）

### 🎯 三種情境
1. 樂觀：突破 $${(quote?.currentPrice * 1.05).toFixed(2)} 可以點
2. 悲觀：跌破 $${(quote?.currentPrice * 0.95).toFixed(2)} 要點做
3. 中性：橫行要點等

### 💡 最終建議
（綜合技術面 + 基本面 + 市場情緒 ${news && news.length > 0 ? '+ 新聞影響' : ''}）

### 🔥 一句總結

記住：用「可以考慮」、「留意」呢啲詞，唔好直接講「買」或「賣」。
要解釋你同系統信號嘅分析有咩唔同！`;
};

  return (
    <div style={{ marginTop: '2rem' }}>
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Brain size={24} />
            🤖 AI 投資分析
          </h2>
          <button
            onClick={generateAnalysis}
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: loading ? '#9ca3af' : '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
            }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Loader size={16} className="spinner" />
                生成中...
              </span>
            ) : (
              '生成 AI 分析'
            )}
          </button>
        </div>

        {/* ✅ 提示用戶系統已計算信號 */}
        {stockData?.technical && (
          <div style={{
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            padding: '0.75rem',
            marginBottom: '1rem',
            fontSize: '0.875rem',
            color: '#1e40af'
          }}>
            💡 AI 會參考上面「交易信號分析」嘅結果，並提供額外嘅基本面、市場情緒分析
          </div>
        )}

        {error && (
          <div
            style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '1rem',
              color: '#991b1b',
            }}
          >
            ❌ {error}
          </div>
        )}

        {analysis && (
          <div
            style={{
              whiteSpace: 'pre-wrap',
              lineHeight: '1.8',
              color: '#374151',
              backgroundColor: '#f9fafb',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
            }}
          >
            {analysis}
          </div>
        )}

        {!analysis && !loading && !error && (
          <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
            點擊「生成 AI 分析」獲取專業投資建議（會參考系統信號分析）
          </p>
        )}
      </div>
    </div>
  );
};

export default AIAnalysis;