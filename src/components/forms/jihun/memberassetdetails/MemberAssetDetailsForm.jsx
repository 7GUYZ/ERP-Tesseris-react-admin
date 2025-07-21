import { useState, useEffect, useCallback } from "react"
import MemberAssetDetailsTable from "../../../ui/jihun/memberassetdetails/MemberAssetDetailsTable.jsx"
import PaymentCollectionModal from "./PaymentCollectionModal.jsx"
import {
  ajgMemberAssetDetails,
  ajgMemberAssetDetailsSearch,
  ajgMemberAssetDetailsLookupGrades,
  ajgMemberAssetDetailsPayment
} from "../../../../api/auth/JihunAuth.jsx"
import { downloadSelectedExcel } from "../../../feature/jihun/common/ExcelCommon.jsx"
import "../../../../styles/jihun/memberassetdetails/MemberAssetDetailsForm.css"

/**
 * 회원 자산 현황 폼 컴포넌트
 * 
 * 주요 기능:
 * 1. 회원 자산 현황 조회
 * 2. 동적 검색 조건 지원
 * 3. 페이징 처리된 결과 표시
 * 4. 엑셀 다운로드
 * 5. 지급 및 회수 기능
 */
const MemberAssetDetailsForm = () => {
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    phone: "",
    grade: ""
  })

  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [isSearchFormOpen, setIsSearchFormOpen] = useState(false)
  const [selectedRows, setSelectedRows] = useState(new Set())
  const [options, setOptions] = useState({
    grades: []
  })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)

  // 서버 사이드 페이징 상태
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(25)
  const [totalCount, setTotalCount] = useState(0)

  // 페이징 전용 데이터 로드 함수
  const loadDataWithPagination = useCallback(async (page, size, searchFormData = formData) => {
    try {

      setLoading(true)
      
      // 검색 조건이 있는 경우와 없는 경우를 구분
      const hasSearchCriteria = searchFormData.id || searchFormData.name || searchFormData.phone || searchFormData.grade
      
      let response
      
      if (hasSearchCriteria) {
        // 검색 조건이 있는 경우
        const searchCriteria = {
          userEmail: searchFormData.id ? searchFormData.id.trim() : null,
          userName: searchFormData.name ? searchFormData.name.trim() : null,
          userPhone: searchFormData.phone ? searchFormData.phone.trim() : null,
          userRoleIndex: searchFormData.grade ? parseInt(searchFormData.grade) : null
        }
        
        const paginationInfo = {
          page: page,
          size: size
        }
        
        const cleanSearchCriteria = Object.fromEntries(
          Object.entries(searchCriteria).filter(([_, value]) => value !== null && value !== undefined)
        )
        
        const searchRequest = {
          searchCriteria: cleanSearchCriteria,
          paginationInfo: paginationInfo
        }
        
        response = await ajgMemberAssetDetailsSearch(searchRequest)
      } else {
        // 검색 조건이 없는 경우 - GET 요청 사용
        response = await ajgMemberAssetDetails(page, size)
      }
      
      if (response.data && response.data.content) {
        const transformedData = response.data.content.map((item, index) => {
          // CM 값 변환 로직 개선
          let cmHeld = 0;
          if (item.userCmCurrent !== null && item.userCmCurrent !== undefined) {
            if (typeof item.userCmCurrent === 'string') {
              cmHeld = parseInt(item.userCmCurrent) || 0;
            } else if (typeof item.userCmCurrent === 'number') {
              cmHeld = item.userCmCurrent;
            }
          }
          
          return {
            id: item.userEmail ? item.userEmail.split('@')[0] : (item.userId ? item.userId.split('@')[0] : ""),
            email: item.userEmail || item.userId || "",
          name: item.userName || "",
          phone: item.userPhone || "",
          grade: item.userRoleKorNm || "",
          franchiseName: item.storeName || "",
            cmHeld: cmHeld,
            cmpHeld: item.userCmpCurrent ? (typeof item.userCmpCurrent === 'string' ? parseInt(item.userCmpCurrent) : item.userCmpCurrent) || 0 : 0,
            cashHeld: item.userCashCurrent ? (typeof item.userCashCurrent === 'string' ? parseInt(item.userCashCurrent) : item.userCashCurrent) || 0 : 0,
          registrationDate: item.userCreateTime ? 
              new Date(item.userCreateTime).toISOString().split('T')[0] : "",
            uniqueKey: item.userIndex || `row-${index}`,
            rowNumber: (page * size) + index + 1, // 전체 순번 (페이지별로 연속)
            userIndex: item.userIndex || "",
            usersId: item.userId || ""
          };
        });
        
        setSearchResults(transformedData)
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
  }, [formData])

  // 초기 데이터 로딩 함수
  const loadInitialData = useCallback(async () => {
    await loadDataWithPagination(0, pageSize)
  }, [loadDataWithPagination, pageSize])
  
  useEffect(() => {
    const loadOptions = async () => {
      try {
        setLoading(true)
        const gradesRes = await ajgMemberAssetDetailsLookupGrades()
        setOptions({
          grades: gradesRes.data?.data || []
        })
        
        // 초기 데이터 로딩
        await loadInitialData()
      } catch (error) {
        // 기본 등급 옵션 설정
        setOptions({
          grades: [
            { index: 1, name: "일반" },
            { index: 2, name: "가맹점" },
            { index: 3, name: "사업자" },
            { index: 4, name: "정회원" }
          ]
        })
        await loadInitialData()
      } finally {
        setLoading(false)
      }
    }
    loadOptions()
  }, [loadInitialData]) // loadInitialData 변경 시 자동으로 다시 로드

  // 폼 입력 변경 핸들러 (성능 최적화)
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const [error, setError] = useState(null);

  const handleSearch = useCallback(async () => {
    try {
      setLoading(true)
      // 검색 시 첫 페이지로 리셋
      setCurrentPage(0)
      setSelectedRows(new Set()) // 검색 시 선택된 행들 초기화
      
      await loadDataWithPagination(0, pageSize, formData)
    } catch (error) {
      setError("검색 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }, [loadDataWithPagination, pageSize, formData])

  // 선택된 행들 처리 핸들러
  const handleSelectionChange = (newSelection) => {
    // Set으로 안전한 선택 처리
    const safeSelection = newSelection instanceof Set ? newSelection : new Set(newSelection || []);
    setSelectedRows(safeSelection);
  }

  // 서버 사이드 페이징 핸들러
  const handlePageChange = useCallback(async (newPage) => {
    setCurrentPage(newPage)
    await loadDataWithPagination(newPage, pageSize, formData)
  }, [loadDataWithPagination, pageSize, formData])

  const handlePageSizeChange = useCallback(async (newPageSize) => {
    setPageSize(newPageSize)
    setCurrentPage(0) // 페이지 크기 변경 시 첫 페이지로 리셋
    await loadDataWithPagination(0, newPageSize, formData)
  }, [loadDataWithPagination, formData])

  // 엑셀 다운로드 핸들러
  const handleExcelDownload = () => {
    // 데이터 변환 (순번 추가) - 회원자산내역과 동일한 방식
    const excelData = searchResults.map((row, index) => ({
      '순번': index + 1,
      '아이디': row.email ? row.email.split('@')[0] : '',
      '이름': row.name || '',
      '전화번호': row.phone || '',
      '등급': row.grade || '',
      '가맹점명': row.franchiseName || '',
      '보유 CM': row.cmHeld || 0,
      '보유 CMP': row.cmpHeld || 0,
      '보유 Cash': row.cashHeld || 0,
      '등록일': row.registrationDate || ''
    }));

    // selectedRows는 ID를 담고 있으므로 인덱스로 변환
    const selectedIndexes = new Set();
    searchResults.forEach((row, index) => {
      if (selectedRows.has(row.id)) {
        selectedIndexes.add(index);
      }
    });

    downloadSelectedExcel(excelData, selectedIndexes, '회원자산현황', '회원자산현황');
  }

  // 지급 및 회수 핸들러
  const handlePaymentAndCollection = () => {
    if (selectedRows.size === 0) {
      alert("지급 및 회수할 항목을 선택해주세요.");
      return;
    }
    
    // 다중선택 지원 - 첫 번째 선택된 항목으로 모달 열기 (대표 정보 표시용)
    const selectedId = Array.from(selectedRows)[0];
    
    // ID로 해당 회원 찾기
    let member = searchResults.find(row => row.id === selectedId);
    
    if (!member) {
      // ID를 찾을 수 없는 경우, 첫 번째 데이터 사용
      member = searchResults[0];
    }
    
    if (!member) {
      alert("선택된 회원 정보를 찾을 수 없습니다.");
      return;
    }
    
    // 선택된 회원 수 표시
    if (selectedRows.size > 1) {
      alert(`${selectedRows.size}명의 회원이 선택되었습니다. 대표 회원 정보로 모달이 열립니다.`);
    }
    
    setSelectedMember(member);
    setIsModalOpen(true);
  }

  // 모달 닫기 핸들러
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedMember(null);
  }

  // 지급/회수 제출 핸들러
  const handlePaymentSubmit = async (paymentData) => {
    try {
      // 선택된 모든 회원들의 정보를 배열로 수집
      const selectedMembers = Array.from(selectedRows).map(selectedId => 
        searchResults.find(row => row.id === selectedId)
      ).filter(Boolean);
      
      // 백엔드 API 요청 데이터 구성
              const requestData = {
          members: selectedMembers.map(member => ({
            memberId: member.userIndex.toString(), // user_index를 문자열로 변환
            currentCmHeld: member.cmHeld
          })),
          amount: paymentData.amount, // 이미 양수/음수로 구분되어 있음
          reason: paymentData.reason
        };
      
      
      
      // 백엔드 API 호출 (지급/회수 구분 없이 동일한 엔드포인트 사용)
      const response = await ajgMemberAssetDetailsPayment(requestData);
      
      const result = response.data;
      
      if (result.success) {
        // 처리 결과 알림
        const totalCount = result.totalCount || selectedMembers.length;
        const successCount = result.successCount || totalCount;
        const failureCount = result.failureCount || 0;
        const isPayment = paymentData.amount > 0;
        
        if (totalCount > 1) {
          if (failureCount > 0) {
            // 부분 실패 시 상세 정보 제공
            const failedMembers = result.results?.filter(r => !r.success).map(r => r.memberId) || [];
            alert(`${isPayment ? 'CM 지급' : 'CM 회수'} 처리 결과:\n` +
                  `전체: ${totalCount}명\n` +
                  `성공: ${successCount}명\n` +
                  `실패: ${failureCount}명\n` +
                  `실패 회원: ${failedMembers.join(', ')}`);
          } else {
            alert(`${isPayment ? 'CM 지급' : 'CM 회수'} 처리가 ${totalCount}명의 회원에 대해 완료되었습니다.`);
          }
    } else {
          alert(`${isPayment ? 'CM 지급' : 'CM 회수'} 처리가 완료되었습니다.`);
    }
    
    // 처리 완료 후 데이터 새로고침
      await loadInitialData();
      } else {
        // 전체 실패 시 상세 정보 제공
        const totalCount = result.totalCount || selectedMembers.length;
        const failureCount = result.failureCount || totalCount;
        const failedMembers = result.results?.filter(r => !r.success).map(r => r.memberId) || [];
        
        alert(`처리 실패:\n` +
              `전체: ${totalCount}명\n` +
              `실패: ${failureCount}명\n` +
              `실패 회원: ${failedMembers.join(', ')}\n` +
              `실패 원인: ${result.message}`);
      }
    } catch (error) {
      alert("처리 중 오류가 발생했습니다.");
    }
  }

  return (
    <div className="member-asset-details-container">
      {/* 페이지 제목과 액션 버튼 */}
      <div className="member-asset-details-page-header">
        <h1 className="member-asset-details-page-title">회원 자산 현황</h1>
        <div className="member-asset-details-actions">
          <button 
            className="member-asset-details-btn excel" 
            onClick={handleExcelDownload}
            disabled={searchResults.length === 0}
          >
            엑셀
          </button>
          <button
            className="member-asset-details-btn payment"
            onClick={handlePaymentAndCollection}
            disabled={false}
          >
            지급 및 회수
          </button>
          <button
            className="member-asset-details-btn search"
            onClick={handleSearch}
            disabled={loading}
          >
            {loading ? "조회 중..." : "조회"}
          </button>
        </div>
      </div>

      {/* 검색 조건 섹션 */}
      <div className="member-asset-details-section">
        {/* 검색 조건 토글 헤더 */}
        <div className="member-asset-details-toggle-header">
          <button 
            className="member-asset-details-toggle-btn"
            onClick={() => setIsSearchFormOpen(!isSearchFormOpen)}
          >
            <span className="member-asset-details-toggle-text">검색 조건</span>
            <span className={`member-asset-details-toggle-icon ${isSearchFormOpen ? 'open' : 'closed'}`}>
              ▼
            </span>
          </button>
        </div>
        
        {/* 검색 조건 폼 */}
        <div className={`member-asset-details-form ${isSearchFormOpen ? 'open' : 'closed'}`}>
          {/* 첫 번째 행: 아이디/이름 */}
          <div className="member-asset-details-row">
            <div className="member-asset-details-field">
              <label className="member-asset-details-label">아이디</label>
              <input
                className="member-asset-details-input"
                name="id"
                value={formData.id}
                onChange={handleInputChange}
                placeholder="검색명을 입력하세요."
              />
            </div>
            <div className="member-asset-details-field">
              <label className="member-asset-details-label">이름</label>
              <input
                className="member-asset-details-input"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="검색명을 입력하세요."
              />
            </div>
          </div>

          {/* 두 번째 행: 전화번호/등급 */}
          <div className="member-asset-details-row">
            <div className="member-asset-details-field">
              <label className="member-asset-details-label">전화번호</label>
              <input
                className="member-asset-details-input"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="검색명을 입력하세요."
              />
            </div>
            <div className="member-asset-details-field">
              <label className="member-asset-details-label">등급</label>
              <select
                className="member-asset-details-select"
                name="grade"
                value={formData.grade}
                onChange={handleInputChange}
              >
                <option value="">등급을 선택하세요.</option>
                {options.grades.map((grade) => (
                  <option key={grade.index} value={grade.index}>{grade.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="member-asset-details-error">
          {error}
        </div>
      )}

      {/* 결과 테이블 섹션 */}
      <div className="member-asset-details-results-section">
        <MemberAssetDetailsTable 
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

      {/* 지급 및 회수 모달 */}
      <PaymentCollectionModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        selectedMember={selectedMember}
        onPaymentSubmit={handlePaymentSubmit}
      />
    </div>
  )
}

export default MemberAssetDetailsForm 