import React, { useEffect, useState } from 'react';
import { dashboardApi } from '../../api/auth/TaekjunAuth';
import { useNavigate } from 'react-router-dom';
import '../../styles/taekjun/Dashboard.css';
import QnaResponseRateModal from '../../components/taekjun/QnaResponseRateModal';

// 숫자 포맷팅 유틸리티 함수
const formatNumber = (value) => {
    if (value === undefined || value === null) return '0';
    return value.toLocaleString('ko-KR');
};

const StatCard = ({ title, value, subtitle }) => (
    <div className="dashboard-stat-card-jtj">
        <h3 className="stat-card-title-jtj">{title}</h3>
        <div className="stat-card-value-jtj">{formatNumber(value)}</div>
        {subtitle && <div className="stat-card-subtitle-jtj">{subtitle}</div>}
    </div>
);

const NoticeItem = ({ notice }) => {
    const navigate = useNavigate();
    
    const handleClick = () => {
        navigate(`/notice/update/${notice.noticeIndex}`);
    };

    return (
        <div className="dashboard-notice-item-jtj" onClick={handleClick} role="button" tabIndex={0}>
            <div className="notice-content-jtj">
                <span className="notice-title-jtj">{notice.noticeTitle}</span>
                <span className="notice-preview-jtj">{notice.noticeDesc}</span>
            </div>
            <span className="notice-date-jtj">{notice.createdAt}</span>
        </div>
    );
};

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [qnaPermission, setQnaPermission] = useState(false);
    const [showQnaModal, setShowQnaModal] = useState(false);
    const navigate = useNavigate();

    // QnA 권한 체크 (독립적으로 처리)
    useEffect(() => {
        const checkQnaPermission = () => {
            try {
                const storedAuthority = localStorage.getItem("user-authority");
                if (storedAuthority) {
                    const authorityList = JSON.parse(storedAuthority);
                    // QnA는 menuIndex: 5, programIndex: 26
                    const hasQnaPermission = authorityList.some(
                        auth => auth.menuIndex === 5 && auth.programIndex === 26
                    );
                    setQnaPermission(hasQnaPermission);
                } else {
                    setQnaPermission(false);
                }
            } catch (error) {
                console.error('QnA 권한 체크 오류:', error);
                setQnaPermission(false);
            }
        };

        checkQnaPermission();
        
        // 권한 변경 감지를 위한 이벤트 리스너
        const handleAuthorityUpdate = () => {
            checkQnaPermission();
        };

        window.addEventListener('authority-updated', handleAuthorityUpdate);
        
        return () => {
            window.removeEventListener('authority-updated', handleAuthorityUpdate);
        };
    }, []);

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
        <div className="dashboard-stat-card-jtj" style={{ borderLeft: `4px solid ${color}` }}>
            <div className="stat-card-title-jtj">{title}</div>
            <div className="stat-card-value-jtj">{formatNumber(value)}</div>
            {subtitle && <div className="stat-card-subtitle-jtj">{subtitle}</div>}
        </div>
    );

    const handleMoreNotices = () => {
        navigate('/notice/list');
    };

    const handleQnaResponseRateClick = () => {
        setShowQnaModal(true);
    };



    return (
        <div className="dashboard-root-jtj">
            <div className="dashboard-header-jtj">
                <h1 className="dashboard-title-jtj">대시보드</h1>
            </div>

            {loading ? (
                <div className="dashboard-loading-jtj">로딩 중...</div>
            ) : error ? (
                <div className="dashboard-error-jtj">{error}</div>
            ) : stats ? (
                <div className="dashboard-content-jtj">
                    {/* 상세 통계 섹션 */}
                    <section className="dashboard-section">
                        <h2 className="section-title">상세 통계</h2>
                        <div className="dashboard-detail-grid">
                            <div className="detail-card">
                                <h3>TS 현황</h3>
                                <div className="detail-item">
                                    <span>충전 TS:</span>
                                    <span>{formatNumber(stats?.chargedCmTotal || 0)}</span>
                                </div>
                                <div className="detail-item">
                                    <span>지급 TS:</span>
                                    <span>{formatNumber(stats?.companyPaidCmTotal || 0)}</span>
                                </div>
                                <div className="detail-item">
                                    <span>회수 TS:</span>
                                    <span>{formatNumber(stats?.companyCollectedCmTotal || 0)}</span>
                                </div>
                            </div>

                            <div className="detail-card-jtj">
                                <h3>사업자 현황</h3>
                                <div className="detail-item-jtj">
                                    <span>총 사업자:</span>
                                    <span>{formatNumber(stats?.businessManTotal || 0)}</span>
                                </div>
                                <div className="detail-item-jtj">
                                    <span>승인 가맹점:</span>
                                    <span>{formatNumber(stats?.approvedStoreTotal || 0)}</span>
                                </div>
                                <div className="detail-item-jtj">
                                    <span>대기 가맹점:</span>
                                    <span>{formatNumber(stats?.pendingStoreTotal || 0)}</span>
                                </div>
                            </div>

                            <div className="detail-card-jtj">
                                <h3>수수료 현황</h3>
                                <div className="detail-item-jtj">
                                    <span>사업자 수수료:</span>
                                    <span>{formatNumber(stats?.businessCmCommissionTotal || 0)}</span>
                                </div>
                                <div className="detail-item">
                                    <span>본사 TS Cash:</span>
                                    <span>{formatNumber(stats?.companyCmCashTotal || 0)}</span>
                                </div>
                                <div className="detail-item-jtj">
                                    <span>출금 완료:</span>
                                    <span>{formatNumber(stats?.withdrawalCompletedTotal || 0)}</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="dashboard-section-jtj">
                        <h2 className="section-title-jtj">핵심 지표</h2>
                        <div className="dashboard-stats-grid-jtj">
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

                    {qnaPermission && (
                        <section className="dashboard-section-jtj">
                            <h2 className="section-title-jtj">QnA 현황</h2>
                            <div className="dashboard-stats-grid-jtj">
                                <StatCard
                                    title="전체 QnA"
                                    value={stats?.qnaTotal || 0}
                                    color="#3b7ddd"
                                />
                                <StatCard
                                    title="답변 완료"
                                    value={stats?.qnaAnswered || 0}
                                    color="#10b981"
                                />
                                <StatCard
                                    title="미답변"
                                    value={stats?.qnaUnanswered || 0}
                                    color="#ef4444"
                                />
                            </div>
                            <div className="dashboard-qna-summary-jtj">
                                <div 
                                    className="qna-summary-item-jtj clickable" 
                                    onClick={handleQnaResponseRateClick}
                                    role="button"
                                    tabIndex={0}
                                >
                                    <span className="qna-label-jtj">답변률:</span>
                                    <span className="qna-value-jtj">
                                        {stats?.qnaTotal > 0 
                                            ? Math.round((stats?.qnaAnswered / stats?.qnaTotal) * 100) 
                                            : 0}%
                                    </span>
                                    <span className="qna-click-hint-jtj">클릭하여 상세보기</span>
                                </div>
                            </div>
                        </section>
                    )}

                    <section className="dashboard-section-jtj">
                        <div className="dashboard-section-header-jtj">
                            <h2 className="section-title-jtj">최근 공지사항</h2>
                            <button 
                                className="dashboard-more-btn-jtj"
                                onClick={handleMoreNotices}
                            >
                                더보기
                            </button>
                        </div>
                        <div className="dashboard-notice-list-jtj">
                            {stats?.recentNotices && stats.recentNotices.length > 0 ? (
                                stats.recentNotices.map(notice => (
                                    <NoticeItem key={notice.noticeIndex} notice={notice} />
                                ))
                            ) : (
                                <div className="dashboard-notice-empty-jtj">최근 공지사항이 없습니다.</div>
                            )}
                        </div>
                    </section>
                </div>
            ) : null}
            
            {/* QnA 응답률 모달 */}
            <QnaResponseRateModal
                isOpen={showQnaModal}
                onClose={() => setShowQnaModal(false)}
                qnaData={{
                    qnaTotal: stats?.qnaTotal || 0,
                    qnaAnswered: stats?.qnaAnswered || 0,
                    qnaUnanswered: stats?.qnaUnanswered || 0
                }}
            />
        </div>
    );
};

export default Dashboard; 