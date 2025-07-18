import { useState, useEffect } from "react"
import MemberAssetDetailsTable from "../../../ui/jihun/memberassetdetails/MemberAssetDetailsTable.jsx"
import PaymentCollectionModal from "./PaymentCollectionModal.jsx"
import {
  memberassetdetailsLookupGrades
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

  // 초기 데이터 로딩 함수
  const loadInitialData = async () => {
    try {
      // 실제로는 API 호출이 들어갈 자리
      // 현재는 더미 데이터로 "불러와졌다" 상태 표시
      const dummyData = [
        {
          id: "store1",
          name: "가맹점1",
          phone: "",
          grade: "일반",
          franchiseName: "",
          cmHeld: "0",
          cmpHeld: "0",
          cashHeld: "0",
          registrationDate: "2025-07-17 03:42:55"
        },
        {
          id: "yeomkh111",
          name: "정택준",
          phone: "",
          grade: "일반",
          franchiseName: "",
          cmHeld: "2,600",
          cmpHeld: "100",
          cashHeld: "0",
          registrationDate: "2025-07-14 08:31:58"
        },
        {
          id: "lje3299",
          name: "이정은",
          phone: "",
          grade: "일반",
          franchiseName: "",
          cmHeld: "100,000,600",
          cmpHeld: "0",
          cashHeld: "0",
          registrationDate: "2025-06-30 01:28:22"
        },
        {
          id: "gyu5922",
          name: "세덕규",
          phone: "",
          grade: "가맹점",
          franchiseName: "가맹점",
          cmHeld: "100,000,600",
          cmpHeld: "0",
          cashHeld: "0",
          registrationDate: "2025-07-02 03:06:38"
        },
        {
          id: "gyu5921",
          name: "두덕규",
          phone: "",
          grade: "사업자",
          franchiseName: "",
          cmHeld: "100,001,100",
          cmpHeld: "0",
          cashHeld: "0",
          registrationDate: "2025-07-02 03:05:21"
        },
        {
          id: "kaja7776",
          name: "김자영",
          phone: "",
          grade: "가맹점",
          franchiseName: "가맹점",
          cmHeld: "1,500",
          cmpHeld: "0",
          cashHeld: "0",
          registrationDate: "2025-06-30 01:28:22"
        },
        {
          id: "5008LEE",
          name: "이완택",
          phone: "01087388877",
          grade: "일반",
          franchiseName: "",
          cmHeld: "100",
          cmpHeld: "0",
          cashHeld: "0",
          registrationDate: "2025-06-17 17:46:47"
        }
      ]
      
      setSearchResults(dummyData)
      console.log(`초기 데이터 로딩 완료: ${dummyData.length}개의 항목`)
    } catch (error) {
      console.error("초기 데이터 로딩 중 오류:", error)
      setSearchResults([])
    }
  }
  
  useEffect(() => {
    const loadOptions = async () => {
      try {
        setLoading(true)
        const gradesRes = await memberassetdetailsLookupGrades()
        setOptions({
          grades: gradesRes.data || []
        })
        
        // 초기 데이터 로딩
        await loadInitialData()
      } catch (error) {
        console.error("옵션 데이터 로딩 중 오류:", error)
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
  }, [])

  // 폼 입력 변경 핸들러 (성능 최적화)
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const [error, setError] = useState(null);

  const handleSearch = async () => {
    try {
      setLoading(true)
      
      // 검색 조건 준비
      const searchRequest = {
        id: formData.id ? formData.id.trim() : null,
        name: formData.name ? formData.name.trim() : null,
        phone: formData.phone ? formData.phone.trim() : null,
        grade: formData.grade ? parseInt(formData.grade) : null,
        page: 0,
        size: 1000
      }
      
      // null 값 제거하여 실제로 검색할 조건만 전달
      const cleanSearchRequest = Object.fromEntries(
        Object.entries(searchRequest).filter(([_, value]) => value !== null && value !== undefined)
      )
      
      console.log("검색 요청:", cleanSearchRequest)
      
      // 실제로는 API 호출이 들어갈 자리
      // 현재는 더미 데이터로 "불러와졌다" 상태 표시
      console.log("검색 조건:", formData)
      
      // 검색 조건에 따른 필터링 (더미)
      const filteredData = searchResults.filter(item => {
        let matches = true
        
        if (formData.id && formData.id.trim() !== '') {
          const searchTerm = formData.id.toLowerCase().trim()
          if (!item.id.toLowerCase().includes(searchTerm)) {
            matches = false
          }
        }
        
        if (formData.name && formData.name.trim() !== '') {
          const searchTerm = formData.name.toLowerCase().trim()
          if (!item.name.toLowerCase().includes(searchTerm)) {
            matches = false
          }
        }
        
        if (formData.phone && formData.phone.trim() !== '') {
          const searchTerm = formData.phone.toLowerCase().trim()
          if (!item.phone.toLowerCase().includes(searchTerm)) {
            matches = false
          }
        }
        
        if (formData.grade && formData.grade !== '') {
          if (item.grade !== options.grades.find(g => g.index.toString() === formData.grade)?.name) {
            matches = false
          }
        }
        
        return matches
      })

      console.log(`검색 완료: 총 ${filteredData.length}개의 결과를 찾았습니다.`)
      setSearchResults(filteredData)
    } catch (error) {
      console.error("검색 중 오류 발생:", error)
      setError("검색 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  // 선택된 행들 처리 핸들러
  const handleSelectionChange = (newSelection) => {
    // Set으로 안전한 선택 처리
    const safeSelection = newSelection instanceof Set ? newSelection : new Set(newSelection || []);
    setSelectedRows(safeSelection);
    console.log('선택된 행들:', Array.from(safeSelection));
  }

  // 엑셀 다운로드 핸들러
  const handleExcelDownload = () => {
    // 데이터 변환 (순번 추가)
    const excelData = searchResults.map((row, index) => ({
      '순번': index + 1,
      '아이디': row.id || '',
      '이름': row.name || '',
      '전화번호': row.phone || '',
      '등급': row.grade || '',
      '가맹점명': row.franchiseName || '',
      '보유 CM': row.cmHeld || 0,
      '보유 CMP': row.cmpHeld || 0,
      '보유 Cash': row.cashHeld || 0,
      '등록일': row.registrationDate || ''
    }));

    downloadSelectedExcel(excelData, selectedRows, '회원자산현황', '회원자산현황');
  }

  // 지급 및 회수 핸들러
  const handlePaymentAndCollection = () => {
    if (selectedRows.size === 0) {
      alert("지급 및 회수할 항목을 선택해주세요.");
      return;
    }
    
    // 디버깅을 위한 로그
    console.log("선택된 행들:", Array.from(selectedRows));
    console.log("검색 결과:", searchResults);
    
    // 다중선택 지원 - 첫 번째 선택된 항목으로 모달 열기 (대표 정보 표시용)
    const selectedIndex = Array.from(selectedRows)[0];
    console.log("선택된 인덱스:", selectedIndex);
    console.log("검색 결과 길이:", searchResults.length);
    
    // 인덱스 범위 체크 및 안전한 처리
    let member;
    if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
      member = searchResults[selectedIndex];
    } else {
      // 인덱스가 범위를 벗어난 경우, 첫 번째 데이터 사용
      console.warn("인덱스 범위 오류, 첫 번째 데이터 사용:", selectedIndex);
      member = searchResults[0];
    }
    console.log("선택된 회원:", member);
    
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
  const handlePaymentSubmit = (paymentData) => {
    console.log("지급/회수 데이터:", paymentData);
    
    // 다중선택된 항목들에 대해 처리
    if (selectedRows.size > 1) {
      const selectedMembers = Array.from(selectedRows).map(index => searchResults[index]);
      console.log("다중선택된 회원들:", selectedMembers);
      alert(`${paymentData.type} 처리가 ${selectedRows.size}명의 회원에 대해 완료되었습니다. (더미 기능)`);
    } else {
      alert(`${paymentData.type} 처리가 완료되었습니다. (더미 기능)`);
    }
    
    // 실제로는 여기서 API 호출을 통해 지급/회수 처리
    // 예: await processPayment(paymentData);
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
            className="member-asset-details-btn search"
            onClick={handleSearch}
            disabled={loading}
          >
            {loading ? "조회 중..." : "조회"}
          </button>
          <button
            className="member-asset-details-btn payment"
            onClick={handlePaymentAndCollection}
            disabled={false}
          >
            지급 및 회수
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