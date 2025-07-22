import React, { useEffect, useState } from 'react';
import { dashboardApi } from '../../api/auth/TaekjunAuth';
import '../../styles/taekjun/Dashboard.css';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        'commissionRevenueTotal', 'commissionRevenueYesterday', 'commissionRevenueToday',
        'companyCashCommissionTotal', 'companyCashCommissionYesterday', 'companyCashCommissionToday',
        'businessCashCommissionTotal', 'businessCashCommissionYesterday', 'businessCashCommissionToday',
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

  // 차트 구성 배열
  const chartConfigs = [
    {
      title: '충전 CM 차트',
      data: [
        { name: '전체', value: stats?.chargedCmTotal ?? 0 },
        { name: '어제', value: stats?.chargedCmYesterday ?? 0 },
        { name: '오늘', value: stats?.chargedCmToday ?? 0 },
      ],
    },
    {
      title: '지급 CM 차트',
      data: [
        { name: '전체', value: stats?.companyPaidCmTotal ?? 0 },
        { name: '어제', value: stats?.companyPaidCmYesterday ?? 0 },
        { name: '오늘', value: stats?.companyPaidCmToday ?? 0 },
      ],
    },
    {
      title: '회수 CM 차트',
      data: [
        { name: '전체', value: stats?.companyCollectedCmTotal ?? 0 },
        { name: '어제', value: stats?.companyCollectedCmYesterday ?? 0 },
        { name: '오늘', value: stats?.companyCollectedCmToday ?? 0 },
      ],
    },
    {
      title: '선물 CM 차트',
      data: [
        { name: '전체', value: stats?.giftCmTotal ?? 0 },
        { name: '어제', value: stats?.giftCmYesterday ?? 0 },
        { name: '오늘', value: stats?.giftCmToday ?? 0 },
      ],
    },
  ];

  // 수수료 관련 차트 구성 배열
  const chartConfigsFee = [
    {
      title: '수수료 총액 차트',
      data: [
        { name: '전체', value: stats?.commissionRevenueTotal ?? 0 },
        { name: '어제', value: stats?.commissionRevenueYesterday ?? 0 },
        { name: '오늘', value: stats?.commissionRevenueToday ?? 0 },
      ],
    },
    {
      title: '본사 Cash 수수료 차트',
      data: [
        { name: '전체', value: stats?.companyCashCommissionTotal ?? 0 },
        { name: '어제', value: stats?.companyCashCommissionYesterday ?? 0 },
        { name: '오늘', value: stats?.companyCashCommissionToday ?? 0 },
      ],
    },
    {
      title: '사업자 Cash 수수료 차트',
      data: [
        { name: '전체', value: stats?.businessCashCommissionTotal ?? 0 },
        { name: '어제', value: stats?.businessCashCommissionYesterday ?? 0 },
        { name: '오늘', value: stats?.businessCashCommissionToday ?? 0 },
      ],
    },
    {
      title: '사업자 CM 수수료 차트',
      data: [
        { name: '전체', value: stats?.businessCmCommissionTotal ?? 0 },
        { name: '어제', value: stats?.businessCmCommissionYesterday ?? 0 },
        { name: '오늘', value: stats?.businessCmCommissionToday ?? 0 },
      ],
    },
    {
      title: '본사 CM Cash 차트',
      data: [
        { name: '전체', value: stats?.companyCmCashTotal ?? 0 },
        { name: '어제', value: stats?.companyCmCashYesterday ?? 0 },
        { name: '오늘', value: stats?.companyCmCashToday ?? 0 },
      ],
    },
  ];

  // 가맹점/사업자 차트 구성 배열
  const chartConfigsStore = [
    {
      title: '승인된 가맹점 차트',
      data: [
        { name: '전체', value: stats?.approvedStoreTotal ?? 0 },
        { name: '어제', value: stats?.approvedStoreYesterday ?? 0 },
        { name: '오늘', value: stats?.approvedStoreToday ?? 0 },
      ],
    },
    {
      title: '사업자 차트',
      data: [
        { name: '전체', value: stats?.businessManTotal ?? 0 },
        { name: '어제', value: stats?.businessManYesterday ?? 0 },
        { name: '오늘', value: stats?.businessManToday ?? 0 },
      ],
    },
  ];

  // 기타 차트 구성 배열
  const chartConfigsOther = [
    {
      title: '출금 신청 완료 차트',
      data: [
        { name: '전체', value: stats?.withdrawalCompletedTotal ?? 0 },
        { name: '어제', value: stats?.withdrawalCompletedYesterday ?? 0 },
        { name: '오늘', value: stats?.withdrawalCompletedToday ?? 0 },
      ],
    },
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
              <h2 className="dashboard-group-title">{group.title}</h2>
              
              {/* CM 관련과 수수료 관련은 3개씩, 가맹점/사업자는 2개씩, 기타는 1개씩 나누어서 렌더링 */}
              {group.title === 'CM 관련' || group.title === '수수료 관련' ? (
                chunkArray(group.keys, 3).map((chunk, chunkIndex) => (
                  <div key={chunkIndex} className="dashboard-grid" style={{ marginBottom: chunkIndex < chunkArray(group.keys, 3).length - 1 ? '16px' : '0' }}>
                    {chunk.map(key => (
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
                ))
              ) : group.title === '가맹점/사업자' ? (
                chunkArray(group.keys, 3).map((chunk, chunkIndex) => (
                  <div key={chunkIndex} className="dashboard-grid" style={{ marginBottom: chunkIndex < chunkArray(group.keys, 3).length - 1 ? '16px' : '0' }}>
                    {chunk.map(key => (
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
                ))
              ) : group.title === '기타' ? (
                chunkArray(group.keys, 3).map((chunk, chunkIndex) => (
                  <div key={chunkIndex} className="dashboard-grid" style={{ marginBottom: chunkIndex < chunkArray(group.keys, 3).length - 1 ? '16px' : '0' }}>
                    {chunk.map(key => (
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
              
              {group.title === 'CM 관련' && chartConfigs.length > 0 && (
                chartConfigs.map((cfg, index) => (
                  <div key={cfg.title} className="dashboard-chart-row">
                    <span className="dashboard-chart-label">{cfg.title}</span>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart
                        data={cfg.data}
                        margin={{ top: 12, right: 16, left: 0, bottom: 12 }}
                        barCategoryGap={24}
                        style={{ fontFamily: 'Pretendard, sans-serif', background: '#f7faff', borderRadius: 16 }}
                      >
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 14, fill: '#3b7ddd', fontWeight: 700 }}
                          axisLine={{ stroke: '#e5eaf2' }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: '#222e3c', fontWeight: 600 }}
                          axisLine={{ stroke: '#e5eaf2' }}
                          tickLine={false}
                          tickFormatter={value => {
                            if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(2) + 'B';
                            if (value >= 1_000_000) return (value / 1_000_000).toFixed(2) + 'M';
                            if (value >= 1_000) return (value / 1_000).toFixed(2) + 'K';
                            return value;
                          }}
                        />
                        <Tooltip
                          contentStyle={{ background: '#fff', border: '1px solid #e5eaf2', borderRadius: 8, fontSize: 13, color: '#222e3c' }}
                          cursor={{ fill: '#e5eaf2' }}
                        />
                        <Legend
                          verticalAlign="top"
                          height={24}
                          iconType="rect"
                          wrapperStyle={{ fontSize: 13, color: '#3b7ddd', fontWeight: 600 }}
                        />
                        <Bar
                          dataKey="value"
                          fill={chartColors[index % chartColors.length]}
                          radius={[8, 8, 0, 0]}
                          label={{ position: 'top', fill: '#222e3c', fontWeight: 700, fontSize: 12 }}
                          barSize={24}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ))
              )}
              {group.title === '수수료 관련' && chartConfigsFee.length > 0 && (
                chartConfigsFee.map((cfg, index) => (
                  <div key={cfg.title} className="dashboard-chart-row">
                    <span className="dashboard-chart-label">{cfg.title}</span>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart
                        data={cfg.data}
                        margin={{ top: 12, right: 16, left: 0, bottom: 12 }}
                        barCategoryGap={24}
                        style={{ fontFamily: 'Pretendard, sans-serif', background: '#f7faff', borderRadius: 16 }}
                      >
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 14, fill: '#3b7ddd', fontWeight: 700 }}
                          axisLine={{ stroke: '#e5eaf2' }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: '#222e3c', fontWeight: 600 }}
                          axisLine={{ stroke: '#e5eaf2' }}
                          tickLine={false}
                          tickFormatter={value => {
                            if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(2) + 'B';
                            if (value >= 1_000_000) return (value / 1_000_000).toFixed(2) + 'M';
                            if (value >= 1_000) return (value / 1_000).toFixed(2) + 'K';
                            return value;
                          }}
                        />
                        <Tooltip
                          contentStyle={{ background: '#fff', border: '1px solid #e5eaf2', borderRadius: 8, fontSize: 13, color: '#222e3c' }}
                          cursor={{ fill: '#e5eaf2' }}
                        />
                        <Legend
                          verticalAlign="top"
                          height={24}
                          iconType="rect"
                          wrapperStyle={{ fontSize: 13, color: '#3b7ddd', fontWeight: 600 }}
                        />
                        <Bar
                          dataKey="value"
                          fill={chartColors[(index + 4) % chartColors.length]}
                          radius={[8, 8, 0, 0]}
                          label={{ position: 'top', fill: '#222e3c', fontWeight: 700, fontSize: 12 }}
                          barSize={24}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ))
              )}
              {group.title === '가맹점/사업자' && chartConfigsStore.length > 0 && (
                chartConfigsStore.map((cfg, index) => (
                  <div key={cfg.title} className="dashboard-chart-row">
                    <span className="dashboard-chart-label">{cfg.title}</span>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart
                        data={cfg.data}
                        margin={{ top: 12, right: 16, left: 0, bottom: 12 }}
                        barCategoryGap={24}
                        style={{ fontFamily: 'Pretendard, sans-serif', background: '#f7faff', borderRadius: 16 }}
                      >
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 14, fill: '#3b7ddd', fontWeight: 700 }}
                          axisLine={{ stroke: '#e5eaf2' }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: '#222e3c', fontWeight: 600 }}
                          axisLine={{ stroke: '#e5eaf2' }}
                          tickLine={false}
                          tickFormatter={value => {
                            if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(2) + 'B';
                            if (value >= 1_000_000) return (value / 1_000_000).toFixed(2) + 'M';
                            if (value >= 1_000) return (value / 1_000).toFixed(2) + 'K';
                            return value;
                          }}
                        />
                        <Tooltip
                          contentStyle={{ background: '#fff', border: '1px solid #e5eaf2', borderRadius: 8, fontSize: 13, color: '#222e3c' }}
                          cursor={{ fill: '#e5eaf2' }}
                        />
                        <Legend
                          verticalAlign="top"
                          height={24}
                          iconType="rect"
                          wrapperStyle={{ fontSize: 13, color: '#3b7ddd', fontWeight: 600 }}
                        />
                        <Bar
                          dataKey="value"
                          fill={chartColors[(index + 9) % chartColors.length]}
                          radius={[8, 8, 0, 0]}
                          label={{ position: 'top', fill: '#222e3c', fontWeight: 700, fontSize: 12 }}
                          barSize={24}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ))
              )}
              {group.title === '기타' && chartConfigsOther.length > 0 && (
                chartConfigsOther.map((cfg, index) => (
                  <div key={cfg.title} className="dashboard-chart-row">
                    <span className="dashboard-chart-label">{cfg.title}</span>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart
                        data={cfg.data}
                        margin={{ top: 12, right: 16, left: 0, bottom: 12 }}
                        barCategoryGap={24}
                        style={{ fontFamily: 'Pretendard, sans-serif', background: '#f7faff', borderRadius: 16 }}
                      >
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 14, fill: '#3b7ddd', fontWeight: 700 }}
                          axisLine={{ stroke: '#e5eaf2' }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: '#222e3c', fontWeight: 600 }}
                          axisLine={{ stroke: '#e5eaf2' }}
                          tickLine={false}
                          tickFormatter={value => {
                            if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(2) + 'B';
                            if (value >= 1_000_000) return (value / 1_000_000).toFixed(2) + 'M';
                            if (value >= 1_000) return (value / 1_000).toFixed(2) + 'K';
                            return value;
                          }}
                        />
                        <Tooltip
                          contentStyle={{ background: '#fff', border: '1px solid #e5eaf2', borderRadius: 8, fontSize: 13, color: '#222e3c' }}
                          cursor={{ fill: '#e5eaf2' }}
                        />
                        <Legend
                          verticalAlign="top"
                          height={24}
                          iconType="rect"
                          wrapperStyle={{ fontSize: 13, color: '#3b7ddd', fontWeight: 600 }}
                        />
                        <Bar
                          dataKey="value"
                          fill={chartColors[(index + 11) % chartColors.length]}
                          radius={[8, 8, 0, 0]}
                          label={{ position: 'top', fill: '#222e3c', fontWeight: 700, fontSize: 12 }}
                          barSize={24}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ))
              )}
            </section>
          ))
        ) : null}
      </div>
    </div>
  );
};

export default Dashboard; 