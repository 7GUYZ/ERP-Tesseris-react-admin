import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import '../../styles/taekjun/QnaResponseRateModal.css';

const QnaResponseRateModal = ({ isOpen, onClose, qnaData }) => {
    if (!isOpen) return null;

    const { qnaTotal = 0, qnaAnswered = 0, qnaUnanswered = 0 } = qnaData || {};

    const data = [
        {
            name: '답변 완료',
            value: qnaAnswered,
            color: '#10b981'
        },
        {
            name: '미답변',
            value: qnaUnanswered,
            color: '#ef4444'
        }
    ];

    const responseRate = qnaTotal > 0 ? Math.round((qnaAnswered / qnaTotal) * 100) : 0;

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="qna-tooltip">
                    <p className="tooltip-label">{payload[0].name}</p>
                    <p className="tooltip-value">{payload[0].value}건</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="qna-modal-overlay" onClick={onClose}>
            <div className="qna-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="qna-modal-header">
                    <h2>QnA 응답률 상세</h2>
                    <button className="qna-modal-close" onClick={onClose}>
                        ×
                    </button>
                </div>
                
                <div className="qna-modal-body">
                    <div className="qna-summary-stats">
                        <div className="stat-item">
                            <span className="stat-label">전체 QnA</span>
                            <span className="stat-value">{qnaTotal.toLocaleString()}건</span>
                        </div>
                        <div className="stat-item highlight">
                            <span className="stat-label">답변률</span>
                            <span className="stat-value rate">{responseRate}%</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">답변 완료</span>
                            <span className="stat-value answered">{qnaAnswered.toLocaleString()}건</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">미답변</span>
                            <span className="stat-value unanswered">{qnaUnanswered.toLocaleString()}건</span>
                        </div>
                    </div>

                    <div className="qna-chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="qna-insights">
                        <h3>인사이트</h3>
                        <div className="insight-item">
                            {responseRate >= 80 ? (
                                <span className="insight positive">✓ 우수한 응답률입니다!</span>
                            ) : responseRate >= 60 ? (
                                <span className="insight neutral">○ 보통 수준의 응답률입니다.</span>
                            ) : (
                                <span className="insight negative">⚠ 응답률 개선이 필요합니다.</span>
                            )}
                        </div>
                        <div className="insight-item">
                            <span className="insight-info">
                                미답변 QnA: {qnaUnanswered.toLocaleString()}건
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QnaResponseRateModal; 