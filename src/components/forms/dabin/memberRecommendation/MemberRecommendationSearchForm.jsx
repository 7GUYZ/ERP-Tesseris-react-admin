"use client"

import { useState, useEffect } from "react"
import '../../../../styles/dabin/MemberRecommendationSearchForm.css';

const MemberRecommendationSearchForm = ({ onSearch, userRoles, onParamsChange }) => {
  const [isSearchFormOpen, setIsSearchFormOpen] = useState(false);
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

  useEffect(() => {
    onParamsChange(formData)
  }, [formData, onParamsChange])

  const handleChange = (field) => (event) => {
    const newFormData = {
      ...formData,
      [field]: event.target.value,
    }
    setFormData(newFormData)
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
              className="dabin-page-layout-search-input"
            />
          </div>
          <div className="dabin-page-layout-search-field">
            <label className="dabin-page-layout-search-label">가입 종료일</label>
            <input
              type="date"
              name="joinDateEnd"
              value={formData.joinDateEnd}
              onChange={handleChange("joinDateEnd")}
              className="dabin-page-layout-search-input"
            />
          </div>
          <div className="dabin-page-layout-search-field">
            <label className="dabin-page-layout-search-label">추천인 아이디</label>
            <input
              type="text"
              name="suggestionUserId"
              value={formData.suggestionUserId}
              onChange={handleChange("suggestionUserId")}
              className="dabin-page-layout-search-input"
              placeholder="추천인 아이디를 입력하세요"
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