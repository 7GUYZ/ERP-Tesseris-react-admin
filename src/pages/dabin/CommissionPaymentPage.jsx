

import { useState, useEffect } from "react"
import { CircularProgress, Box, Typography, Button } from "@mui/material"
import CommissionPaymentSearchForm from "../../components/forms/dabin/commissionPayment/CommissionPaymentSearchForm";
import CommissionPaymentDataGrid from "../../components/forms/dabin/commissionPayment/CommissionPaymentDataGrid";
import CommissionPaymentExcelDownloadButton from "../../components/forms/dabin/commissionPayment/CommissionPaymentExcelDownloadButton";
import { searchCommissionPayments } from "../../api/auth/DabinAuth";
import { api } from "../../api/Http";
import '../../styles/dabin/dabinPageLayout.css';

const CommissionPaymentPage = () => {
  const [searchParams, setSearchParams] = useState({})
  const [currentForm, setCurrentForm] = useState({})
  const [commissionData, setCommissionData] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedRows, setSelectedRows] = useState(new Set())

  useEffect(() => {
    setLoading(true)
    
    // 먼저 간단한 테스트 API 호출
    console.log("=== API 연결 테스트 시작 ===")
    console.log("현재 baseURL:", api.defaults.baseURL)
    console.log("현재 토큰:", localStorage.getItem("access-token"))
    
    searchCommissionPayments({})
      .then((res) => {
        console.log("=== API 응답 성공 ===")
        console.log("API 응답 전체:", res)
        console.log("API 응답 데이터:", res.data)
        console.log("API 응답 타입:", typeof res.data)
        console.log("API 응답이 배열인가:", Array.isArray(res.data))
        
        // ResponseDTO 구조에 맞게 데이터 추출
        const responseData = res.data?.data || res.data
        console.log("추출된 데이터:", responseData)
        console.log("추출된 데이터 타입:", typeof responseData)
        console.log("추출된 데이터가 배열인가:", Array.isArray(responseData))
        
        // Ensure search results is an array before mapping
        const searchData = Array.isArray(responseData) ? responseData : []
        console.log("처리된 검색 데이터:", searchData)
        
        const dataWithId = searchData.map((row, idx) => ({
          ...row,
          id: `${row.userId || 'unknown'}-${row.userIndex || 'unknown'}-${idx}`,
        }))
        setCommissionData(dataWithId)
        setSelectedRows(new Set()) // 초기화
        console.log("수당 지급 내역 개수:", dataWithId.length)
        console.log("최종 데이터:", dataWithId)
      })
      .catch((error) => {
        console.error("=== API 응답 실패 ===")
        console.error("API Error:", error)
        console.error("API Error Response:", error.response)
        console.error("API Error Status:", error.response?.status)
        console.error("API Error Data:", error.response?.data)
        setCommissionData([])
        setSelectedRows(new Set())
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSearch = (params) => {
    console.log("=== 검색 파라미터 상세 ===");
    console.log("전체 파라미터:", params);
    console.log("추천인 등급 (userRoleIndex):", params.userRoleIndex);
    console.log("추천인 등급 타입:", typeof params.userRoleIndex);
    console.log("추천인 등급이 빈 문자열인가:", params.userRoleIndex === "");
    
    setSearchParams(params)
    setLoading(true)
    searchCommissionPayments(params)
      .then((res) => {
        console.log("=== 검색 API 응답 성공 ===")
        console.log("검색 응답 데이터:", res.data)
        
        // ResponseDTO 구조에 맞게 데이터 추출
        const responseData = res.data?.data || res.data
        console.log("검색 추출된 데이터:", responseData)
        
        // Ensure search results is an array before mapping
        const searchData = Array.isArray(responseData) ? responseData : []
        const dataWithId = searchData.map((row, idx) => ({
          ...row,
          id: `${row.userId || 'unknown'}-${row.userIndex || 'unknown'}-${idx}`,
        }))
        setCommissionData(dataWithId)
        setSelectedRows(new Set()) // 검색 시 선택된 행들 초기화
        console.log("수당 지급 내역 개수:", dataWithId.length)
      })
      .catch((error) => {
        console.error("Search Error:", error)
        setCommissionData([])
        setSelectedRows(new Set())
      })
      .finally(() => setLoading(false))
  }

  const handleSelectionChange = (newSelection) => {
    setSelectedRows(newSelection);
  }

  return (
    <Box className="dabin-page-layout-container">
      {/* 제목과 버튼들을 같은 줄에 배치 */}
      <Box className="dabin-page-layout-titleRow">
        <Typography variant="h4" className="dabin-page-layout-title">
          수당 지급 내역
        </Typography>
        <Box className="dabin-page-layout-buttonGroup">
          <CommissionPaymentExcelDownloadButton data={commissionData} selectedRows={selectedRows} />
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              handleSearch(currentForm)
            }}
            sx={{ height: 40 }}
          >
            조회
          </Button>
        </Box>
      </Box>
      <CommissionPaymentSearchForm
        onSearch={handleSearch}
        onParamsChange={setCurrentForm}
      />
      {loading ? (
        <Box className="dabin-page-layout-loading">
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>로딩중...</Typography>
        </Box>
      ) : (
        <CommissionPaymentDataGrid 
          data={commissionData} 
          onSelectionChange={handleSelectionChange}
        />
      )}
    </Box>
  )
}

export default CommissionPaymentPage 