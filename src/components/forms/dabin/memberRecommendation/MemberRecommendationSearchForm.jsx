"use client"

import { useState, useEffect } from "react"
import '../../../../styles/dabin/MemberRecommendationSearchForm.css';

const MemberRecommendationSearchForm = ({ onSearch, userRoles, onParamsChange, onDateErrorsChange }) => {
  const [isSearchFormOpen, setIsSearchFormOpen] = useState(true);
  const [formData, setFormData] = useState({
    suggestionUserId: "",
    suggestionUserName: "",
    suggestionUserRole: "",
    suggestionStoreName: "",
    joinDateStart: "",
    joinDateEnd: "",
    userName: "",
    recommendationUserRole: "",
  })

  // 에러 상태 추가
  const [errors, setErrors] = useState({
    joinDate: ""
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

  useEffect(() => {
    onParamsChange(formData)
  }, [formData, onParamsChange])

  const handleChange = (field) => (event) => {
    const { value } = event.target;
    const newFormData = {
      ...formData,
      [field]: value,
    }
    
    // 날짜 검증
    let newErrors = { ...errors };
    
    if (field === 'joinDateStart' || field === 'joinDateEnd') {
      newErrors.joinDate = validateDateRange(
        field === 'joinDateStart' ? value : formData.joinDateStart,
        field === 'joinDateEnd' ? value : formData.joinDateEnd,
        '가입'
      );
    }
    
    setErrors(newErrors);
    setFormData(newFormData);
    
    // 부모 컴포넌트에 에러 상태 전달
    if (onDateErrorsChange) {
      onDateErrorsChange(newErrors);
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
        {/* 1줄: 가입 날짜 + 추천인 정보 */}
        <div className="dabin-page-layout-search-row">
          <div className="dabin-page-layout-search-field">
            <label className="dabin-page-layout-search-label">가입 시작일</label>
            <input
              type="date"
              name="joinDateStart"
              value={formData.joinDateStart}
              onChange={handleChange("joinDateStart")}
              className={`dabin-page-layout-search-input ${errors.joinDate ? 'error' : ''}`}
            />
            {errors.joinDate && (
              <div className="error-message">{errors.joinDate}</div>
            )}
          </div>
          <div className="dabin-page-layout-search-field">
            <label className="dabin-page-layout-search-label">가입 종료일</label>
            <input
              type="date"
              name="joinDateEnd"
              value={formData.joinDateEnd}
              onChange={handleChange("joinDateEnd")}
              className={`dabin-page-layout-search-input ${errors.joinDate ? 'error' : ''}`}
            />
            {errors.joinDate && (
              <div className="error-message">{errors.joinDate}</div>
            )}
          </div>
          <div className="dabin-page-layout-search-field">
            <label className="dabin-page-layout-search-label">추천인 이메일</label>
            <input
              type="text"
              name="suggestionUserId"
              value={formData.suggestionUserId}
              onChange={handleChange("suggestionUserId")}
              className="dabin-page-layout-search-input"
              placeholder="추천인 이메일을 입력하세요"
            />
          </div>
          <div className="dabin-page-layout-search-field">
            <label className="dabin-page-layout-search-label">추천인 이름</label>
            <input
              type="text"
              name="suggestionUserName"
              value={formData.suggestionUserName}
              onChange={handleChange("suggestionUserName")}
              className="dabin-page-layout-search-input"
              placeholder="추천인 이름을 입력하세요"
            />
          </div>
        </div>

        {/* 2줄: 추천인 등급 + 가맹점 + 가입자 정보 */}
        <div className="dabin-page-layout-search-row">
          <div className="dabin-page-layout-search-field">
            <label className="dabin-page-layout-search-label">추천인 등급</label>
            <select
              name="suggestionUserRole"
              value={formData.suggestionUserRole}
              onChange={handleChange("suggestionUserRole")}
              className="dabin-page-layout-search-select"
            >
              <option value="">등급을 선택하세요</option>
              {userRoles.map((role) => (
                <option key={role.userRoleIndex} value={role.userRoleIndex}>
                  {role.userRoleKorNm}
                </option>
              ))}
            </select>
          </div>
          <div className="dabin-page-layout-search-field">
            <label className="dabin-page-layout-search-label">가맹점 이름</label>
            <input
              type="text"
              name="suggestionStoreName"
              value={formData.suggestionStoreName}
              onChange={handleChange("suggestionStoreName")}
              className="dabin-page-layout-search-input"
              placeholder="가맹점 이름을 입력하세요"
            />
          </div>
          <div className="dabin-page-layout-search-field">
            <label className="dabin-page-layout-search-label">가입자 이름</label>
            <input
              type="text"
              name="userName"
              value={formData.userName}
              onChange={handleChange("userName")}
              className="dabin-page-layout-search-input"
              placeholder="가입자 이름을 입력하세요"
            />
          </div>
          <div className="dabin-page-layout-search-field">
            <label className="dabin-page-layout-search-label">가입자 등급</label>
            <select
              name="recommendationUserRole"
              value={formData.recommendationUserRole}
              onChange={handleChange("recommendationUserRole")}
              className="dabin-page-layout-search-select"
            >
              <option value="">등급을 선택하세요</option>
              {userRoles.map((role) => (
                <option key={role.userRoleIndex} value={role.userRoleIndex}>
                  {role.userRoleKorNm}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MemberRecommendationSearchForm 