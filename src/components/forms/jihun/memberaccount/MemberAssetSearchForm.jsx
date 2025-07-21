import { useState, useEffect, useCallback, useMemo } from "react"
import MemberAssetSearchTable from "../../../ui/jihun/memberaccount/MemberAssetSearchTable.jsx"
import {
  memberaccountSearch,
  memberaccountLookupRoles,
  memberaccountLookupPaymentTypes,
  memberaccountLookupTransactionTypes
} from "../../../../api/auth/JihunAuth.jsx"
import { downloadSelectedExcel } from "../../../feature/jihun/common/ExcelCommon.jsx"
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
  const [isSearchFormOpen, setIsSearchFormOpen] = useState(false)
  const [selectedRows, setSelectedRows] = useState(new Set())
  const [options, setOptions] = useState({
    roles: [],
    paymentTypes: [],
    transactionTypes: []
  })
  
  // 서버 사이드 페이징 상태
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(25)
  const [totalCount, setTotalCount] = useState(0)

  // 이메일에서 ID 추출 함수 (성능 최적화)
  const extractEmailId = useCallback((email) => {
    if (!email) return ""
    return email.split('@')[0] || ""
  }, [])


  




  // 폼 입력 변경 핸들러 (성능 최적화)
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }, [])

  const [error, setError] = useState(null);

  // 서버 사이드 페이징을 위한 검색 함수
  const performSearch = useCallback(async (page = 0, size = pageSize, searchFormData = formData) => {
    try {
      setLoading(true)
      
      // 검색 조건 준비 - 백엔드에서 동적 쿼리 지원을 위한 표준 형식
      const searchRequest = {
        
        // 사용자 ID 검색 (LIKE 검색을 위한 새로운 파라미터)
        eventTriggerUserEmail: searchFormData.fromId ? searchFormData.fromId.trim() : null,
        eventPartyUserEmail: searchFormData.toId ? searchFormData.toId.trim() : null,
        eventPartyUserName: searchFormData.toId ? searchFormData.toId.trim() : null, // 이름으로도 검색
        
        // 기존 검색 조건들
        userIndexEventTrigger: null,
        userIndexEventParty: null,
        userRoleIndex: searchFormData.fromGrade ? parseInt(searchFormData.fromGrade) : null,
        userRoleIndex2: searchFormData.toGrade ? parseInt(searchFormData.toGrade) : null,
        userCmLogValueTypeIndex: null,
        userCmLogCreateTimeStart: searchFormData.fromDate || null,
        userCmLogCreateTimeEnd: searchFormData.toDate || null,
        userCmLogPaymentIndex: null,
        userCmLogTransactionTypeIndex: searchFormData.transactionType ? parseInt(searchFormData.transactionType) : null,
        
        // 페이징 정보 - 명시적으로 포함
        page: page,
        size: size  // 서버 사이드 페이징을 위해 size 사용
      }
      
      // null 값 제거하여 실제로 검색할 조건만 전달 (페이징 정보는 항상 포함)
      const cleanSearchRequest = Object.fromEntries(
        Object.entries(searchRequest).filter(([key, value]) => {
          // 페이징 정보는 항상 포함
          if (key === 'page' || key === 'size') {
            return true
          }
          // 다른 필드는 null/undefined가 아닌 경우만 포함
          return value !== null && value !== undefined
        })
      )
      
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

        // 서버 사이드 페이징에서는 클라이언트 사이드 필터링 제거
        // 백엔드에서 이미 필터링된 데이터를 받아옴

        setSearchResults(transformedData)
        
        // 서버에서 받은 총 개수 설정 (개선된 로직)
        let totalElements = response.data.totalElements || response.data.total || 0
        
        // 백엔드에서 totalElements를 제공하지 않는 경우, 현재 페이지가 마지막 페이지인지 확인
        if (totalElements === 0 && transformedData.length > 0) {
          // 현재 페이지의 데이터가 요청한 크기보다 적으면 마지막 페이지로 간주
          if (transformedData.length < size) {
            totalElements = (page * size) + transformedData.length
          } else {
            // 더 많은 데이터가 있을 수 있으므로 임시로 큰 값 설정
            totalElements = (page + 1) * size + 100
          }
        }
        
        setTotalCount(totalElements)
              } else {
          setSearchResults([])
          setTotalCount(0)
        }
      } catch (error) {
        setSearchResults([])
        setTotalCount(0)
      } finally {
      setLoading(false)
    }
  }, [extractEmailId, pageSize])

  // 초기 데이터 로딩 함수 (서버 사이드 페이징 사용)
  const loadInitialData = useCallback(async () => {
    try {
      // 서버 사이드 페이징을 위해 performSearch 함수 사용
      await performSearch(0, pageSize)
    } catch (error) {
      setSearchResults([])
      setTotalCount(0)
    }
  }, [performSearch, pageSize])

  // 기존 검색 핸들러 (첫 페이지 검색용)
  const handleSearch = useCallback(() => {
    setCurrentPage(0)
    setSelectedRows(new Set()) // 검색 시 선택된 행들 초기화
    performSearch(0, pageSize, formData)
  }, [performSearch, pageSize, formData])



  // 선택된 행들 처리 핸들러
  const handleSelectionChange = useCallback((newSelection) => {
    // Set으로 안전한 선택 처리
    const safeSelection = newSelection instanceof Set ? newSelection : new Set(newSelection || []);
    setSelectedRows(safeSelection);
  }, [])

  // 페이지 변경 핸들러
  const handlePageChange = useCallback((newPage) => {
    setCurrentPage(newPage)
    // 새로운 페이지로 검색 실행
    performSearch(newPage, pageSize, formData)
  }, [performSearch, pageSize, formData])

  // 페이지 크기 변경 핸들러
  const handlePageSizeChange = useCallback((newPageSize) => {
    setPageSize(newPageSize)
    setCurrentPage(0) // 페이지 크기 변경 시 첫 페이지로 이동
    // 새로운 페이지 크기로 검색 실행 (명시적으로 newPageSize 전달)
    performSearch(0, newPageSize, formData)
  }, [performSearch, formData])

  // 엑셀 다운로드 핸들러
  const handleExcelDownload = useCallback(() => {
    // 데이터 변환 (순번 추가)
    const excelData = searchResults.map((row, index) => ({
      '순번': index + 1,
      'FROM 등급': row.fromGrade || '',
      'FROM ID': row.fromId || '',
      'TO 등급': row.toGrade || '',
      'TO ID': row.toId || '',
      'TO 이름': row.toName || '',
      '거래 유형': row.transactionType || '',
      '금액': row.amount || 0,
      '단위': row.unit || '',
      '사용 금액': row.usedValue || 0,
      '쿠폰 사용 금액': row.couponUsedValue || 0,
      '사유': row.reason || '',
      '발생일': row.occurredDate || ''
    }));

    downloadSelectedExcel(excelData, selectedRows, '회원자산내역', '회원자산내역');
  }, [searchResults, selectedRows])

  // 오늘 날짜 구하기 (yyyy-mm-dd) - 성능 최적화
  const today = useMemo(() => new Date().toISOString().split('T')[0], [])

  // 초기 데이터 로딩 useEffect (모든 함수 정의 후에 배치)
  useEffect(() => {
    const loadOptions = async () => {
      try {
        setLoading(true)
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
        setError(error.message || "옵션 데이터를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false)
      }
    }
    loadOptions()
  }, [loadInitialData])

  return (
    <div className="member-asset-search-container">
      {/* 페이지 제목과 액션 버튼 */}
      <div className="member-asset-search-page-header">
        <h1 className="member-asset-search-page-title">회원 자산 내역</h1>
        <div className="member-asset-search-actions">
          <button 
            className="member-asset-search-btn excel" 
            onClick={handleExcelDownload}
            disabled={searchResults.length === 0}
          >
            엑셀
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
      {error && (
        <div className="member-asset-search-error">
          {error}
        </div>
      )}

      {/* 결과 테이블 섹션 */}
      <div className="member-asset-search-table-container">
        <MemberAssetSearchTable 
          data={searchResults} 
          onSelectionChange={handleSelectionChange}
          totalCount={totalCount}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          loading={loading}
        />
      </div>
    </div>
  )
}

export default MemberAssetSearchForm

