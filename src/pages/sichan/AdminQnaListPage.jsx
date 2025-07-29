import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/sichan/AdminQnaListPage.css';

const AdminQnaListPage = () => {
    const navigate = useNavigate();
    const [qnaList, setQnaList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchType, setSearchType] = useState('title');
    const [searchKeyword, setSearchKeyword] = useState('');

    useEffect(() => {
        fetchQnaList();
    }, []);

    const fetchQnaList = async () => {
        try {
            const token = localStorage.getItem('access-token');
            if (!token) {
                setError('인증 토큰이 없습니다. 다시 로그인해주세요.');
                setLoading(false);
                return;
            }

            let url = 'http://localhost:19091/api/sichan/qna/admin/list';
            const params = new URLSearchParams();
            
            if (searchKeyword.trim()) {
                params.append('searchType', searchType);
                params.append('searchKeyword', searchKeyword);
                url += '?' + params.toString();
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setQnaList(data);
            } else if (response.status === 401) {
                setError('인증이 만료되었습니다. 다시 로그인해주세요.');
            } else {
                setError('QnA 목록을 불러오는데 실패했습니다.');
            }
        } catch (error) {
            console.error('QnA 목록 조회 오류:', error);
            setError('QnA 목록을 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setLoading(true);
        fetchQnaList();
    };

    const formatDate = (dateString) => {
        if (!dateString) return '날짜 없음';
        
        try {
            console.log('날짜 파싱 시도:', dateString, '타입:', typeof dateString);
            
            let date;
            
            // 문자열인 경우 다양한 형식 시도
            if (typeof dateString === 'string') {
                // ISO 형식 (2024-01-15T14:30:00)
                if (dateString.includes('T')) {
                    date = new Date(dateString);
                }
                // 한국 형식 (2024-01-15 14:30:00)
                else if (dateString.includes('-') && dateString.includes(':')) {
                    date = new Date(dateString.replace(' ', 'T'));
                }
                // 기타 형식
                else {
                    date = new Date(dateString);
                }
            } else {
                date = new Date(dateString);
            }
            
            // Invalid Date 체크
            if (isNaN(date.getTime())) {
                console.warn('Invalid date string:', dateString);
                return '날짜 형식 오류';
            }
            
            const formatted = date.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
            
            console.log('날짜 파싱 성공:', dateString, '→', formatted);
            return formatted;
            
        } catch (error) {
            console.error('Date formatting error:', error, 'for dateString:', dateString);
            return '날짜 형식 오류';
        }
    };

    const handleQnaClick = (qnaIndex) => {
        navigate(`/admin/sichan/qna/detail/${qnaIndex}`);
    };

    if (loading) {
        return (
            <div className="admin-qna-list-container">
                <div className="loading">QnA 목록을 불러오는 중...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="admin-qna-list-container">
                <div className="error">{error}</div>
            </div>
        );
    }

    return (
        <div className="admin-qna-list-container">
            <div className="admin-qna-list-header">
                <h1>QnA 관리</h1>
                <div className="search-section">
                    <form onSubmit={handleSearch} className="search-form">
                        <select
                            value={searchType}
                            onChange={(e) => setSearchType(e.target.value)}
                            className="search-type"
                        >
                            <option value="title">제목</option>
                            <option value="user">사용자</option>
                        </select>
                        <input
                            type="text"
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                            placeholder="검색어를 입력하세요"
                            className="search-input"
                        />
                        <button type="submit" className="btn-search">
                            검색
                        </button>
                    </form>
                </div>
            </div>

            <div className="qna-stats">
                <div className="stat-item">
                    <span className="stat-label">전체</span>
                    <span className="stat-value">{qnaList.length}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">답변대기</span>
                    <span className="stat-value">
                        {qnaList.filter(qna => !qna.isAnswered).length}
                    </span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">답변완료</span>
                    <span className="stat-value">
                        {qnaList.filter(qna => qna.isAnswered).length}
                    </span>
                </div>
            </div>

            {qnaList.length === 0 ? (
                <div className="empty-state">
                    <p>등록된 QnA가 없습니다.</p>
                </div>
            ) : (
                <div className="qna-list">
                    {qnaList.map((qna) => (
                        <div
                            key={qna.qnaIndex}
                            className={`qna-item ${qna.isAnswered ? 'answered' : 'waiting'}`}
                            onClick={() => handleQnaClick(qna.qnaIndex)}
                        >
                            <div className="qna-status">
                                {qna.isAnswered ? (
                                    <span className="status-answered">답변완료</span>
                                ) : (
                                    <span className="status-waiting">답변대기</span>
                                )}
                            </div>
                            <div className="qna-content">
                                <h3 className="qna-title">{qna.questionTitle}</h3>
                                <p className="qna-desc">
                                    {qna.questionDesc.length > 100
                                        ? qna.questionDesc.substring(0, 100) + '...'
                                        : qna.questionDesc}
                                </p>
                                <div className="qna-meta">
                                    <span className="qna-user">
                                        문의자: {qna.questionUserName || '알 수 없음'}
                                    </span>
                                    <span className="qna-date">
                                        {formatDate(qna.qnaCreateTime)}
                                    </span>
                                    {qna.isAnswered && (
                                        <span className="answer-date">
                                            답변: {formatDate(qna.answerCreateTime)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminQnaListPage; 