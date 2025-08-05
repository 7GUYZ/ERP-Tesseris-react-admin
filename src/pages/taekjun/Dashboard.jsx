import React, { useEffect, useState } from 'react';
import { dashboardApi } from '../../api/auth/TaekjunAuth';
import { useNavigate } from 'react-router-dom';
import '../../styles/taekjun/Dashboard.css';

// 숫자 포맷팅 유틸리티 함수
const formatNumber = (value) => {
    if (value === undefined || value === null) return '0';
    return value.toLocaleString('ko-KR');
};

const StatCard = ({ title, value, subtitle }) => (
    <div className="dashboard-stat-card">
        <h3 className="stat-card-title">{title}</h3>
        <div className="stat-card-value">{formatNumber(value)}</div>
        {subtitle && <div className="stat-card-subtitle">{subtitle}</div>}
    </div>
);

const NoticeItem = ({ notice }) => {
    const navigate = useNavigate();
    
    const handleClick = () => {
        navigate(`/notice/update/${notice.noticeIndex}`);
    };

    return (
        <div className="dashboard-notice-item" onClick={handleClick} role="button" tabIndex={0}>
            <div className="notice-content">
                <span className="notice-title">{notice.noticeTitle}</span>
                <span className="notice-preview">{notice.noticeDesc}</span>
            </div>
            <span className="notice-date">{notice.createdAt}</span>
        </div>
    );
};

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await dashboardApi.getStatistics();
                console.log('대시보드 API 응답:', res);
                console.log('대시보드 데이터:', res.data);
                setStats(res.data.data || res.data);
            } catch (err) {
                console.error('대시보드 API 에러:', err);
                setError('대시보드 데이터를 불러오지 못했습니다.');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    // 핵심 지표 카드 컴포넌트
    const StatCard = ({ title, value, subtitle, color = '#3b7ddd' }) => (
        <div className="dashboard-stat-card" style={{ borderLeft: `4px solid ${color}` }}>
            <div className="stat-card-title">{title}</div>
            <div className="stat-card-value">{formatNumber(value)}</div>
            {subtitle && <div className="stat-card-subtitle">{subtitle}</div>}
        </div>
    );

    const handleMoreNotices = () => {
        navigate('/notice/list');
    };

    return (
        <div className="dashboard-root">
            <div className="dashboard-header">
                <h1 className="dashboard-title">대시보드</h1>
            </div>

            {loading ? (
                <div className="dashboard-loading">로딩 중...</div>
            ) : error ? (
                <div className="dashboard-error">{error}</div>
            ) : stats ? (
                <div className="dashboard-content">
                    {/* 상세 통계 섹션 */}
                    <section className="dashboard-section">
                        <h2 className="section-title">상세 통계</h2>
                        <div className="dashboard-detail-grid">
                            <div className="detail-card">
                                <h3>CM 현황</h3>
                                <div className="detail-item">
                                    <span>충전 CM:</span>
                                    <span>{formatNumber(stats?.chargedCmTotal || 0)}</span>
                                </div>
                                <div className="detail-item">
                                    <span>지급 CM:</span>
                                    <span>{formatNumber(stats?.companyPaidCmTotal || 0)}</span>
                                </div>
                                <div className="detail-item">
                                    <span>회수 CM:</span>
                                    <span>{formatNumber(stats?.companyCollectedCmTotal || 0)}</span>
                                </div>
                            </div>

                            <div className="detail-card">
                                <h3>사업자 현황</h3>
                                <div className="detail-item">
                                    <span>총 사업자:</span>
                                    <span>{formatNumber(stats?.businessManTotal || 0)}</span>
                                </div>
                                <div className="detail-item">
                                    <span>승인 가맹점:</span>
                                    <span>{formatNumber(stats?.approvedStoreTotal || 0)}</span>
                                </div>
                                <div className="detail-item">
                                    <span>대기 가맹점:</span>
                                    <span>{formatNumber(stats?.pendingStoreTotal || 0)}</span>
                                </div>
                            </div>

                            <div className="detail-card">
                                <h3>수수료 현황</h3>
                                <div className="detail-item">
                                    <span>사업자 수수료:</span>
                                    <span>{formatNumber(stats?.businessCmCommissionTotal || 0)}</span>
                                </div>
                                <div className="detail-item">
                                    <span>본사 CM Cash:</span>
                                    <span>{formatNumber(stats?.companyCmCashTotal || 0)}</span>
                                </div>
                                <div className="detail-item">
                                    <span>출금 완료:</span>
                                    <span>{formatNumber(stats?.withdrawalCompletedTotal || 0)}</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="dashboard-section">
                        <h2 className="section-title">핵심 지표</h2>
                        <div className="dashboard-stats-grid">
                            <StatCard
                                title="총 회원수"
                                value={stats?.userTotal || 0}
                                color="#10b981"
                            />
                            <StatCard
                                title="오늘 신규 가입"
                                value={stats?.userToday || 0}
                                color="#f59e0b"
                            />
                        </div>
                    </section>

                    <section className="dashboard-section">
                        <h2 className="section-title">QnA 현황</h2>
                        <div className="dashboard-stats-grid">
                            <StatCard
                                title="전체 QnA"
                                value={stats?.qnaTotal || 0}
                            />
                            <StatCard
                                title="답변 완료"
                                value={stats?.qnaAnswered || 0}
                            />
                            <StatCard
                                title="미답변"
                                value={stats?.qnaUnanswered || 0}
                            />
                        </div>
                    </section>

                    <section className="dashboard-section">
                        <div className="dashboard-section-header">
                            <h2 className="section-title">최근 공지사항</h2>
                            <button 
                                className="dashboard-more-btn"
                                onClick={handleMoreNotices}
                            >
                                더보기
                            </button>
                        </div>
                        <div className="dashboard-notice-list">
                            {stats?.recentNotices && stats.recentNotices.length > 0 ? (
                                stats.recentNotices.map(notice => (
                                    <NoticeItem key={notice.noticeIndex} notice={notice} />
                                ))
                            ) : (
                                <div className="dashboard-notice-empty">최근 공지사항이 없습니다.</div>
                            )}
                        </div>
                    </section>
                </div>
            ) : null}
        </div>
    );
};

export default Dashboard; 