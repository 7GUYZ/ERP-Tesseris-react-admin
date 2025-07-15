"use client"

import { useState, useEffect } from "react"
import { CircularProgress, Box, Typography, Button } from "@mui/material"
import AdminLayout from "../../components/layout/dabin/AdminLayout";
import SalesPerformanceSearchForm from "../../components/feature/dabin/sales/SalesPerformanceSearchForm";
import SalesPerformanceDataGrid from "../../components/feature/dabin/sales/SalesPerformanceDataGrid";
import SalesPerformanceExcelDownloadButton from "../../components/feature/dabin/sales/SalesPerformanceExcelDownloadButton";
import { getBusinessGradeList, getStoreRequestStatusList, searchSalesPerformance } from "../../api/Auth";

const SalesPerformancePage = () => {
  const [searchParams, setSearchParams] = useState({})
  const [currentForm, setCurrentForm] = useState({})
  const [salesData, setSalesData] = useState([])
  const [businessGrades, setBusinessGrades] = useState([])
  const [storeRequestStatuses, setStoreRequestStatuses] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getBusinessGradeList(),
      getStoreRequestStatusList(),
      searchSalesPerformance({}),
    ])
      .then(([gradeRes, statusRes, searchRes]) => {
        // Ensure we always set arrays, even if API returns something else
        setBusinessGrades(Array.isArray(gradeRes.data) ? gradeRes.data : [])
        setStoreRequestStatuses(Array.isArray(statusRes.data) ? statusRes.data : [])

        // Ensure search results is an array before mapping
        const searchData = Array.isArray(searchRes.data) ? searchRes.data : []
        const dataWithId = searchData.map((row, idx) => ({
          ...row,
          id: `${row.businessUserId || 'unknown'}-${row.storeUserId || 'unknown'}-${row.businessUserName || 'unknown'}-${idx}`,
        }))
        setSalesData(dataWithId)
        console.log("영업실적 개수:", dataWithId.length)
      })
      .catch((error) => {
        console.error("API Error:", error)
        // Set empty arrays on error
        setBusinessGrades([])
        setStoreRequestStatuses([])
        setSalesData([])
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSearch = (params) => {
    setSearchParams(params)
    setLoading(true)
    searchSalesPerformance(params)
      .then((res) => {
        // Ensure search results is an array before mapping
        const searchData = Array.isArray(res.data) ? res.data : []
        const dataWithId = searchData.map((row, idx) => ({
          ...row,
          id: `${row.businessUserId || 'unknown'}-${row.storeUserId || 'unknown'}-${row.businessUserName || 'unknown'}-${idx}`,
        }))
        setSalesData(dataWithId)
        console.log("영업실적 개수:", dataWithId.length)
      })
      .catch((error) => {
        console.error("Search Error:", error)
        setSalesData([])
      })
      .finally(() => setLoading(false))
  }

  return (
    <AdminLayout>
      <Box
        sx={{
          maxWidth: 1200,
          margin: '18px auto',
          padding: 4,
          background: '#fff',
          borderRadius: 3,
          boxShadow: 2,
        }}
      >
        {/* 제목과 버튼들을 같은 줄에 배치 */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
          <Typography variant="h4" fontWeight={500} color="text.primary">
            영업실적 조회
          </Typography>
          <Box display="flex" gap={2}>
            <SalesPerformanceExcelDownloadButton data={salesData} />
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
        <SalesPerformanceSearchForm
          onSearch={handleSearch}
          businessGrades={businessGrades}
          storeRequestStatuses={storeRequestStatuses}
          onParamsChange={setCurrentForm}
        />
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>로딩중...</Typography>
          </Box>
        ) : (
          <SalesPerformanceDataGrid data={salesData} />
        )}
      </Box>
    </AdminLayout>
  )
}

export default SalesPerformancePage 