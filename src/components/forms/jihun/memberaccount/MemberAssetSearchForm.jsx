import { useState, useEffect, useCallback, useMemo } from "react"
import MemberAssetSearchTable from "../../../ui/jihun/memberaccount/MemberAssetSearchTable.jsx"
import {
  memberaccount,
  memberaccountSearch,
  memberaccountLookupRoles,
  memberaccountLookupPaymentTypes,
  memberaccountLookupTransactionTypes
} from "../../../../api/auth/JihunAuth.jsx"
import "../../../../styles/jihun/memberaccount/MemberAssetSearchForm.css"

/**
 * 회원 자산 검색 폼 컴포넌트
 * 
 * 주요 기능:
 * 1. 회원 자산 내역 검색
 * 2. 동적 검색 조건 지원
 * 3. 페이징 처리된 결과 표시
 * 
 * 단위 관련:
 * - 현재는 단위 선택 UI를 제공하지만 검색 시 null로 보내 범용성 확보
 * - 향후 확장성을 고려하여 다양한 단위 지원 가능
 * - 필요시 백엔드에서 단위별 필터링 로직 추가 가능
 */
const MemberAssetSearchForm = () => {
  const [formData, setFormData] = useState({
    fromId: "",
    toId: "",
    fromDate: "",
    toDate: "",
    fromGrade: "",
    toGrade: "",
    transactionType: "",
    unit: ""
  })

  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isSearchFormOpen, setIsSearchFormOpen] = useState(false)
  const [options, setOptions] = useState({
    roles: [],
    paymentTypes: [],
    transactionTypes: []
  })

  // 단위 옵션 정의 (범용성을 위한 확장 가능한 구조) - 성능 최적화
  const unitOptions = useMemo(() => [
    { value: "", label: "전체" },
    { value: "CMP", label: "CMP" },
    { value: "CM", label: "CM" },
    { value: "Cash", label: "Cash" }
  ], [])

  useEffect(() => {
    const loadOptions = async () => {
      try {
        setLoading(true)
        setError(null)
        const [rolesRes, paymentTypesRes, transactionTypesRes] = await Promise.all([
          memberaccountLookupRoles(),
          memberaccountLookupPaymentTypes(),
          memberaccountLookupTransactionTypes()
        ])
        setOptions({
          roles: rolesRes.data || [],
          paymentTypes: paymentTypesRes.data || [],
          transactionTypes: transactionTypesRes.data || []
        })
        
        // 초기 데이터 로딩
        await loadInitialData()
      } catch (error) {
        setError(error.message || "옵션 데이터를 불러오는데 실패했습니다.")
      } finally {
        setLoading(false)
      }
    }
    loadOptions()
  }, [])

  // 초기 데이터 로딩 함수
  const loadInitialData = async () => {
    try {
      const initialRequest = {
        userIndexEventTrigger: null,
        userIndexEventParty: null,
        userRoleIndex: null,
        userRoleIndex2: null,
        userCmLogValueTypeIndex: null,
        userCmLogCreateTimeStart: null,
        userCmLogCreateTimeEnd: null,
        userCmLogPaymentIndex: null,
        userCmLogTransactionTypeIndex: null,
        page: 0,
        size: 100 // 초기에는 적당한 양만 로딩
      }
      
      const response = await memberaccountSearch(initialRequest)
      
      if (response.data && response.data.content) {
        const transformedData = response.data.content.map(item => ({
          fromGrade: item.eventTriggerUserRole || "알 수 없음",
          fromId: extractEmailId(item.eventTriggerUserEmail) || "",
          toGrade: item.eventPartyUserRole || "알 수 없음",
          toId: extractEmailId(item.eventPartyUserEmail) || "",
          toName: item.eventPartyUserName || "",
          transactionType: item.transactionTypeName || "",
          amount: item.userCmLogValue ? item.userCmLogValue.toString() : "0",
          unit: "원",
          usedValue: item.userCmLogValue ? item.userCmLogValue.toString() : "0",
          couponUsedValue: item.userCouponValue ? item.userCouponValue.toString() : "0",
          reason: item.userCmLogReason || "",
          occurredDate: item.userCmLogCreateTime ?
            new Date(item.userCmLogCreateTime).toISOString().split('T')[0] : ""
        }))
        
        setSearchResults(transformedData)
        console.log(`초기 데이터 로딩 완료: ${transformedData.length}개의 항목`)
      }
    } catch (error) {
      console.error("초기 데이터 로딩 중 오류:", error)
      setSearchResults([])
    }
  }

  // 폼 입력 변경 핸들러 (성능 최적화)
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handleReset = async () => {
    setFormData({
      fromId: "",
      toId: "",
      fromDate: "",
      toDate: "",
      fromGrade: "",
      toGrade: "",
      transactionType: "",
      unit: ""
    })
    setError(null)
    
    // 폼 리셋 후 초기 데이터 다시 로딩
    try {
      setLoading(true)
      await loadInitialData()
    } catch (error) {
      console.error("초기화 후 데이터 로딩 중 오류:", error)
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  // 이메일에서 ID 추출 함수 (성능 최적화)
  const extractEmailId = useCallback((email) => {
    if (!email) return ""
    return email.split('@')[0] || ""
  }, [])

  const handleSearch = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // 검색 조건 준비 - 백엔드에서 동적 쿼리 지원을 위한 표준 형식
      const searchRequest = {
        // 사용자 ID 검색 (LIKE 검색을 위한 새로운 파라미터)
        eventTriggerUserEmail: formData.fromId ? formData.fromId.trim() : null,
        eventPartyUserEmail: formData.toId ? formData.toId.trim() : null,
        eventPartyUserName: formData.toId ? formData.toId.trim() : null, // 이름으로도 검색
        
        // 기존 검색 조건들
        userIndexEventTrigger: null,
        userIndexEventParty: null,
        userRoleIndex: formData.fromGrade ? parseInt(formData.fromGrade) : null,
        userRoleIndex2: formData.toGrade ? parseInt(formData.toGrade) : null,
        userCmLogValueTypeIndex: null,
        userCmLogCreateTimeStart: formData.fromDate || null,
        userCmLogCreateTimeEnd: formData.toDate || null,
        userCmLogPaymentIndex: null,
        userCmLogTransactionTypeIndex: formData.transactionType ? parseInt(formData.transactionType) : null,
        
        page: 0,
        size: 1000
      }
      
      // null 값 제거하여 실제로 검색할 조건만 전달
      const cleanSearchRequest = Object.fromEntries(
        Object.entries(searchRequest).filter(([_, value]) => value !== null && value !== undefined)
      )
      
      console.log("정제된 검색 요청:", cleanSearchRequest)
      
      const response = await memberaccountSearch(cleanSearchRequest)
      
      if (response.data && response.data.content) {
        let transformedData = response.data.content.map(item => ({
          fromGrade: item.eventTriggerUserRole || "알 수 없음",
          fromId: extractEmailId(item.eventTriggerUserEmail) || "",
          toGrade: item.eventPartyUserRole || "알 수 없음",
          toId: extractEmailId(item.eventPartyUserEmail) || "",
          toName: item.eventPartyUserName || "",
          transactionType: item.transactionTypeName || "",
          amount: item.userCmLogValue ? item.userCmLogValue.toString() : "0",
          unit: "원",
          usedValue: item.userCmLogValue ? item.userCmLogValue.toString() : "0",
          couponUsedValue: item.userCouponValue ? item.userCouponValue.toString() : "0",
          reason: item.userCmLogReason || "",
          occurredDate: item.userCmLogCreateTime ?
            new Date(item.userCmLogCreateTime).toISOString().split('T')[0] : ""
        }))

        // 백엔드에서 LIKE 검색이 완전히 지원되지 않는 경우를 대비한 클라이언트 사이드 필터링
        transformedData = transformedData.filter(item => {
          let matches = true
          
          // FROM ID LIKE 검색
          if (formData.fromId && formData.fromId.trim() !== '') {
            const searchTerm = formData.fromId.toLowerCase().trim()
            if (!item.fromId.toLowerCase().includes(searchTerm)) {
              matches = false
            }
          }
          
          // TO ID 또는 TO Name LIKE 검색
          if (formData.toId && formData.toId.trim() !== '') {
            const searchTerm = formData.toId.toLowerCase().trim()
            const matchesId = item.toId.toLowerCase().includes(searchTerm)
            const matchesName = item.toName.toLowerCase().includes(searchTerm)
            
            if (!matchesId && !matchesName) {
              matches = false
            }
          }
          
          return matches
        })

        console.log(`검색 완료: 총 ${transformedData.length}개의 결과를 찾았습니다.`)
        setSearchResults(transformedData)
      } else {
        console.log("검색 결과가 없습니다.")
        setSearchResults([])
      }
    } catch (error) {
      console.error("검색 중 오류 발생:", error)
      // 에러 발생 시 전체 데이터라도 보여주기 위해 초기 데이터 로딩 시도
      try {
        await loadInitialData()
      } catch (initError) {
        console.error("초기 데이터 로딩도 실패:", initError)
        setSearchResults([])
      }
    } finally {
      setLoading(false)
    }
  }



  // 엑셀 다운로드 핸들러 (임시로 비활성화)
  const handleExcelDownload = useCallback(() => {
    alert("엑셀 다운로드 기능이 준비 중입니다.")
  }, [])

  // 오늘 날짜 구하기 (yyyy-mm-dd) - 성능 최적화
  const today = useMemo(() => new Date().toISOString().split('T')[0], [])

  return (
    <div className="member-asset-search-container">
      {/* 헤더 섹션 - 왼쪽 정렬 */}
      <div className="member-asset-search-header">
        <div className="member-asset-search-header-content">
          <h1 className="member-asset-search-title">회원 자산 내역</h1>
          <div className="member-asset-search-actions">
            <button className="member-asset-search-btn excel" onClick={handleExcelDownload}>
              엑셀 다운로드
            </button>
            <button
              className="member-asset-search-btn search"
              onClick={handleSearch}
              disabled={loading}
            >
              {loading ? "조회 중..." : "조회"}
            </button>
          </div>
        </div>
      </div>

      {/* 검색 조건 섹션 */}
      <div className="member-asset-search-section">
        {/* 검색 조건 토글 헤더 */}
        <div className="member-asset-search-toggle-header">
          <button 
            className="member-asset-search-toggle-btn"
            onClick={() => setIsSearchFormOpen(!isSearchFormOpen)}
          >
            <span className="member-asset-search-toggle-text">검색 조건</span>
            <span className={`member-asset-search-toggle-icon ${isSearchFormOpen ? 'open' : 'closed'}`}>
              ▼
            </span>
          </button>
        </div>
        
        {/* 검색 조건 폼 */}
        <div className={`member-asset-search-form ${isSearchFormOpen ? 'open' : 'closed'}`}>
          {/* 첫 번째 행: FROM/TO ID */}
          <div className="member-asset-search-row">
            <div className="member-asset-search-field">
              <label className="member-asset-search-label">FROM ID</label>
              <input
                className="member-asset-search-input"
                name="fromId"
                value={formData.fromId}
                onChange={handleInputChange}
                placeholder="검색명을 입력하세요."
              />
            </div>
            <div className="member-asset-search-field">
              <label className="member-asset-search-label">TO ID</label>
              <input
                className="member-asset-search-input"
                name="toId"
                value={formData.toId}
                onChange={handleInputChange}
                placeholder="검색명을 입력하세요."
              />
            </div>
          </div>

          {/* 두 번째 행: FROM/TO 등급 */}
          <div className="member-asset-search-row">
            <div className="member-asset-search-field">
              <label className="member-asset-search-label">FROM 등급</label>
              <select
                className="member-asset-search-select"
                name="fromGrade"
                value={formData.fromGrade}
                onChange={handleInputChange}
              >
                <option value="">전체</option>
                {options.roles.map((role) => (
                  <option key={role.index} value={role.index}>{role.name}</option>
                ))}
              </select>
            </div>
            <div className="member-asset-search-field">
              <label className="member-asset-search-label">TO 등급</label>
              <select
                className="member-asset-search-select"
                name="toGrade"
                value={formData.toGrade}
                onChange={handleInputChange}
              >
                <option value="">전체</option>
                {options.roles.map((role) => (
                  <option key={role.index} value={role.index}>{role.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 세 번째 행: 발생일 */}
          <div className="member-asset-search-row">
            <div className="member-asset-search-field">
              <label className="member-asset-search-label">발생일(시작)</label>
              <input
                className="member-asset-search-input"
                type="date"
                name="fromDate"
                value={formData.fromDate}
                onChange={handleInputChange}
                max={today}
                placeholder="연도-월-일"
              />
            </div>
            <div className="member-asset-search-field">
              <label className="member-asset-search-label">발생일(종료)</label>
              <input
                className="member-asset-search-input"
                type="date"
                name="toDate"
                value={formData.toDate}
                onChange={handleInputChange}
                max={today}
                placeholder="연도-월-일"
              />
            </div>
          </div>

          {/* 네 번째 행: 거래 유형 */}
          <div className="member-asset-search-row">
            <div className="member-asset-search-field">
              <label className="member-asset-search-label">거래</label>
              <select
                className="member-asset-search-select"
                name="transactionType"
                value={formData.transactionType}
                onChange={handleInputChange}
              >
                <option value="">전체</option>
                {options.transactionTypes.map((type) => (
                  <option key={type.index} value={type.index}>{type.name}</option>
                ))}
              </select>
            </div>
            {/*
            <div className="member-asset-search-field">
              <label className="member-asset-search-label">단위</label>
              <select
                className="member-asset-search-select"
                name="unit"
                value={formData.unit}
                onChange={handleInputChange}
              >
                {unitOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            */}
          </div>
        </div>
      </div>

      {/* 에러 메시지는 콘솔에만 출력하고 화면에는 표시하지 않음 */}

      {/* 결과 테이블 섹션 */}
      <div className="member-asset-search-results-section">
        <MemberAssetSearchTable 
          data={searchResults} 
        />
      </div>
    </div>
  )
}

export default MemberAssetSearchForm

