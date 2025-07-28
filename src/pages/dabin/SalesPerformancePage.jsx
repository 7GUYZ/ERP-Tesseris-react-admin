

import { useState, useEffect } from "react"
import { CircularProgress, Box, Typography, Button } from "@mui/material"
import SalesPerformanceSearchForm from "../../components/forms/dabin/sales/SalesPerformanceSearchForm";
import SalesPerformanceDataGrid from "../../components/forms/dabin/sales/SalesPerformanceDataGrid";
import SalesPerformanceExcelDownloadButton from "../../components/forms/dabin/sales/SalesPerformanceExcelDownloadButton";
import { getBusinessGradeList, getStoreRequestStatusList, searchSalesPerformance } from "../../api/auth/DabinAuth";
import '../../styles/dabin/dabinPageLayout.css';

const SalesPerformancePage = () => {
  // 상태 관리
  const [currentForm, setCurrentForm] = useState({})           // 현재 검색 폼 데이터
  const [salesData, setSalesData] = useState([])               // 영업실적 데이터
  const [businessGrades, setBusinessGrades] = useState([])     // 사업자 등급 목록
  const [storeRequestStatuses, setStoreRequestStatuses] = useState([]) // 승인 상태 목록
  const [loading, setLoading] = useState(false)                // 로딩 상태
  const [selectedRows, setSelectedRows] = useState(new Set())  // 선택된 행들

  // 컴포넌트 마운트 시 초기 데이터 로드
  useEffect(() => {
    setLoading(true)
    Promise.all([
      getBusinessGradeList(),           // 사업자 등급 목록 조회
      getStoreRequestStatusList(),      // 승인 상태 목록 조회
      searchSalesPerformance({}),       // 전체 영업실적 조회
    ])
      .then(([gradeRes, statusRes, searchRes]) => {
        // API 응답 데이터 안전하게 처리
        setBusinessGrades(Array.isArray(gradeRes.data) ? gradeRes.data : [])
        setStoreRequestStatuses(Array.isArray(statusRes.data) ? statusRes.data : [])

        // 영업실적 데이터에 고유 ID 추가
        const searchData = Array.isArray(searchRes.data) ? searchRes.data : []
        const dataWithId = searchData.map((row, idx) => ({
          ...row,
          id: `${row.businessUserId || 'unknown'}-${row.storeUserId || 'unknown'}-${row.businessUserName || 'unknown'}-${idx}`,
        }))
        setSalesData(dataWithId)
        setSelectedRows(new Set())
      })
      .catch((error) => {
        console.error("API Error:", error)
        // 에러 시 빈 배열로 초기화
        setBusinessGrades([])
        setStoreRequestStatuses([])
        setSalesData([])
        setSelectedRows(new Set())
      })
      .finally(() => setLoading(false))
  }, [])

  // 검색 처리 함수
  const handleSearch = (params) => {
    setLoading(true)
    searchSalesPerformance(params)
      .then((res) => {
        const searchData = Array.isArray(res.data) ? res.data : []
        const dataWithId = searchData.map((row, idx) => ({
          ...row,
          id: `${row.businessUserId || 'unknown'}-${row.storeUserId || 'unknown'}-${row.businessUserName || 'unknown'}-${idx}`,
        }))
        setSalesData(dataWithId)
        setSelectedRows(new Set()) // 검색 시 선택된 행들 초기화
      })
      .catch((error) => {
        console.error("Search Error:", error)
        setSalesData([])
        setSelectedRows(new Set())
      })
      .finally(() => setLoading(false))
  }

  // 행 선택 변경 처리
  const handleSelectionChange = (newSelection) => {
    setSelectedRows(newSelection);
  }

  return (
    <Box className="dabin-page-layout-container">
      {/* 페이지 헤더 */}
      <Box className="dabin-page-layout-titleRow">
        <Typography variant="h4" className="dabin-page-layout-title">
          영업실적 조회
        </Typography>
        <Box className="dabin-page-layout-buttonGroup">
          <SalesPerformanceExcelDownloadButton data={salesData} selectedRows={selectedRows} />
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleSearch(currentForm)}
            sx={{ height: 40 }}
          >
            조회
          </Button>
        </Box>
      </Box>

      {/* 검색 폼 */}
      <SalesPerformanceSearchForm
        onSearch={handleSearch}
        businessGrades={businessGrades}
        storeRequestStatuses={storeRequestStatuses}
        onParamsChange={setCurrentForm}
      />

      {/* 데이터 그리드 또는 로딩 표시 */}
      {loading ? (
        <Box className="dabin-page-layout-loading">
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>로딩중...</Typography>
        </Box>
      ) : (
        <SalesPerformanceDataGrid 
          data={salesData} 
          onSelectionChange={handleSelectionChange}
        />
      )}
    </Box>
  )
}

export default SalesPerformancePage 