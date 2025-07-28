"use client"

import { useState } from "react"
import "../../../../styles/dabin/CommissionPaymentSearchForm.css";

const CommissionPaymentSearchForm = ({ onSearch, onParamsChange, onDateErrorsChange }) => {
  const [isSearchFormOpen, setIsSearchFormOpen] = useState(false);
  const [searchParams, setSearchParams] = useState({
    userId: "",
    userName: "",
    userPhone: "",
    chargeTimeStart: "",
    chargeTimeEnd: "",
    transactionName: "",
    suggestionUserId: "",
    suggestionUserName: "",
    userRoleIndex: ""
  })

  // 에러 상태 추가
  const [errors, setErrors] = useState({
    chargeTime: ""
  })

  // 날짜 검증 함수
  const validateDateRange = (startDate, endDate, fieldName) => {
    if (!startDate || !endDate) return ""; // 둘 다 비어있으면 검증 통과
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      return `${fieldName} 종료일은 시작일보다 이후여야 합니다.`;
    }
    
    return "";
  }

  const handleInputChange = (field, value) => {
    const newParams = {
      ...searchParams,
      [field]: value
    }
    
    // 날짜 검증
    let newErrors = { ...errors };
    
    if (field === 'chargeTimeStart' || field === 'chargeTimeEnd') {
      newErrors.chargeTime = validateDateRange(
        field === 'chargeTimeStart' ? value : searchParams.chargeTimeStart,
        field === 'chargeTimeEnd' ? value : searchParams.chargeTimeEnd,
        '충전'
      );
    }
    
    setErrors(newErrors);
    setSearchParams(newParams);
    
    // 부모 컴포넌트에 에러 상태 전달
    if (onDateErrorsChange) {
      onDateErrorsChange(newErrors);
    }
    
    if (onParamsChange) {
      onParamsChange(newParams)
    }
  }

  return (
    <div className="dabin-page-layout-search-section">
      <div className="dabin-page-layout-search-header">
        <button
          className="dabin-page-layout-search-toggle-btn"
          onClick={() => setIsSearchFormOpen(!isSearchFormOpen)}
        >
          <span className="dabin-page-layout-search-toggle-text">검색 조건</span>
          <span className={`dabin-page-layout-search-toggle-icon ${isSearchFormOpen ? 'open' : 'closed'}`}>
            ▼
          </span>
        </button>
      </div>

      <div className={`dabin-page-layout-search-form ${isSearchFormOpen ? 'open' : 'closed'}`}>
        <div className="commission-payment-search-row">
          <div className="commission-payment-search-field">
            <label className="commission-payment-search-label">ID</label>
            <input
              type="text"
              value={searchParams.userId}
              onChange={(e) => handleInputChange('userId', e.target.value)}
              className="commission-payment-search-input"
              placeholder="ID를 입력하세요"
            />
          </div>
          <div className="commission-payment-search-field">
            <label className="commission-payment-search-label">이름</label>
            <input
              type="text"
              value={searchParams.userName}
              onChange={(e) => handleInputChange('userName', e.target.value)}
              className="commission-payment-search-input"
              placeholder="이름을 입력하세요"
            />
          </div>
          <div className="commission-payment-search-field">
            <label className="commission-payment-search-label">핸드폰 번호</label>
            <input
              type="text"
              value={searchParams.userPhone}
              onChange={(e) => handleInputChange('userPhone', e.target.value)}
              className="commission-payment-search-input"
              placeholder="핸드폰 번호를 입력하세요"
            />
          </div>
        </div>

        <div className="commission-payment-search-row">
          <div className="commission-payment-search-field">
            <label className="commission-payment-search-label">충전일</label>
            <input
              type="date"
              value={searchParams.chargeTimeStart}
              onChange={(e) => handleInputChange('chargeTimeStart', e.target.value)}
              className={`commission-payment-search-input ${errors.chargeTime ? 'error' : ''}`}
            />
            {errors.chargeTime && (
              <div className="error-message">{errors.chargeTime}</div>
            )}
          </div>
          <div className="commission-payment-search-field">
            <label className="commission-payment-search-label">~</label>
            <input
              type="date"
              value={searchParams.chargeTimeEnd}
              onChange={(e) => handleInputChange('chargeTimeEnd', e.target.value)}
              className={`commission-payment-search-input ${errors.chargeTime ? 'error' : ''}`}
            />
            {errors.chargeTime && (
              <div className="error-message">{errors.chargeTime}</div>
            )}
          </div>
          <div className="commission-payment-search-field">
            <label className="commission-payment-search-label">거래명</label>
            <input
              type="text"
              value={searchParams.transactionName}
              onChange={(e) => handleInputChange('transactionName', e.target.value)}
              className="commission-payment-search-input"
              placeholder="거래명을 입력하세요"
            />
          </div>
        </div>

        <div className="commission-payment-search-row">
          <div className="commission-payment-search-field">
            <label className="commission-payment-search-label">추천인 ID</label>
            <input
              type="text"
              value={searchParams.suggestionUserId}
              onChange={(e) => handleInputChange('suggestionUserId', e.target.value)}
              className="commission-payment-search-input"
              placeholder="추천인 ID를 입력하세요"
            />
          </div>
          <div className="commission-payment-search-field">
            <label className="commission-payment-search-label">추천인 이름</label>
            <input
              type="text"
              value={searchParams.suggestionUserName}
              onChange={(e) => handleInputChange('suggestionUserName', e.target.value)}
              className="commission-payment-search-input"
              placeholder="추천인 이름을 입력하세요"
            />
          </div>
          <div className="commission-payment-search-field">
            <label className="commission-payment-search-label">추천인 등급</label>
            <select
              value={searchParams.userRoleIndex}
              onChange={(e) => handleInputChange('userRoleIndex', e.target.value)}
              className="commission-payment-search-select"
            >
              <option value="">추천인 등급 선택</option>
              <option value="1">일반회원</option>
              <option value="7">정회원</option>
              <option value="3">가맹점</option>
              <option value="2">사업자</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CommissionPaymentSearchForm 