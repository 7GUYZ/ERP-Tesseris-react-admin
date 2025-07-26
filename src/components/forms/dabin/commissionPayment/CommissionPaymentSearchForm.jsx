"use client"

import { useState } from "react"
import "../../../../styles/dabin/CommissionPaymentSearchForm.css";

const CommissionPaymentSearchForm = ({ onSearch, onParamsChange }) => {
  const [isSearchFormOpen, setIsSearchFormOpen] = useState(false);
  const [searchParams, setSearchParams] = useState({
    userRoleIndex: "",
    paymentStatus: "",
    startDate: "",
    endDate: "",
    userName: "",
    userId: ""
  })

  const handleInputChange = (field, value) => {
    const newParams = {
      ...searchParams,
      [field]: value
    }
    setSearchParams(newParams)
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
            <label className="commission-payment-search-label">추천인 등급</label>
            <select
              value={searchParams.userRoleIndex}
              onChange={(e) => handleInputChange('userRoleIndex', e.target.value)}
              className="commission-payment-search-select"
            >
              <option value="">전체</option>
              <option value="1">일반</option>
              <option value="2">사업자</option>
              <option value="3">가맹점</option>
              <option value="4">관리자</option>
              <option value="5">특판부</option>
              <option value="6">가맹점 서브</option>
            </select>
          </div>
          <div className="commission-payment-search-field">
            <label className="commission-payment-search-label">지급 상태</label>
            <select
              value={searchParams.paymentStatus}
              onChange={(e) => handleInputChange('paymentStatus', e.target.value)}
              className="commission-payment-search-select"
            >
              <option value="">전체</option>
              <option value="대기">대기</option>
              <option value="지급">지급</option>
              <option value="미지급">미지급</option>
            </select>
          </div>
        </div>

        <div className="commission-payment-search-row">
          <div className="commission-payment-search-field">
            <label className="commission-payment-search-label">시작일</label>
            <input
              type="date"
              value={searchParams.startDate}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
              className="commission-payment-search-input"
            />
          </div>
          <div className="commission-payment-search-field">
            <label className="commission-payment-search-label">종료일</label>
            <input
              type="date"
              value={searchParams.endDate}
              onChange={(e) => handleInputChange('endDate', e.target.value)}
              className="commission-payment-search-input"
            />
          </div>
        </div>

        <div className="commission-payment-search-row">
          <div className="commission-payment-search-field">
            <label className="commission-payment-search-label">사용자명</label>
            <input
              type="text"
              value={searchParams.userName}
              onChange={(e) => handleInputChange('userName', e.target.value)}
              className="commission-payment-search-input"
              placeholder="사용자명을 입력하세요"
            />
          </div>
          <div className="commission-payment-search-field">
            <label className="commission-payment-search-label">사용자 ID</label>
            <input
              type="text"
              value={searchParams.userId}
              onChange={(e) => handleInputChange('userId', e.target.value)}
              className="commission-payment-search-input"
              placeholder="사용자 ID를 입력하세요"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CommissionPaymentSearchForm 