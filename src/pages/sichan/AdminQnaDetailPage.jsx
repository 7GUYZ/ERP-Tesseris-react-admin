import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../../styles/sichan/AdminQnaDetailPage.css';

const AdminQnaDetailPage = () => {
    const { qnaIndex } = useParams();
    const navigate = useNavigate();
    const [qnaDetail, setQnaDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAnswerForm, setShowAnswerForm] = useState(false);
    const [answerForm, setAnswerForm] = useState({
        questionTitle: '',
        questionDesc: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchQnaDetail();
    }, [qnaIndex]);

    const fetchQnaDetail = async () => {
        try {
            const token = localStorage.getItem('admin-access-token');
            if (!token) {
                setError('인증 토큰이 없습니다. 다시 로그인해주세요.');
                setLoading(false);
                return;
            }

            const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://kschost.ddns.net/springboot' 
  : 'http://localhost:19091';

            const response = await fetch(`${API_BASE_URL}/api/sichan/qna/admin/${qnaIndex}`, {
                headers: {
                    'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setQnaDetail(data);
            } else if (response.status === 401) {
                setError('인증이 만료되었습니다. 다시 로그인해주세요.');
            } else {
                setError('QnA 상세 정보를 불러오는데 실패했습니다.');
            }
        } catch (error) {
            console.error('QnA 상세 조회 오류:', error);
            setError('QnA 상세 정보를 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerSubmit = async (e) => {
        e.preventDefault();
        
        if (!answerForm.questionTitle.trim() || !answerForm.questionDesc.trim()) {
            alert('답변 제목과 내용을 모두 입력해주세요.');
            return;
        }

        setIsSubmitting(true);
        
        try {
            const token = localStorage.getItem('admin-access-token');
            if (!token) {
                alert('인증 토큰이 없습니다. 다시 로그인해주세요.');
                setIsSubmitting(false);
                return;
            }

            const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://kschost.ddns.net/springboot' 
  : 'http://localhost:19091';

            const response = await fetch(`${API_BASE_URL}/api/sichan/qna/admin/${qnaIndex}/answer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`
                },
                body: JSON.stringify(answerForm)
            });

            if (response.ok) {
                alert('답변이 성공적으로 등록되었습니다.');
                setShowAnswerForm(false);
                setAnswerForm({ questionTitle: '', questionDesc: '' });
                fetchQnaDetail(); // 상세 정보 다시 불러오기
            } else if (response.status === 401) {
                alert('인증이 만료되었습니다. 다시 로그인해주세요.');
            } else {
                const errorData = await response.json();
                alert('답변 등록에 실패했습니다: ' + (errorData.message || '알 수 없는 오류'));
            }
        } catch (error) {
            console.error('답변 등록 오류:', error);
            alert('답변 등록 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setAnswerForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const formatDate = (dateString) => {
        if (!dateString) return '날짜 없음';
        
        try {
            console.log('날짜 파싱 시도:', dateString, '타입:', typeof dateString);
            
            let date;
            
            // 배열 형태의 숫자들 (2025,7,29,19,55,49)
            if (Array.isArray(dateString)) {
                const [year, month, day, hour, minute, second] = dateString;
                date = new Date(year, month - 1, day, hour, minute, second);
            }
            // 문자열인 경우 다양한 형식 시도
            else if (typeof dateString === 'string') {
                // ISO 형식 (2024-01-15T14:30:00)
                if (dateString.includes('T')) {
                    date = new Date(dateString);
                }
                // 한국 형식 (2024-01-15 14:30:00) - 백엔드에서 오는 형식
                else if (dateString.includes('-') && dateString.includes(':')) {
                    // 공백을 T로 바꿔서 ISO 형식으로 변환
                    const isoString = dateString.replace(' ', 'T');
                    date = new Date(isoString);
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
                // 추가 디버깅을 위해 원본 문자열 반환
                return `날짜 형식 오류: ${dateString}`;
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
            return `날짜 형식 오류: ${dateString}`;
        }
    };

    if (loading) {
        return (
            <div className="admin-qna-detail-container">
                <div className="loading">QnA 상세 정보를 불러오는 중...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="admin-qna-detail-container">
                <div className="error">{error}</div>
            </div>
        );
    }

    if (!qnaDetail) {
        return (
            <div className="admin-qna-detail-container">
                <div className="error">QnA를 찾을 수 없습니다.</div>
            </div>
        );
    }

    return (
        <div className="admin-qna-detail-container">
            <div className="admin-qna-detail-header">
                <button
                    onClick={() => navigate('/admin/sichan/qna/list')}
                    className="btn-back"
                >
                    ← 목록으로
                </button>
                <h1>QnA 상세</h1>
            </div>

            <div className="qna-detail-content">
                <div className="qna-question">
                    <div className="question-header">
                        <h2>{qnaDetail.questionTitle}</h2>
                        <div className="question-meta">
                            <span className="question-date">
                                {formatDate(qnaDetail.qnaCreateTime)}
                            </span>
                            <span className="question-user">
                                문의자: {qnaDetail.questionUserName || '알 수 없음'}
                            </span>
                            <span className="question-status">
                                {qnaDetail.isAnswered ? '답변완료' : '답변대기'}
                            </span>
                        </div>
                    </div>
                    <div className="question-content">
                        <p>{qnaDetail.questionDesc}</p>
                    </div>
                </div>

                {qnaDetail.isAnswered && (
                    <div className="qna-answer">
                        <div className="answer-header">
                            <h3>답변</h3>
                            <div className="answer-meta">
                                <span className="answer-date">
                                    {formatDate(qnaDetail.answerCreateTime)}
                                </span>
                                {qnaDetail.answerUserName && (
                                    <span className="answer-user">
                                        답변자: {qnaDetail.answerUserName}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="answer-content">
                            {qnaDetail.answerTitle && (
                                <h4>{qnaDetail.answerTitle}</h4>
                            )}
                            <p>{qnaDetail.answerDesc}</p>
                        </div>
                    </div>
                )}

                {!qnaDetail.isAnswered && (
                    <div className="qna-waiting">
                        <p>답변을 기다리고 있습니다.</p>
                        <button
                            onClick={() => setShowAnswerForm(true)}
                            className="btn-primary"
                        >
                            답변 작성
                        </button>
                    </div>
                )}

                {showAnswerForm && !qnaDetail.isAnswered && (
                    <div className="answer-form-container">
                        <h3>답변 작성</h3>
                        <form onSubmit={handleAnswerSubmit} className="answer-form">
                            <div className="form-group">
                                <label htmlFor="questionTitle">답변 제목</label>
                                <input
                                    type="text"
                                    id="questionTitle"
                                    name="questionTitle"
                                    value={answerForm.questionTitle}
                                    onChange={handleInputChange}
                                    placeholder="답변 제목을 입력해주세요"
                                    maxLength={150}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="questionDesc">답변 내용</label>
                                <textarea
                                    id="questionDesc"
                                    name="questionDesc"
                                    value={answerForm.questionDesc}
                                    onChange={handleInputChange}
                                    placeholder="답변 내용을 자세히 입력해주세요"
                                    rows="8"
                                    required
                                />
                            </div>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    onClick={() => setShowAnswerForm(false)}
                                    className="btn-secondary"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="btn-primary"
                                >
                                    {isSubmitting ? '등록 중...' : '답변 등록'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>

            <div className="qna-detail-actions">
                <button
                    onClick={() => navigate('/admin/sichan/qna/list')}
                    className="btn-secondary"
                >
                    목록으로
                </button>
            </div>
        </div>
    );
};

export default AdminQnaDetailPage; 