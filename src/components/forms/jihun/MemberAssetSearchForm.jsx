"use client"

import { useState } from "react"
import MemberAssetSearchInput from "../../ui/jihun/MemberAssetSearchInput.jsx"
import MemberAssetSearchSelect from "../../ui/jihun/MemberAssetSearchSelect.jsx"
import MemberAssetSearchTable from "../../ui/jihun/MemberAssetSearchTable.jsx"
import "../../../styles/jihun/MemberAssetSearchForm.css"

const MemberAssetSearchForm = () => {
  const [formData, setFormData] = useState({
    fromId: "",
    toId: "",
    fromDate: "",
    toDate: "",
    fromGrade: "",
    toGrade: "",
    amount: "",
  })

  const [searchResults, setSearchResults] = useState([])

  const gradeOptions = [
    { value: "bronze", label: "브론즈" },
    { value: "silver", label: "실버" },
    { value: "gold", label: "골드" },
    { value: "platinum", label: "플래티넘" },
    { value: "diamond", label: "다이아몬드" },
  ]

  const amountOptions = [
    { value: "all", label: "전체" },
    { value: "under_10000", label: "10,000원 미만" },
    { value: "10000_50000", label: "10,000원 ~ 50,000원" },
    { value: "50000_100000", label: "50,000원 ~ 100,000원" },
    { value: "over_100000", label: "100,000원 이상" },
  ]

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleReset = () => {
    setFormData({
      fromId: "",
      toId: "",
      fromDate: "",
      toDate: "",
      fromGrade: "",
      toGrade: "",
      amount: "",
    })
    setSearchResults([])
  }

  const handleSearch = () => {
    // 실제 검색 로직은 여기에 구현
    console.log("검색 조건:", formData)

    // 예시 데이터
    const mockData = [
      {
        fromGrade: "골드",
        fromId: "user001",
        toGrade: "실버",
        toId: "user002",
        toName: "김철수",
        transactionType: "출금",
        amount: "50,000",
        unit: "원",
        usedValue: "45,000",
        couponUsedValue: "5,000",
        reason: "상품 구매",
        occurredDate: "2024-01-15",
      },
      {
        fromGrade: "플래티넘",
        fromId: "user003",
        toGrade: "골드",
        toId: "user004",
        toName: "이영희",
        transactionType: "입금",
        amount: "100,000",
        unit: "원",
        usedValue: "100,000",
        couponUsedValue: "0",
        reason: "포인트 충전",
        occurredDate: "2024-01-14",
      },
    ]

    setSearchResults(mockData)
  }

  return (
    <div className="member-asset-search-container">
      <div className="member-asset-search-header">
        <h1 className="member-asset-search-title">회원 자산 내역</h1>
        <div className="member-asset-search-actions">
          <button className="member-asset-search-btn reset" onClick={handleReset}>
            엑셀
          </button>
          <button className="member-asset-search-btn search" onClick={handleSearch}>
            조회
          </button>
        </div>
      </div>

      <div className="member-asset-search-form">
        <div className="member-asset-search-row">
          <MemberAssetSearchInput
            label="FROM ID"
            value={formData.fromId}
            onChange={(value) => handleInputChange("fromId", value)}
            placeholder="검색 할 회원 ID를 입력하세요"
          />
          <MemberAssetSearchInput
            label="TO ID"
            value={formData.toId}
            onChange={(value) => handleInputChange("toId", value)}
            placeholder="검색 할 회원 ID를 입력하세요"
          />
        </div>

        <div className="member-asset-search-row date-row">
          <MemberAssetSearchInput
            label="발생일"
            type="date"
            value={formData.fromDate}
            onChange={(value) => handleInputChange("fromDate", value)}
          />
          <div className="member-asset-search-separator">~</div>
          <MemberAssetSearchInput
            type="date"
            value={formData.toDate}
            onChange={(value) => handleInputChange("toDate", value)}
          />
        </div>

        <div className="member-asset-search-row">
          <MemberAssetSearchSelect
            label="FROM 등급"
            value={formData.fromGrade}
            onChange={(value) => handleInputChange("fromGrade", value)}
            options={gradeOptions}
            placeholder="등급을 여부"
          />
          <MemberAssetSearchSelect
            label="TO 등급"
            value={formData.toGrade}
            onChange={(value) => handleInputChange("toGrade", value)}
            options={gradeOptions}
            placeholder="단위"
          />
        </div>

        <div className="member-asset-search-row">
          <MemberAssetSearchSelect
            label="가액"
            value={formData.amount}
            onChange={(value) => handleInputChange("amount", value)}
            options={amountOptions}
          />
        </div>

        <MemberAssetSearchTable data={searchResults} />
      </div>
    </div>
  )
}

export default MemberAssetSearchForm
