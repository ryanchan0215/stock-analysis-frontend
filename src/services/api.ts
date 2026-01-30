import axios from 'axios';

// Debug logs
console.log('🔍 Environment:', import.meta.env.MODE);
console.log('🔍 VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('🔍 All env vars:', import.meta.env);

const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://localhost:5000/api';

console.log('🔍 API_BASE_URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 類型定義
export interface StockQuote {
  symbol: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  volume: number;
  timestamp: number;
}

export interface MACD {
  macd: number;
  signal: number;
  histogram: number;
}

export interface BollingerBands {
  upper: number;
  middle: number;
  lower: number;
}

export interface Signal {
  type: 'buy' | 'sell';
  indicator: string;
  reason: string;
  strength: 'strong' | 'medium' | 'weak';
  value: string;
}

export interface TechnicalIndicators {
  rsi: number;
  rsiLevel: {
    level: string;
    signal: string;
  };
  ma50: number;
  ma200: number;
  trend: string;
  volatility: number;
  currentPrice: number;
  dataPoints: number;
  macd: MACD | null;
  bollingerBands: BollingerBands | null;
  signals: Signal[];
}

export interface CompanyProfile {
  name: string;
  country: string;
  currency: string;
  exchange: string;
  finnhubIndustry: string;
  marketCapitalization: number;
  weburl: string;
  logo?: string;
}

export interface StockData {
  symbol: string;
  quote: StockQuote;
  profile: CompanyProfile;
  technical: TechnicalIndicators;
}

export interface SearchResult {
  symbol: string;
  name: string;
  type: string;
  exchange: string;
  region: string;
}

export interface NewsItem {
  headline: string;
  summary: string;
  source: string;
  url: string;
  datetime: string;
}

export interface CandleData {
  date: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// API 方法
export const stockAPI = {
  // 獲取股票報價
  getQuote: async (symbol: string): Promise<StockData> => {
    const response = await api.get(`/stocks/quote/${symbol}`);
    return response.data.data;
  },

  // 搜尋股票
  searchStock: async (query: string): Promise<SearchResult[]> => {
    const response = await api.get(`/stocks/search`, {
      params: { q: query },
    });
    return response.data.data;
  },

  // 獲取新聞
  getNews: async (symbol: string): Promise<NewsItem[]> => {
    const response = await api.get(`/stocks/news/${symbol}`);
    return response.data.data;
  },

  // 獲取 K 線數據
  getCandles: async (symbol: string, days: number = 60): Promise<CandleData[]> => {
    const response = await api.get(`/stocks/candles/${symbol}`, {
      params: { days },
    });
    return response.data.data.candles;
  },
};

export default api;