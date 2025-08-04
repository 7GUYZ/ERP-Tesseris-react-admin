import { useState, useEffect, useCallback, useMemo } from "react"
import MemberAssetSearchTable from "../../../ui/jihun/memberaccount/MemberAssetSearchTable.jsx"
import {
  memberaccountSearch,
  memberaccountGetAll,
  memberaccountLookupRoles,
  memberaccountLookupTransactionTypes,
  excelDownloadMemberAccount
} from "../../../../api/auth/JihunAuth.jsx"
import { downloadExcel } from "../../../feature/jihun/common/ExcelCommon.jsx"
import { useToast } from "../../../../context/jungeun/ToastContext"
import "../../../../styles/jihun/memberaccount/MemberAssetSearchForm.css"

/**
 * 회원 자산 검색 폼 컴포넌트
 * 
 * 주요 기능:
 * 1. 회원 자산 내역 검색
 * 2. 동적 검색 조건 지원
 * 3. 페이징 처리된 결과 표시
 */
const MemberAssetSearchForm = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    fromId: "",
    toId: "",
    fromDate: "",
    toDate: "",
    fromGrade: "",
    toGrade: "",
    transactionType: ""
  })

  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [isSearchFormOpen, setIsSearchFormOpen] = useState(true)
  const [selectedRows, setSelectedRows] = useState(new Set())
  const [allSelectedRows, setAllSelectedRows] = useState(new Map())
  const [options, setOptions] = useState({
    roles: [],
    transactionTypes: []
  })
  
  // 서버 사이드 페이징 상태
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(25)
  const [totalCount, setTotalCount] = useState(0)

  // 이메일에서 ID 추출 함수
  const extractEmailId = useCallback((email) => {
    if (!email) return ""
    return email.split('@')[0] || ""
  }, [])

  // 폼 입력 변경 핸들러
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
  }, [extractEmailId, pageSize, formData])

  // 초기 데이터 로딩 함수 (전체 조회 API 사용)
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await memberaccountGetAll(0, pageSize)
      
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

        setSearchResults(transformedData)
        setTotalCount(response.data.totalElements || 0)
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

  // 기존 검색 핸들러 (첫 페이지 검색용)
  const handleSearch = useCallback(() => {
    setCurrentPage(0)
    setSelectedRows(new Set()) // 검색 시 선택된 행들 초기화
    setAllSelectedRows(new Map()) // 전체 선택 맵도 초기화
    performSearch(0, pageSize, formData)
  }, [performSearch, pageSize, formData])



  // 선택된 행들 처리 핸들러
  const handleSelectionChange = useCallback((newSelection) => {
    // Set으로 안전한 선택 처리
    const safeSelection = newSelection instanceof Set ? newSelection : new Set(newSelection || []);
    setSelectedRows(safeSelection);
    
    // 현재 페이지의 선택 항목을 전체 선택 맵에 저장
    const pageKey = `page_${currentPage}`;
    const newAllSelectedRows = new Map(allSelectedRows);
    
    if (safeSelection.size > 0) {
      // 현재 페이지에서 선택된 행들의 데이터 저장
      const selectedData = searchResults.filter((_, index) => safeSelection.has(index));
      newAllSelectedRows.set(pageKey, selectedData);
    } else {
      // 선택이 해제되면 해당 페이지 데이터 삭제
      newAllSelectedRows.delete(pageKey);
    }
    
    setAllSelectedRows(newAllSelectedRows);
  }, [currentPage, searchResults, allSelectedRows])

  // 페이지 변경 핸들러
  const handlePageChange = useCallback((newPage) => {
    setCurrentPage(newPage)
    // 새로운 페이지로 검색 실행 (검색 조건이 있으면 검색 API, 없으면 전체 조회 API)
    if (Object.values(formData).some(value => value && value !== "")) {
      performSearch(newPage, pageSize, formData)
    } else {
      // 검색 조건이 없으면 전체 조회 API 사용
      const loadPageData = async () => {
        try {
          setLoading(true)
          const response = await memberaccountGetAll(newPage, pageSize)
          
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

            setSearchResults(transformedData)
            setTotalCount(response.data.totalElements || 0)
          }
        } catch (error) {
          setSearchResults([])
          setTotalCount(0)
        } finally {
          setLoading(false)
        }
      }
      loadPageData()
    }
  }, [performSearch, pageSize, formData, extractEmailId])

  // 페이지 크기 변경 핸들러
  const handlePageSizeChange = useCallback((newPageSize) => {
    setPageSize(newPageSize)
    setCurrentPage(0) // 페이지 크기 변경 시 첫 페이지로 이동
    // 새로운 페이지 크기로 검색 실행 (검색 조건이 있으면 검색 API, 없으면 전체 조회 API)
    if (Object.values(formData).some(value => value && value !== "")) {
      performSearch(0, newPageSize, formData)
    } else {
      // 검색 조건이 없으면 전체 조회 API 사용
      const loadPageData = async () => {
        try {
          setLoading(true)
          const response = await memberaccountGetAll(0, newPageSize)
          
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

            setSearchResults(transformedData)
            setTotalCount(response.data.totalElements || 0)
          }
        } catch (error) {
          setSearchResults([])
          setTotalCount(0)
        } finally {
          setLoading(false)
        }
      }
      loadPageData()
    }
  }, [performSearch, formData, extractEmailId])

  // 엑셀 다운로드 핸들러
  const handleExcelDownload = useCallback(async () => {
    try {
      const hasSelection = selectedRows.size > 0 || allSelectedRows.size > 0;
      
      if (hasSelection) {
        let allSelectedData = [];
        for (const [pageKey, pageData] of allSelectedRows) {
          allSelectedData = allSelectedData.concat(pageData);
        }
        const excelData = allSelectedData.map((row, index) => ({
          'No.': index + 1,
          'FROM 등급': row.fromGrade || '',
          'FROM ID': row.fromId || '',
          'TO 등급': row.toGrade || '',
          'TO ID': row.toId || '',
          'TO 이름': row.toName || '',
          '거래유형': row.transactionType || '',
          '거래금액': row.amount || '0',
          '단위': row.unit || '원',
          '사용금액': row.usedValue || '0',
          '쿠폰사용금액': row.couponUsedValue || '0',
          '거래사유': row.reason || '',
          '발생일': row.occurredDate || ''
        }));
        downloadExcel(excelData, '회원자산내역_선택항목', '회원자산내역', true, toast);
      } else {
        setLoading(true);
        
        // 🆕 새로운 엑셀 다운로드 API 사용
        const countResponse = await excelDownloadMemberAccount(0, 1);
        const totalCount = countResponse.data.totalElements || 0;
        
        if (totalCount <= 50000) {
          const response = await excelDownloadMemberAccount(0, totalCount);
          const data = response.data;
          if (data.content) {
            const allData = data.content.map((item, index) => ({
              'No.': index + 1,
              '거래번호': item.userCmLogIndex || '',
              '거래금액': item.userCmLogValue || 0,
              '거래사유': item.userCmLogReason || '',
              '거래시간': item.userCmLogCreateTime || '',
              '쿠폰금액': item.userCouponValue || 0,
              '요청자이메일': item.eventTriggerUserEmail || '',
              '요청자역할': item.eventTriggerUserRole || '',
              '상대방이메일': item.eventPartyUserEmail || '',
              '상대방이름': item.eventPartyUserName || '',
              '상대방역할': item.eventPartyUserRole || '',
              '거래유형': item.transactionTypeName || ''
            }));
            downloadExcel(allData, '회원자산내역_전체', '회원자산내역', true, toast);
          }
        } else {
          const chunkSize = 50000;
          const totalChunks = Math.ceil(totalCount / chunkSize);
          let allData = [];
          
          for (let i = 0; i < totalChunks; i++) {
            const chunkResponse = await excelDownloadMemberAccount(i, chunkSize);
            const chunkData = chunkResponse.data;
            if (chunkData.content) {
              const chunkExcelData = chunkData.content.map((item, index) => ({
                'No.': allData.length + index + 1,
                '거래번호': item.userCmLogIndex || '',
                '거래금액': item.userCmLogValue || 0,
                '거래사유': item.userCmLogReason || '',
                '거래시간': item.userCmLogCreateTime || '',
                '쿠폰금액': item.userCouponValue || 0,
                '요청자이메일': item.eventTriggerUserEmail || '',
                '요청자역할': item.eventTriggerUserRole || '',
                '상대방이메일': item.eventPartyUserEmail || '',
                '상대방이름': item.eventPartyUserName || '',
                '상대방역할': item.eventPartyUserRole || '',
                '거래유형': item.transactionTypeName || ''
              }));
              allData = allData.concat(chunkExcelData);
            }
            console.log(`엑셀 다운로드 진행률: ${i + 1}/${totalChunks}`);
          }
          downloadExcel(allData, '회원자산내역_전체', '회원자산내역', true, toast);
        }
        setLoading(false);
      }
    } catch (error) {
      console.error('엑셀 다운로드 오류:', error);
      toast.error('엑셀 다운로드 중 오류가 발생했습니다.');
      setLoading(false);
    }
  }, [selectedRows, allSelectedRows, formData, extractEmailId, toast]);

  // 오늘 날짜 구하기 (yyyy-mm-dd) - 성능 최적화
  const today = useMemo(() => new Date().toISOString().split('T')[0], [])

  // 초기 데이터 로딩 useEffect (모든 함수 정의 후에 배치)
  useEffect(() => {
    const loadOptions = async () => {
      try {
        setLoading(true)
        const [rolesRes, transactionTypesRes] = await Promise.all([
          memberaccountLookupRoles(),
          memberaccountLookupTransactionTypes()
        ])
        setOptions({
          roles: rolesRes.data || [],
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
      <div>
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

