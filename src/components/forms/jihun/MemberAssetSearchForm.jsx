import { useState, useEffect } from "react"
import MemberAssetSearchInput from "../../ui/jihun/MemberAssetSearchInput.jsx"
import MemberAssetSearchSelect from "../../ui/jihun/MemberAssetSearchSelect.jsx"
import MemberAssetSearchTable from "../../ui/jihun/MemberAssetSearchTable.jsx"
import {
  memberaccount,
  memberaccountSearch,
  memberaccountLookupRoles,
  // memberaccountLookupValueTypes, // 가치 유형은 현재 사용하지 않지만 확장성을 위해 주석 처리
  memberaccountLookupPaymentTypes,
  memberaccountLookupTransactionTypes
} from "../../../api/auth/JihunAuth.jsx"
import "../../../styles/jihun/MemberAssetSearchForm.css"

/**
 * 회원 자산 검색 폼 컴포넌트
 * 
 * 주요 기능:
 * 1. 회원 자산 내역 검색
 * 2. 동적 검색 조건 지원
 * 3. 페이징 처리된 결과 표시
 * 
 * 가치 유형 관련:
 * - 현재는 가치 유형 선택 UI를 제공하지 않음
 * - 검색 시 가치 유형을 null로 보내 전체 검색이 가능하도록 함
 * - 향후 확장성을 고려하여 백엔드에서는 모든 가치 유형 데이터를 제공
 * - 필요시 프론트엔드에서 가치 유형 선택 UI를 추가할 수 있음
 */
const MemberAssetSearchForm = () => {
  const [formData, setFormData] = useState({
    fromId: "",
    toId: "",
    fromDate: "",
    toDate: "",
    fromGrade: "",
    toGrade: "",
    // valueType: "", // 가치 유형 필드 (현재 사용하지 않지만 확장성을 위해 주석 처리)
  })

  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [options, setOptions] = useState({
    roles: [],
    paymentTypes: [],
    transactionTypes: []
    // valueTypes: [], // 가치 유형은 현재 사용하지 않지만 확장성을 위해 주석 처리
  })

  // 컴포넌트 마운트 시 옵션 데이터 로드
  useEffect(() => {
    const loadOptions = async () => {
      try {
        setLoading(true)
        setError(null)

        // 병렬로 모든 옵션 데이터 로드
        const [rolesRes, paymentTypesRes, transactionTypesRes] = await Promise.all([
          memberaccountLookupRoles(),
          memberaccountLookupPaymentTypes(),
          memberaccountLookupTransactionTypes()
          // memberaccountLookupValueTypes(), // 가치 유형은 현재 사용하지 않지만 확장성을 위해 주석 처리
        ])

        console.log("옵션 데이터 응답:", {
          roles: rolesRes.data,
          paymentTypes: paymentTypesRes.data,
          transactionTypes: transactionTypesRes.data
        })

        setOptions({
          roles: rolesRes.data || [],
          paymentTypes: paymentTypesRes.data || [],
          transactionTypes: transactionTypesRes.data || []
          // valueTypes: valueTypesRes.data || [], // 가치 유형은 현재 사용하지 않지만 확장성을 위해 주석 처리
        })
      } catch (error) {
        console.error("옵션 데이터 로드 실패:", error)
        setError(error.message || "옵션 데이터를 불러오는데 실패했습니다.")
      } finally {
        setLoading(false)
      }
    }

    loadOptions()
  }, [])

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
      // valueType: "", // 가치 유형 필드 (현재 사용하지 않지만 확장성을 위해 주석 처리)
    })
    setSearchResults([])
    setError(null)
  }

  // 이메일에서 @ 뒤 도메인을 제거하는 함수
  const extractEmailId = (email) => {
    if (!email) return ""
    return email.split('@')[0] || ""
  }

  const handleSearch = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("검색 조건:", formData)

      // 백엔드 API 호출을 위한 검색 조건 매핑
      const searchRequest = {
        userIndexEventTrigger: formData.fromId || null,
        userIndexEventParty: formData.toId || null,
        userRoleIndex: formData.fromGrade ? parseInt(formData.fromGrade) : null,
        userRoleIndex2: formData.toGrade ? parseInt(formData.toGrade) : null,
        userCmLogValueTypeIndex: null, // 가치 유형은 전체 검색으로 처리 (확장성을 위해 null로 설정)
        // 향후 가치 유형 선택 UI가 추가되면: userCmLogValueTypeIndex: formData.valueType ? parseInt(formData.valueType) : null,
        userCmLogCreateTimeStart: formData.fromDate || null,
        userCmLogCreateTimeEnd: formData.toDate || null,
        userCmLogPaymentIndex: null,
        userCmLogTransactionTypeIndex: null,
        page: 0,
        size: 100
      }

      const response = await memberaccountSearch(searchRequest)
      console.log("검색 응답:", response.data)

      if (response.data && response.data.content) {
        // 백엔드 응답을 프론트엔드 형식으로 변환
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
        console.log("검색 결과:", transformedData)
      } else {
        setSearchResults([])
      }
    } catch (error) {
      console.error("검색 실패:", error)
      setError(error.message || "검색 중 오류가 발생했습니다.")
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  // 옵션 데이터를 Select 컴포넌트 형식으로 변환
  const getSelectOptions = (optionList) => {
    return optionList.map(item => ({
      value: item.index?.toString() || "",
      label: item.name || ""
    }))
  }

  return (
    <div className="member-asset-search-container">
      <div className="member-asset-search-header">
        <h1 className="member-asset-search-title">회원 자산 내역</h1>
        <div className="member-asset-search-actions">
          <button className="member-asset-search-btn reset" onClick={handleReset}>
            초기화
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

      {/* 에러 메시지 표시 */}
      {error && (
        <div style={{
          color: 'red',
          padding: '10px',
          margin: '10px 0',
          backgroundColor: '#ffe6e6',
          border: '1px solid #ff9999',
          borderRadius: '4px'
        }}>
          {error}
        </div>
      )}

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
            options={getSelectOptions(options.roles)}
            placeholder="등급을 선택하세요"
          />
          <MemberAssetSearchSelect
            label="TO 등급"
            value={formData.toGrade}
            onChange={(value) => handleInputChange("toGrade", value)}
            options={getSelectOptions(options.roles)}
            placeholder="등급을 선택하세요"
          />
        </div>



        <MemberAssetSearchTable data={searchResults} />
      </div>
    </div>
  )
}

export default MemberAssetSearchForm
