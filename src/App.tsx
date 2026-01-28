import React, { useState, useCallback } from 'react';
import { Search, TrendingUp, AlertCircle, Newspaper } from 'lucide-react';
import { stockAPI, StockData, NewsItem } from './services/api';
import AdvancedChart from './components/AdvancedChart';
import './App.css';
import AIAnalysis from './components/AIAnalysis';
import SignalAnalysis from './components/SignalAnalysis';
import PortfolioPage from './pages/Portfolio';

function App() {
  // ✅ 頁面切換狀態
  const [currentPage, setCurrentPage] = useState<'search' | 'portfolio'>('search');

  // ✅ 原有的股票搜尋狀態
  const [symbol, setSymbol] = useState('');
  const [searchSymbol, setSearchSymbol] = useState('AAPL');
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [candleData, setCandleData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchStock = useCallback(async (tickerSymbol: string) => {
    if (!tickerSymbol.trim()) {
      setError('請輸入股票代碼');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await stockAPI.getQuote(tickerSymbol.toUpperCase());
      setStockData(data);

      try {
        const newsData = await stockAPI.getNews(tickerSymbol.toUpperCase());
        setNews(newsData.slice(0, 5));
      } catch (newsErr) {
        console.error('獲取新聞失敗:', newsErr);
        setNews([]);
      }

      try {
        const candles = await stockAPI.getCandles(tickerSymbol.toUpperCase(), 365);
        setCandleData(candles);
      } catch (candleErr) {
        console.error('獲取 K 線失敗:', candleErr);
        setCandleData([]);
      }

    } catch (err: any) {
      const errorMsg = err.response?.data?.error || '獲取數據失敗，請檢查股票代碼是否正確';
      setError(errorMsg);
      setStockData(null);
      setNews([]);
      setCandleData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedSymbol = symbol.trim().toUpperCase();
    
    if (!trimmedSymbol) {
      setError('請輸入股票代碼');
      return;
    }

    setSearchSymbol(trimmedSymbol);
    fetchStock(trimmedSymbol);
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleDateString('zh-HK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="app-container">
      <div className="content-wrapper">
        {/* ✅ 導航欄 */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          justifyContent: 'center',
          borderBottom: '2px solid #e5e7eb',
          paddingBottom: '1rem'
        }}>
          <button
            onClick={() => setCurrentPage('search')}
            style={{
              padding: '0.75rem 2rem',
              backgroundColor: currentPage === 'search' ? '#3b82f6' : 'white',
              color: currentPage === 'search' ? 'white' : '#374151',
              border: currentPage === 'search' ? 'none' : '1px solid #d1d5db',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '1.05rem',
              boxShadow: currentPage === 'search' ? '0 4px 6px rgba(59, 130, 246, 0.3)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            🔍 股票搜尋
          </button>
          <button
            onClick={() => setCurrentPage('portfolio')}
            style={{
              padding: '0.75rem 2rem',
              backgroundColor: currentPage === 'portfolio' ? '#3b82f6' : 'white',
              color: currentPage === 'portfolio' ? 'white' : '#374151',
              border: currentPage === 'portfolio' ? 'none' : '1px solid #d1d5db',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '1.05rem',
              boxShadow: currentPage === 'portfolio' ? '0 4px 6px rgba(59, 130, 246, 0.3)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            💼 我的組合
          </button>
        </div>

        {/* ✅ 根據選擇顯示不同頁面 */}
        {currentPage === 'search' ? (
          <>
            {/* Header */}
            <div className="header">
              <h1 className="title">📈 股票分析系統</h1>
              <p className="subtitle">實時報價 · 技術指標 · AI 分析</p>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSubmit} className="search-form">
              <div className="search-container">
                <div className="input-wrapper">
                  <Search className="search-icon" size={20} />
                  <input
                    type="text"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    placeholder="輸入股票代碼（例如：AAPL, 0700.HK, 9988.HK）"
                    className="search-input"
                  />
                </div>
                <button type="submit" disabled={loading} className="search-button">
                  {loading ? '載入中...' : '搜尋'}
                </button>
              </div>
              <p className="search-hint">
                💡 美股直接輸入代碼，港股請加 .HK 後綴（例如：騰訊 0700.HK、阿里 9988.HK）
              </p>
            </form>

            {/* Error Message */}
            {error && (
              <div className="error-message">
                <AlertCircle size={20} />
                <p>{error}</p>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="loading-message">
                <div className="spinner"></div>
                <p>正在獲取 {searchSymbol} 的數據...</p>
              </div>
            )}

            {/* Stock Data */}
            {stockData && !loading && (
              <>
                <div className="cards-grid">
                  {/* Quote Card */}
                  <div className="card">
                    <h2 className="card-title">
                      <TrendingUp size={20} />
                      實時報價
                    </h2>
                    <div className="card-content">
                      <div className="info-item">
                        <p className="info-label">股票代碼</p>
                        <p className="info-value-large">{stockData.symbol}</p>
                      </div>
                      <div className="info-item">
                        <p className="info-label">公司名稱</p>
                        <p className="info-value">{stockData.profile?.name || stockData.symbol}</p>
                      </div>
                      <div className="info-item">
                        <p className="info-label">當前價格</p>
                        <p className="price-value">
                          ${stockData.quote?.currentPrice?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      <div className="price-change">
                        <span
                          className={
                            (stockData.quote?.change || 0) >= 0
                              ? 'change-positive'
                              : 'change-negative'
                          }
                        >
                          {(stockData.quote?.change || 0) >= 0 ? '+' : ''}
                          {stockData.quote?.change?.toFixed(2) || '0.00'} (
                          {stockData.quote?.changePercent?.toFixed(2) || '0.00'}%)
                        </span>
                      </div>
                      <div className="divider"></div>
                      <div className="details-list">
                        <div className="detail-row">
                          <span>開盤</span>
                          <span>${stockData.quote?.open?.toFixed(2) || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                          <span>最高</span>
                          <span>${stockData.quote?.high?.toFixed(2) || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                          <span>最低</span>
                          <span>${stockData.quote?.low?.toFixed(2) || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                          <span>成交量</span>
                          <span>
                            {((stockData.quote?.volume || 0) / 1000000).toFixed(2)}M
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Technical Indicators Card */}
                  <div className="card">
                    <h2 className="card-title">📊 技術指標</h2>
                    <div className="card-content">
                      {stockData.technical?.rsi !== null && stockData.technical?.rsi !== undefined ? (
                        <>
                          <div className="rsi-section">
                            <div className="rsi-header">
                              <span>RSI (14)</span>
                              <span className="rsi-value">
                                {stockData.technical.rsi.toFixed(2)}
                              </span>
                            </div>
                            <div className="rsi-bar-container">
                              <div
                                className={`rsi-bar ${
                                  stockData.technical.rsi > 70
                                    ? 'rsi-overbought'
                                    : stockData.technical.rsi < 30
                                    ? 'rsi-oversold'
                                    : 'rsi-neutral'
                                }`}
                                style={{ width: `${stockData.technical.rsi}%` }}
                              ></div>
                            </div>
                            <p className="rsi-signal">
                              {stockData.technical.rsiLevel?.level || '未知'} -{' '}
                              {stockData.technical.rsiLevel?.signal || '數據不足'}
                            </p>
                          </div>

                          <div className="divider"></div>
                          <div className="details-list">
                            <div className="detail-row">
                              <span>MA50</span>
                              <span>${stockData.technical.ma50?.toFixed(2) || 'N/A'}</span>
                            </div>
                            <div className="detail-row">
                              <span>MA200</span>
                              <span>${stockData.technical.ma200?.toFixed(2) || 'N/A'}</span>
                            </div>
                            <div className="detail-row">
                              <span>趨勢</span>
                              <span>{stockData.technical.trend || 'N/A'}</span>
                            </div>
                            <div className="detail-row">
                              <span>波動率</span>
                              <span>{stockData.technical.volatility?.toFixed(2) || 'N/A'}%</span>
                            </div>
                          </div>

                          {stockData.technical.macd ? (
                            <>
                              <div className="divider"></div>
                              <div className="details-list">
                                <div className="detail-row">
                                  <span>MACD</span>
                                  <span>{stockData.technical.macd.macd.toFixed(2)}</span>
                                </div>
                                <div className="detail-row">
                                  <span>Signal</span>
                                  <span>{stockData.technical.macd.signal.toFixed(2)}</span>
                                </div>
                                <div className="detail-row">
                                  <span>Histogram</span>
                                  <span style={{ color: stockData.technical.macd.histogram > 0 ? '#10b981' : '#ef4444' }}>
                                    {stockData.technical.macd.histogram.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="divider"></div>
                              <div className="macd-warning">
                                <AlertCircle size={16} />
                                <span>MACD 數據不足</span>
                              </div>
                            </>
                          )}

                          {stockData.technical.bollingerBands && (
                            <>
                              <div className="divider"></div>
                              <div className="details-list">
                                <div className="detail-row">
                                  <span>布林上軌</span>
                                  <span>${stockData.technical.bollingerBands.upper.toFixed(2)}</span>
                                </div>
                                <div className="detail-row">
                                  <span>布林中軌</span>
                                  <span>${stockData.technical.bollingerBands.middle.toFixed(2)}</span>
                                </div>
                                <div className="detail-row">
                                  <span>布林下軌</span>
                                  <span>${stockData.technical.bollingerBands.lower.toFixed(2)}</span>
                                </div>
                              </div>
                            </>
                          )}

                          <div className="divider"></div>
                          <p className="data-info">
                            基於 {stockData.technical.dataPoints || 0} 日歷史數據計算
                          </p>
                        </>
                      ) : (
                        <p style={{ color: '#6b7280', textAlign: 'center' }}>
                          ⚠️ 技術指標數據不足
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Company Profile Card */}
                  <div className="card">
                    <h2 className="card-title">🏢 公司資料</h2>
                    <div className="card-content">
                      <div className="info-item">
                        <p className="info-label">交易所</p>
                        <p className="info-value">{stockData.profile?.exchange || 'N/A'}</p>
                      </div>
                      <div className="info-item">
                        <p className="info-label">行業</p>
                        <p className="info-value">
                          {stockData.profile?.finnhubIndustry || 'N/A'}
                        </p>
                      </div>
                      <div className="info-item">
                        <p className="info-label">市值</p>
                        <p className="info-value">
                          ${((stockData.profile?.marketCapitalization || 0) / 1000).toFixed(2)}T
                        </p>
                      </div>
                      <div className="info-item">
                        <p className="info-label">國家</p>
                        <p className="info-value">{stockData.profile?.country || 'N/A'}</p>
                      </div>
                      <div className="info-item">
                        <p className="info-label">貨幣</p>
                        <p className="info-value">{stockData.profile?.currency || 'USD'}</p>
                      </div>
                      {stockData.profile?.weburl && (
                        <>
                          <div className="divider"></div>
                          <a
                            href={stockData.profile.weburl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="company-link"
                          >
                            🔗 公司官網
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* 交易信號分析 */}
                {stockData.technical && (
                  <SignalAnalysis 
                    technical={{
                      ...stockData.technical,
                      currentPrice: stockData.quote?.currentPrice
                    }} 
                  />
                )}

                {/* 進階圖表 */}
                {candleData.length > 0 && (
                  <AdvancedChart
                    symbol={stockData.symbol}
                    data={candleData}
                    ma50={stockData.technical?.ma50}
                    ma200={stockData.technical?.ma200}
                    macd={stockData.technical?.macd}
                    bollingerBands={stockData.technical?.bollingerBands}
                    signals={stockData.technical?.signals}
                  />
                )}

                {/* News Section */}
                {news.length > 0 && (
                  <div className="news-section">
                    <h2 className="section-title">
                      <Newspaper size={24} />
                      最新新聞
                    </h2>
                    <div className="news-grid">
                      {news.map((item, index) => (
                        <a
                          key={index}
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="news-card"
                        >
                          <div className="news-header">
                            <span className="news-source">{item.source}</span>
                            <span className="news-date">
                              {formatDate(item.datetime)}
                            </span>
                          </div>
                          <h3 className="news-title">{item.headline}</h3>
                          <p className="news-summary">{item.summary}</p>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI 分析 */}
                {stockData && !loading && (
                  <AIAnalysis 
                    symbol={stockData.symbol}
                    stockData={{
                      ...stockData,
                      news: news
                    }}
                  />
                )}
              </>
            )}
          </>
        ) : (
          // ✅ 模擬倉頁面
          <PortfolioPage />
        )}
      </div>
    </div>
  );
}

export default App;