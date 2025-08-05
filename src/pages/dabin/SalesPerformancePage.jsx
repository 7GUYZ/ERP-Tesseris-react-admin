

import { useState, useEffect } from "react"
import { CircularProgress, Box, Typography, Button } from "@mui/material"

import SalesPerformanceSearchForm from "../../components/forms/dabin/sales/SalesPerformanceSearchForm";
import SalesPerformanceDataGrid from "../../components/forms/dabin/sales/SalesPerformanceDataGrid";
import SalesPerformanceExcelDownloadButton from "../../components/forms/dabin/sales/SalesPerformanceExcelDownloadButton";
import { getBusinessGradeList, getStoreRequestStatusList, searchSalesPerformance } from "../../api/auth/DabinAuth";

const SalesPerformancePage = () => {
  const [searchParams, setSearchParams] = useState({})
  const [currentForm, setCurrentForm] = useState({})
  const [salesData, setSalesData] = useState([])
  const [businessGrades, setBusinessGrades] = useState([])
  const [storeRequestStatuses, setStoreRequestStatuses] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedRows, setSelectedRows] = useState(new Set())



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
    <div style={{ 
      minHeight: '100vh',
      padding: '24px',
      backgroundColor: '#fff'
    }}>
      {/* 페이지 헤더 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '2px solid #F4F6FA'
      }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontSize: '28px',
            fontWeight: 700,
            color: '#222E3C',
            margin: 0
          }}
        >
          영업실적 조회
        </Typography>
        <div style={{ display: 'flex', gap: '12px' }}>
          <SalesPerformanceExcelDownloadButton data={salesData} selectedRows={selectedRows} />
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleSearch(currentForm)}
            sx={{ height: 40 }}
          >
            조회
          </Button>
        </div>
      </div>

      {/* 검색 조건 섹션 */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        padding: '20px'
      }}>
        <SalesPerformanceSearchForm
          onSearch={handleSearch}
          businessGrades={businessGrades}
          storeRequestStatuses={storeRequestStatuses}
          onParamsChange={setCurrentForm}
        />
      </div>

      {/* 결과 테이블 섹션 */}
      {loading ? (
        <Box style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px'
        }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>로딩중...</Typography>
        </Box>
      ) : (
        <SalesPerformanceDataGrid 
          data={salesData} 
          onSelectionChange={handleSelectionChange}
        />
      )}
    </div>
  )
}

export default SalesPerformancePage 