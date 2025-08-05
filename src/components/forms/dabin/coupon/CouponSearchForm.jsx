"use client"

import { useState } from "react"
import { Grid, TextField, Select, MenuItem, FormControl, Typography, Paper, Box } from "@mui/material"
import '../../../../styles/dabin/CouponSearchForm.css';

const CouponSearchForm = ({ onSearch, issuanceStatus, providedStatus, onParamsChange, onDateErrorsChange }) => {
  const [isSearchFormOpen, setIsSearchFormOpen] = useState(true);
  const [form, setForm] = useState({
    issuanceStart: "",
    issuanceEnd: "",
    providedStart: "",
    providedEnd: "",
    limitStart: "",
    limitEnd: "",
    issuanceUserId: "",
    providedUserId: "",
    issuanceStatusIndex: "",
    providedStatusIndex: "",
    couponName: "",
    couponPrice: "",
  })

  // 에러 상태 추가
  const [errors, setErrors] = useState({
    issuanceDate: "",
    providedDate: "",
    limitDate: ""
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newForm = { ...form, [name]: value };
    
    // 날짜 검증
    let newErrors = { ...errors };
    
    if (name === 'issuanceStart' || name === 'issuanceEnd') {
      newErrors.issuanceDate = validateDateRange(
        name === 'issuanceStart' ? value : form.issuanceStart,
        name === 'issuanceEnd' ? value : form.issuanceEnd,
        '발행'
      );
    }
    
    if (name === 'providedStart' || name === 'providedEnd') {
      newErrors.providedDate = validateDateRange(
        name === 'providedStart' ? value : form.providedStart,
        name === 'providedEnd' ? value : form.providedEnd,
        '지급'
      );
    }
    
    if (name === 'limitStart' || name === 'limitEnd') {
      newErrors.limitDate = validateDateRange(
        name === 'limitStart' ? value : form.limitStart,
        name === 'limitEnd' ? value : form.limitEnd,
        '만기'
      );
    }
    
    setErrors(newErrors);
    setForm(newForm);
    
    // 부모 컴포넌트에 에러 상태 전달
    if (onDateErrorsChange) {
      onDateErrorsChange(newErrors);
    }
    
    if (onParamsChange) {
      onParamsChange(newForm);
    }
  }

  return (
    <div className="dabin-page-layout-search-section">
      {/* 검색 조건 토글 헤더 */}
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
      
      {/* 검색 조건 폼 */}
      <div className={`dabin-page-layout-search-form ${isSearchFormOpen ? 'open' : 'closed'}`}>
        {/* 1줄: 발행 날짜 + 지급 시작일 */}
        <div className="dabin-page-layout-search-row">
          <div className="dabin-page-layout-search-field">
            <label className="dabin-page-layout-search-label">발행 시작일</label>
            <input
              type="date"
              name="issuanceStart"
              value={form.issuanceStart}
              onChange={handleChange}
              className={`dabin-page-layout-search-input ${errors.issuanceDate ? 'error' : ''}`}
            />
            {errors.issuanceDate && (
              <div className="error-message">{errors.issuanceDate}</div>
            )}
          </div>
          <div className="dabin-page-layout-search-field">
            <label className="dabin-page-layout-search-label">발행 종료일</label>
            <input
              type="date"
              name="issuanceEnd"
              value={form.issuanceEnd}
              onChange={handleChange}
              className={`dabin-page-layout-search-input ${errors.issuanceDate ? 'error' : ''}`}
            />
            {errors.issuanceDate && (
              <div className="error-message">{errors.issuanceDate}</div>
            )}
          </div>
          <div className="dabin-page-layout-search-field">
            <label className="dabin-page-layout-search-label">지급 시작일</label>
            <input
              type="date"
              name="providedStart"
              value={form.providedStart}
              onChange={handleChange}
              className={`dabin-page-layout-search-input ${errors.providedDate ? 'error' : ''}`}
            />
            {errors.providedDate && (
              <div className="error-message">{errors.providedDate}</div>
            )}
          </div>
          <div className="dabin-page-layout-search-field">
            <label className="dabin-page-layout-search-label">지급 종료일</label>
            <input
              type="date"
              name="providedEnd"
              value={form.providedEnd}
              onChange={handleChange}
              className={`dabin-page-layout-search-input ${errors.providedDate ? 'error' : ''}`}
            />
            {errors.providedDate && (
              <div className="error-message">{errors.providedDate}</div>
            )}
          </div>
        </div>

        {/* 2줄: 만기 날짜 + 발행상태 + 지급상태 */}
        <div className="dabin-page-layout-search-row">
          <div className="dabin-page-layout-search-field">
            <label className="dabin-page-layout-search-label">만기 시작일</label>
            <input
              type="date"
              name="limitStart"
              value={form.limitStart}
              onChange={handleChange}
              className={`dabin-page-layout-search-input ${errors.limitDate ? 'error' : ''}`}
            />
            {errors.limitDate && (
              <div className="error-message">{errors.limitDate}</div>
            )}
          </div>
          <div className="dabin-page-layout-search-field">
            <label className="dabin-page-layout-search-label">만기 종료일</label>
            <input
              type="date"
              name="limitEnd"
              value={form.limitEnd}
              onChange={handleChange}
              className={`dabin-page-layout-search-input ${errors.limitDate ? 'error' : ''}`}
            />
            {errors.limitDate && (
              <div className="error-message">{errors.limitDate}</div>
            )}
          </div>
          <div className="dabin-page-layout-search-field">
            <label className="dabin-page-layout-search-label">발행상태</label>
            <select
              name="issuanceStatusIndex"
              value={form.issuanceStatusIndex}
              onChange={handleChange}
              className="dabin-page-layout-search-select"
            >
              <option value="">전체</option>
              {issuanceStatus.map(s => (
                <option key={s.couponIssuanceStatusIndex} value={s.couponIssuanceStatusIndex}>
                  {s.couponIssuanceStatus}
                </option>
              ))}
            </select>
          </div>
          <div className="dabin-page-layout-search-field">
            <label className="dabin-page-layout-search-label">지급상태</label>
            <select
              name="providedStatusIndex"
              value={form.providedStatusIndex}
              onChange={handleChange}
              className="dabin-page-layout-search-select"
            >
              <option value="">전체</option>
              {providedStatus.map(s => (
                <option key={s.couponProvidedStatusIndex} value={s.couponProvidedStatusIndex}>
                  {s.couponProvidedStatus}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 3줄: 발행자/지급자/쿠폰명/쿠폰가격 */}
        <div className="dabin-page-layout-search-row">
          <div className="dabin-page-layout-search-field">
            <label className="dabin-page-layout-search-label">발행자 이메일</label>
            <input
              name="issuanceUserId"
              value={form.issuanceUserId}
              onChange={handleChange}
              placeholder="발행자 이메일"
              className="dabin-page-layout-search-input"
            />
          </div>
          <div className="dabin-page-layout-search-field">
            <label className="dabin-page-layout-search-label">지급자 이메일</label>
            <input
              name="providedUserId"
              value={form.providedUserId}
              onChange={handleChange}
              placeholder="지급자 이메일"
              className="dabin-page-layout-search-input"
            />
          </div>
          <div className="dabin-page-layout-search-field">
            <label className="dabin-page-layout-search-label">쿠폰명</label>
            <input
              name="couponName"
              value={form.couponName}
              onChange={handleChange}
              placeholder="쿠폰명"
              className="dabin-page-layout-search-input"
            />
          </div>
          <div className="dabin-page-layout-search-field">
            <label className="dabin-page-layout-search-label">쿠폰가격</label>
            <input
              name="couponPrice"
              type="number"
              value={form.couponPrice}
              onChange={handleChange}
              placeholder="쿠폰가격"
              className="dabin-page-layout-search-input"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default CouponSearchForm
