

import { useState, useEffect } from "react"
import { CircularProgress, Box, Typography, Button } from "@mui/material"


import CouponSearchForm from "../../components/forms/dabin/coupon/CouponSearchForm";
import CouponDataGrid from "../../components/forms/dabin/coupon/CouponDataGrid";
import CouponExcelDownloadButton from "../../components/forms/dabin/coupon/CouponExcelDownloadButton";
import { getCouponIssuanceStatus, getCouponProvidedStatus, searchCoupons } from "../../api/auth/DabinAuth";
import '../../styles/dabin/dabinPageLayout.css';

const CouponAdminPage = () => {
  const [currentForm, setCurrentForm] = useState({})
  const [coupons, setCoupons] = useState([])
  const [issuanceStatus, setIssuanceStatus] = useState([])
  const [providedStatus, setProvidedStatus] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedRows, setSelectedRows] = useState(new Set())
  const [dateErrors, setDateErrors] = useState({}) // 날짜 에러 상태 추가



  useEffect(() => {
    setLoading(true)
    Promise.all([
      getCouponIssuanceStatus(),
      getCouponProvidedStatus(),
      searchCoupons({}),
    ])
      .then(([issuanceRes, providedRes, searchRes]) => {
        setIssuanceStatus(Array.isArray(issuanceRes.data) ? issuanceRes.data : [])
        setProvidedStatus(Array.isArray(providedRes.data) ? providedRes.data : [])
        const searchData = Array.isArray(searchRes.data) ? searchRes.data : []
        
        // 데이터 구조 로깅
        console.log("API 응답 전체:", searchRes);
        console.log("쿠폰 데이터 개수:", searchData.length);
        if (searchData.length > 0) {
          console.log("첫 번째 쿠폰 데이터:", searchData[0]);
          console.log("첫 번째 쿠폰 가격:", searchData[0].couponPrice);
          console.log("첫 번째 쿠폰 한도:", searchData[0].couponLimit);
          console.log("첫 번째 쿠폰 발행일:", searchData[0].couponIssuanceTime);
        }
        
        const dataWithId = searchData.map((row, idx) => ({
          ...row,
          id: row.couponIndex || `${row.couponName}-${row.couponIssuanceTime}-${idx}`,
        }))
        setCoupons(dataWithId)
        console.log("쿠폰 개수:", dataWithId.length)
      })
      .catch((error) => {
        console.error("API Error:", error)
        setIssuanceStatus([])
        setProvidedStatus([])
        setCoupons([])
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSearch = (params) => {
    setLoading(true)
    searchCoupons(params)
      .then((res) => {
        const searchData = Array.isArray(res.data) ? res.data : []
        const dataWithId = searchData.map((row, idx) => ({
          ...row,
          id: row.couponIndex || `${row.couponName}-${row.couponIssuanceTime}-${idx}`,
        }))
        setCoupons(dataWithId)
        setSelectedRows(new Set()) // 검색 시 선택된 행들 초기화
        console.log("쿠폰 개수:", dataWithId.length)
      })
      .catch((error) => {
        console.error("Search Error:", error)
        setCoupons([])
        setSelectedRows(new Set())
      })
      .finally(() => setLoading(false))
  }

  const handleSelectionChange = (newSelection) => {
    setSelectedRows(newSelection);
  }

  // 날짜 에러 상태 업데이트 함수
  const handleDateErrorsChange = (errors) => {
    setDateErrors(errors);
  }

  // 날짜 에러가 있는지 확인
  const hasDateErrors = Object.values(dateErrors).some(error => error !== "");

  return (
    <Box className="dabin-page-layout-container">
      {/* 제목과 버튼들을 같은 줄에 배치 */}
      <Box className="dabin-page-layout-titleRow">
        <Typography variant="h4" className="dabin-page-layout-title">
          쿠폰 관리
        </Typography>
        <Box className="dabin-page-layout-buttonGroup">
          <CouponExcelDownloadButton data={coupons} selectedRows={selectedRows} />

          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              const toDateTime = (dateStr) => (dateStr ? `${dateStr}T00:00:00` : undefined)
              const toEndDateTime = (dateStr) => {
                if (!dateStr) return undefined
                const date = new Date(dateStr)
                date.setDate(date.getDate() + 1)
                return date.toISOString().split('T')[0] + 'T00:00:00'
              }
              const toLimitEndDateTime = (dateStr) => {
                if (!dateStr) return undefined
                // 만기일은 정확히 해당 날짜까지만 포함
                return `${dateStr}T23:59:59`
              }
              const params = {
                ...currentForm,
                issuanceStart: toDateTime(currentForm.issuanceStart),
                issuanceEnd: toEndDateTime(currentForm.issuanceEnd),
                providedStart: toDateTime(currentForm.providedStart),
                providedEnd: toEndDateTime(currentForm.providedEnd),
                limitStart: toDateTime(currentForm.limitStart),
                limitEnd: toLimitEndDateTime(currentForm.limitEnd),
                couponPrice: currentForm.couponPrice ? Number(currentForm.couponPrice) : undefined,
              }
              handleSearch(params)
            }}
            disabled={hasDateErrors}
            sx={{ height: 40 }}
          >
            조회
          </Button>
        </Box>
      </Box>
      <CouponSearchForm
        onSearch={handleSearch}
        issuanceStatus={issuanceStatus}
        providedStatus={providedStatus}
        onParamsChange={setCurrentForm}
        onDateErrorsChange={handleDateErrorsChange}
      />
      {loading ? (
        <Box className="dabin-page-layout-loading">
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>로딩중...</Typography>
        </Box>
      ) : (
        <CouponDataGrid 
          data={coupons} 
          onSelectionChange={handleSelectionChange}
        />
      )}
    </Box>
  )
}

export default CouponAdminPage
