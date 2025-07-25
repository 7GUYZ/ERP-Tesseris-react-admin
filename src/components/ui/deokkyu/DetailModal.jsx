import React from 'react';
import '../../../styles/deokkyu/DetailModal.css';

function DetailModal({ 
  isOpen, 
  onClose, 
  title = "상세 정보", 
  data = {}, 
  fields = [],
  customContent = null,
  customFooter = null 
}) {
  // ESC 키로 모달 닫기
  React.useEffect(() => {
    if (!isOpen) return; // isOpen이 false면 아무것도 하지 않음

    const handleEscKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    document.body.style.overflow = 'hidden'; // 배경 스크롤 방지

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // 오버레이 클릭 시 모달 닫기
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // 필드 값 포맷팅
  const formatValue = (value, type = 'text') => {
    if (value === null || value === undefined || value === '') {
      return '-';
    }

    switch (type) {
      case 'currency':
        return `${Number(value).toLocaleString()}원`;
      case 'number':
        return Number(value).toLocaleString();
      case 'date':
        return new Date(value).toLocaleDateString('ko-KR');
      case 'datetime':
        return new Date(value).toLocaleString('ko-KR');
      case 'phone':
        return value.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
      default:
        return value;
    }
  };

  return (
    <div className="detail-modal-overlay" onClick={handleOverlayClick}>
      <div className="detail-modal-container">
        {/* 모달 헤더 */}
        <div className="detail-modal-header">
          <h2 className="detail-modal-title">{title}</h2>
          <button 
            className="detail-modal-close-btn"
            onClick={onClose}
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {/* 모달 바디 */}
        <div className="detail-modal-body">
          {customContent ? (
            // 커스텀 컨텐츠가 있으면 그것을 사용
            customContent
          ) : (
            // 기본 필드 리스트 표시
            <div className="detail-modal-fields">
              {fields.map((field, index) => (
                <div key={index} className="detail-modal-field">
                  <div className="detail-modal-field-label">
                    {field.icon && <span className="detail-modal-field-icon">{field.icon}</span>}
                    {field.label}
                  </div>
                  <div className="detail-modal-field-value">
                    {formatValue(data[field.key], field.type)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 모달 푸터 */}
        {customFooter || (
          <div className="detail-modal-footer">
            <button 
              className="detail-modal-btn detail-modal-btn-secondary"
              onClick={onClose}
            >
              닫기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default DetailModal; 