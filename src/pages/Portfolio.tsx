import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Wallet, TrendingUp, Plus, RefreshCw } from 'lucide-react';
import PortfolioStats from '../components/PortfolioStats';
import HoldingsTable from '../components/HoldingsTable';
import AddHoldingModal from '../components/AddHoldingModal';
import PortfolioAnalysis from '../components/PortfolioAnalysis';

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
  change: number;
  change_percent: number;
  rsi?: number;
  trend?: string;
}

interface Portfolio {
  id: string;
  name: string;
  description: string;
  is_demo: boolean;
}

const PortfolioPage: React.FC = () => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // ✅ 測試用戶 ID（之後接 Supabase Auth）
  const userId = '550e8400-e29b-41d4-a716-446655440000';

  // 載入組合列表
  useEffect(() => {
    fetchPortfolios();
  }, []);

  // 自動選擇第一個組合
  useEffect(() => {
    if (portfolios.length > 0 && !selectedPortfolio) {
      setSelectedPortfolio(portfolios[0]);
    }
  }, [portfolios]);

  // 當選擇組合時，載入持倉
  useEffect(() => {
    if (selectedPortfolio) {
      fetchHoldings(selectedPortfolio.id);
    }
  }, [selectedPortfolio]);

  const fetchPortfolios = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/portfolios/user/${userId}`);
      setPortfolios(response.data.data);
    } catch (error) {
      console.error('獲取組合失敗:', error);
    }
  };

  const fetchHoldings = async (portfolioId: string) => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/holdings/portfolio/${portfolioId}`);
      setHoldings(response.data.data);
    } catch (error) {
      console.error('獲取持倉失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNewPortfolio = async () => {
    const name = prompt('組合名稱（例如：我嘅美股組合）');
    if (!name) return;

    try {
      await axios.post('http://localhost:5000/api/portfolios', {
        user_id: userId,
        name,
        description: '',
      });
      fetchPortfolios();
    } catch (error) {
      console.error('建立組合失敗:', error);
      alert('建立組合失敗');
    }
  };

  const deleteHolding = async (holdingId: string) => {
    if (!window.confirm('確定要刪除此持倉？')) return;

    try {
      await axios.delete(`http://localhost:5000/api/holdings/${holdingId}`);
      if (selectedPortfolio) {
        fetchHoldings(selectedPortfolio.id);
      }
    } catch (error) {
      console.error('刪除持倉失敗:', error);
      alert('刪除失敗');
    }
  };

  const handleAddSuccess = () => {
    setShowAddModal(false);
    if (selectedPortfolio) {
      fetchHoldings(selectedPortfolio.id);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Wallet size={32} />
            💼 我嘅投資組合
          </h1>
          <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
            管理持倉 · 追蹤盈虧 · AI 分析
          </p>
        </div>

        {/* 組合選擇 + 新增按鈕 */}
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          marginBottom: '2rem',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          {portfolios.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPortfolio(p)}
              style={{
                padding: '0.75rem 1.5rem',
                border: selectedPortfolio?.id === p.id ? '2px solid #3b82f6' : '1px solid #d1d5db',
                backgroundColor: selectedPortfolio?.id === p.id ? '#eff6ff' : 'white',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: selectedPortfolio?.id === p.id ? 'bold' : 'normal',
                color: selectedPortfolio?.id === p.id ? '#3b82f6' : '#374151',
              }}
            >
              {p.name} {p.is_demo && '🎮'}
            </button>
          ))}
          <button
            onClick={createNewPortfolio}
            style={{
              padding: '0.75rem 1.5rem',
              border: '1px dashed #3b82f6',
              backgroundColor: 'white',
              borderRadius: '8px',
              cursor: 'pointer',
              color: '#3b82f6',
              fontWeight: '500',
            }}
          >
            ➕ 新建組合
          </button>
        </div>

        {/* 組合統計 */}
        {selectedPortfolio && holdings.length > 0 && (
          <PortfolioStats holdings={holdings} />
        )}

        {/* 持倉列表 */}
        {selectedPortfolio && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                📊 持倉明細 ({holdings.length})
              </h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => selectedPortfolio && fetchHoldings(selectedPortfolio.id)}
                  disabled={loading}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#f3f4f6',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <RefreshCw size={16} className={loading ? 'spinner' : ''} />
                  更新
                </button>
                <button
                  onClick={() => setShowAddModal(true)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Plus size={16} />
                  新增持倉
                </button>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
                <p>載入中...</p>
              </div>
            ) : holdings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</p>
                <p style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  呢個組合暫時未有持倉
                </p>
                <p style={{ fontSize: '0.875rem' }}>
                  點擊「新增持倉」開始建立你嘅投資組合
                </p>
              </div>
            ) : (
              <HoldingsTable holdings={holdings} onDelete={deleteHolding} />
            )}
          </div>
        )}

        {/* ✅ AI 組合診斷（新增） */}
        {selectedPortfolio && holdings.length > 0 && (
          <PortfolioAnalysis 
            holdings={holdings} 
            portfolioId={selectedPortfolio.id} 
          />
        )}

        {/* 新增持倉 Modal */}
        {showAddModal && selectedPortfolio && (
          <AddHoldingModal
            portfolioId={selectedPortfolio.id}
            onClose={() => setShowAddModal(false)}
            onSuccess={handleAddSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default PortfolioPage;