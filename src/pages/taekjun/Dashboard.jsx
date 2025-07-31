import React, { useEffect, useState } from 'react';
import { dashboardApi } from '../../api/auth/TaekjunAuth';
import '../../styles/taekjun/Dashboard.css';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import DashboardModal from '../../components/ui/taekjun/DashboardModal';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalData, setModalData] = useState({
    isOpen: false,
    title: '',
    data: [],
    chartType: 'bar'
  });

  // 차트 색상 배열
  const chartColors = [
    '#3b7ddd', // 파란색
    '#10b981', // 초록색
    '#f59e0b', // 주황색
    '#ef4444', // 빨간색
    '#8b5cf6', // 보라색
    '#06b6d4', // 청록색
    '#f97316', // 주황색
    '#ec4899', // 분홍색
  ];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await dashboardApi.getStatistics();
        setStats(res.data.data || res.data);
      } catch (err) {
        setError('대시보드 데이터를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // 모달 열기 함수
  const openModal = (title, data, chartType = 'bar') => {
    setModalData({
      isOpen: true,
      title,
      data,
      chartType
    });
  };

  // 모달 닫기 함수
  const closeModal = () => {
    setModalData({
      isOpen: false,
      title: '',
      data: [],
      chartType: 'bar'
    });
  };

  // 카드 클릭 핸들러
  const handleCardClick = (groupTitle, key) => {
    const keyName = formatKey(key);
    const value = stats[key];
    
    const chartData = [
      { name: '전체', value: stats[`${key.replace(/Total|Yesterday|Today$/, 'Total')}`] || 0 },
      { name: '어제', value: stats[`${key.replace(/Total|Yesterday|Today$/, 'Yesterday')}`] || 0 },
      { name: '오늘', value: stats[`${key.replace(/Total|Yesterday|Today$/, 'Today')}`] || 0 }
    ];

    openModal(`${groupTitle} - ${keyName}`, chartData, 'bar');
  };

  // 그룹 제목 클릭 핸들러
  const handleGroupTitleClick = (groupTitle) => {
    let chartData = [];
    
    switch (groupTitle) {
      case 'CM 관련':
        chartData = [
          { name: '충전 CM', value: stats?.chargedCmTotal || 0 },
          { name: '지급 CM', value: stats?.companyPaidCmTotal || 0 },
          { name: '회수 CM', value: stats?.companyCollectedCmTotal || 0 },
          { name: '선물 CM', value: stats?.giftCmTotal || 0 }
        ];
        break;
      case '수수료 관련':
        chartData = [
          { name: '사업자 CM 수수료', value: stats?.businessCmCommissionTotal || 0 },
          { name: '본사 CM Cash', value: stats?.companyCmCashTotal || 0 }
        ];
        break;
      case '가맹점/사업자':
        chartData = [
          { name: '승인된 가맹점', value: stats?.approvedStoreTotal || 0 },
          { name: '사업자', value: stats?.businessManTotal || 0 },
          { name: '대기중인 가맹점', value: stats?.pendingStoreTotal || 0 }
        ];
        break;
      case '기타':
        chartData = [
          { name: '출금 신청 완료', value: stats?.withdrawalCompletedTotal || 0 }
        ];
        break;
      default:
        return;
    }

    openModal(`${groupTitle} 전체 통계`, chartData, 'bar');
  };

  // key를 보기 좋게 변환
  const formatKey = (key) => {
    // 카멜케이스를 한글로 바꾸거나, _를 띄어쓰기로 바꿔줌
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/\bCM\b/g, 'CM')
      .replace(/\bTotal\b/g, '전체 총량')
      .replace(/\bYesterday\b/g, '어제 총량')
      .replace(/\bToday\b/g, '오늘 총량')
      .replace(/\bCommission\b/g, '수수료')
      .replace(/\bGift\b/g, '선물')
      .replace(/\bWithdrawal\b/g, '출금')
      .replace(/\bBusiness\b/g, '사업자')
      .replace(/\bCompany\b/g, '본사')
      .replace(/\bPaid\b/g, '지급')
      .replace(/\bCollected\b/g, '회수')
      .replace(/\bApproved\b/g, '승인')
      .replace(/\bPending\b/g, '대기')
      .replace(/\bStore\b/g, '가맹점')
      .replace(/\bMan\b/g, '사업자')
      .replace(/\bCompleted\b/g, '완료')
      .trim();
  };

  // 배열을 원하는 크기로 나누는 함수
  const chunkArray = (array, size) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  };

  const groups = [
    {
      title: 'CM 관련',
      keys: [
        'chargedCmTotal', 'chargedCmYesterday', 'chargedCmToday',
        'companyPaidCmTotal', 'companyPaidCmYesterday', 'companyPaidCmToday',
        'companyCollectedCmTotal', 'companyCollectedCmYesterday', 'companyCollectedCmToday',
        'giftCmTotal', 'giftCmYesterday', 'giftCmToday'
      ]
    },
    {
      title: '수수료 관련',
      keys: [
        'businessCmCommissionTotal', 'businessCmCommissionYesterday', 'businessCmCommissionToday',
        'companyCmCashTotal', 'companyCmCashYesterday', 'companyCmCashToday'
      ]
    },
    {
      title: '가맹점/사업자',
      keys: [
        'approvedStoreTotal', 'approvedStoreYesterday', 'approvedStoreToday',
        'businessManTotal', 'businessManYesterday', 'businessManToday',
        'pendingStoreTotal'
      ]
    },
    {
      title: '기타',
      keys: [
        'withdrawalCompletedTotal', 'withdrawalCompletedYesterday', 'withdrawalCompletedToday'
      ]
    }
  ];

  return (
    <div className="dashboard-root">
      <div className="dashboard-title">대시보드 통계</div>
      <div className="dashboard-container">
        {loading ? (
          <div style={{textAlign:'center',padding:'60px',color:'#3b7ddd'}}>로딩 중...</div>
        ) : error ? (
          <div style={{textAlign:'center',padding:'60px',color:'#ef4444'}}>{error}</div>
        ) : stats ? (
          groups.map(group => (
            <section key={group.title} className="dashboard-group">
              <h2 className="dashboard-group-title" onClick={() => handleGroupTitleClick(group.title)}>{group.title}</h2>
              
              {/* CM 관련과 수수료 관련은 3개씩, 가맹점/사업자는 2개씩, 기타는 1개씩 나누어서 렌더링 */}
              {group.title === 'CM 관련' || group.title === '수수료 관련' ? (
                chunkArray(group.keys, 3).map((chunk, chunkIndex) => (
                  <div key={chunkIndex} className="dashboard-grid" style={{ marginBottom: chunkIndex < chunkArray(group.keys, 3).length - 1 ? '16px' : '0' }}>
                    {chunk.map(key => (
                      stats && stats[key] !== undefined && (
                        <div className="dashboard-card" key={key} onClick={() => handleCardClick(group.title, key)}>
                          <div className="card-label">{formatKey(key)}</div>
                          <div className="card-value">
                            {typeof stats[key] === 'number' ? stats[key].toLocaleString() : String(stats[key])}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                ))
              ) : group.title === '가맹점/사업자' ? (
                chunkArray(group.keys, 3).map((chunk, chunkIndex) => (
                  <div key={chunkIndex} className="dashboard-grid" style={{ marginBottom: chunkIndex < chunkArray(group.keys, 3).length - 1 ? '16px' : '0' }}>
                    {chunk.map(key => (
                      stats && stats[key] !== undefined && (
                        <div className="dashboard-card" key={key} onClick={() => handleCardClick(group.title, key)}>
                          <div className="card-label">{formatKey(key)}</div>
                          <div className="card-value">
                            {typeof stats[key] === 'number' ? stats[key].toLocaleString() : String(stats[key])}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                ))
              ) : group.title === '기타' ? (
                chunkArray(group.keys, 3).map((chunk, chunkIndex) => (
                  <div key={chunkIndex} className="dashboard-grid" style={{ marginBottom: chunkIndex < chunkArray(group.keys, 3).length - 1 ? '16px' : '0' }}>
                    {chunk.map(key => (
                      stats && stats[key] !== undefined && (
                        <div className="dashboard-card" key={key} onClick={() => handleCardClick(group.title, key)}>
                          <div className="card-label">{formatKey(key)}</div>
                          <div className="card-value">
                            {typeof stats[key] === 'number' ? stats[key].toLocaleString() : String(stats[key])}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                ))
              ) : (
                /* 기본 렌더링 (사용되지 않음) */
                <div className="dashboard-grid">
                  {group.keys.map(key => (
                    stats && stats[key] !== undefined && (
                      <div className="dashboard-card" key={key}>
                        <div className="card-label">{formatKey(key)}</div>
                        <div className="card-value">
                          {typeof stats[key] === 'number' ? stats[key].toLocaleString() : String(stats[key])}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              )}
              
            </section>
          ))
        ) : null}
      </div>
      <DashboardModal
        isOpen={modalData.isOpen}
        onClose={closeModal}
        title={modalData.title}
        data={modalData.data}
        chartType={modalData.chartType}
      />
    </div>
  );
};

export default Dashboard; 