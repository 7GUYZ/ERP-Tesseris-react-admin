"use client"

import { useState } from "react"
import '../../../../styles/dabin/SalesPerformanceSearchForm.css';

const SalesPerformanceSearchForm = ({ onSearch, businessGrades, storeRequestStatuses, onParamsChange }) => {
  const [isSearchFormOpen, setIsSearchFormOpen] = useState(false);
  const [form, setForm] = useState({
    businessUserId: "",
    businessGradeIndex: "",
    userName: "",
    businessManDistributionFlag: "",
    storeUserId: "",
    storeName: "",
    storeRequestStatusIndex: "",
    storeTransactionStatus: "",
  })

  const handleChange = (e) => {
    const newForm = { ...form, [e.target.name]: e.target.value }
    setForm(newForm)
    if (onParamsChange) {
      onParamsChange(newForm)
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
        {/* 1줄: 사업자 정보 */}
        <div className="dabin-page-layout-search-row">
          <div className="dabin-page-layout-search-field">
            <label className="dabin-page-layout-search-label">사업자 이메일</label>
            <input
              type="text"
              name="businessUserId"
              value={form.businessUserId}
              onChange={handleChange}
              className="dabin-page-layout-search-input"
              placeholder="사업자 이메일을 입력하세요"
            />
          </div>
          <div className="dabin-page-layout-search-field">
            <label className="dabin-page-layout-search-label">사업자 등급</label>
            <select
              name="businessGradeIndex"
              value={form.businessGradeIndex}
              onChange={handleChange}
              className="dabin-page-layout-search-select"
            >
              <option value="">전체</option>
              {businessGrades.map((grade) => (
                <option key={grade.businessGradeIndex} value={grade.businessGradeIndex}>
                  {grade.businessGradeName}
                </option>
              ))}
            </select>
          </div>
          <div className="dabin-page-layout-search-field">
            <label className="dabin-page-layout-search-label">사업자 이름</label>
            <input
              type="text"
              name="userName"
              value={form.userName}
              onChange={handleChange}
              className="dabin-page-layout-search-input"
              placeholder="사업자 이름을 입력하세요"
            />
          </div>
          <div className="dabin-page-layout-search-field">
            <label className="dabin-page-layout-search-label">사업자 상태</label>
            <select
              name="businessManDistributionFlag"
              value={form.businessManDistributionFlag}
              onChange={handleChange}
              className="dabin-page-layout-search-select"
            >
              <option value="">전체</option>
              <option value="1">정상</option>
              <option value="0">정지</option>
            </select>
          </div>
        </div>

        {/* 2줄: 가맹점 정보 */}
        <div className="dabin-page-layout-search-row">
          <div className="dabin-page-layout-search-field">
            <label className="dabin-page-layout-search-label">가맹점 이메일</label>
            <input
              type="text"
              name="storeUserId"
              value={form.storeUserId}
              onChange={handleChange}
              className="dabin-page-layout-search-input"
              placeholder="가맹점 이메일을 입력하세요"
            />
          </div>
          <div className="dabin-page-layout-search-field">
            <label className="dabin-page-layout-search-label">가맹점 명</label>
            <input
              type="text"
              name="storeName"
              value={form.storeName}
              onChange={handleChange}
              className="dabin-page-layout-search-input"
              placeholder="가맹점명을 입력하세요"
            />
          </div>
          <div className="dabin-page-layout-search-field">
            <label className="dabin-page-layout-search-label">승인 여부</label>
            <select
              name="storeRequestStatusIndex"
              value={form.storeRequestStatusIndex}
              onChange={handleChange}
              className="dabin-page-layout-search-select"
            >
              <option value="">전체</option>
              {storeRequestStatuses.map((status) => (
                <option key={status.storeRequestStatusIndex} value={status.storeRequestStatusIndex}>
                  {status.storeRequestStatusName}
                </option>
              ))}
            </select>
          </div>
          <div className="dabin-page-layout-search-field">
            <label className="dabin-page-layout-search-label">가맹점 상태</label>
            <select
              name="storeTransactionStatus"
              value={form.storeTransactionStatus}
              onChange={handleChange}
              className="dabin-page-layout-search-select"
            >
              <option value="">전체</option>
              <option value="1">정상</option>
              <option value="0">정지</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SalesPerformanceSearchForm 