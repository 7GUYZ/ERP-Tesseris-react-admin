"use client"

import { useState, useEffect } from "react"
import { CircularProgress, Box, Typography, Button } from "@mui/material"
import AdminLayout from "../../components/layout/dabin/AdminLayout";
import CouponSearchForm from "../../components/feature/dabin/coupon/CouponSearchForm";
import CouponDataGrid from "../../components/feature/dabin/coupon/CouponDataGrid";
import CouponExcelDownloadButton from "../../components/feature/dabin/coupon/CouponExcelDownloadButton";
import { getCouponIssuanceStatus, getCouponProvidedStatus, searchCoupons } from "../../api/Auth";

const CouponAdminPage = () => {
  const [searchParams, setSearchParams] = useState({})
  const [currentForm, setCurrentForm] = useState({})
  const [coupons, setCoupons] = useState([])
  const [issuanceStatus, setIssuanceStatus] = useState([])
  const [providedStatus, setProvidedStatus] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getCouponIssuanceStatus(),
      getCouponProvidedStatus(),
      searchCoupons({}),
    ])
      .then(([issuanceRes, providedRes, searchRes]) => {
        // Ensure we always set arrays, even if API returns something else
        setIssuanceStatus(Array.isArray(issuanceRes.data) ? issuanceRes.data : [])
        setProvidedStatus(Array.isArray(providedRes.data) ? providedRes.data : [])

        // Ensure search results is an array before mapping
        const searchData = Array.isArray(searchRes.data) ? searchRes.data : []
        const dataWithId = searchData.map((row, idx) => ({
          ...row,
          id: row.couponIndex || `${row.couponName}-${row.couponIssuanceTime}-${idx}`,
        }))
        setCoupons(dataWithId)
        console.log("쿠폰 개수:", dataWithId.length)
      })
      .catch((error) => {
        console.error("API Error:", error)
        // Set empty arrays on error
        setIssuanceStatus([])
        setProvidedStatus([])
        setCoupons([])
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSearch = (params) => {
    setSearchParams(params)
    setLoading(true)
    searchCoupons(params)
      .then((res) => {
        // Ensure search results is an array before mapping
        const searchData = Array.isArray(res.data) ? res.data : []
        const dataWithId = searchData.map((row, idx) => ({
          ...row,
          id: row.couponIndex || `${row.couponName}-${row.couponIssuanceTime}-${idx}`,
        }))
        setCoupons(dataWithId)
        console.log("쿠폰 개수:", dataWithId.length)
      })
      .catch((error) => {
        console.error("Search Error:", error)
        setCoupons([])
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
            쿠폰 관리
          </Typography>
          <Box display="flex" gap={2}>
            <CouponExcelDownloadButton data={coupons} />
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                // 날짜/가격 변환 로직 적용
                const toDateTime = (dateStr) => (dateStr ? `${dateStr}T00:00:00` : undefined)
                const params = {
                  ...currentForm,
                  issuanceStart: toDateTime(currentForm.issuanceStart),
                  issuanceEnd: toDateTime(currentForm.issuanceEnd),
                  providedStart: toDateTime(currentForm.providedStart),
                  providedEnd: toDateTime(currentForm.providedEnd),
                  limitStart: toDateTime(currentForm.limitStart),
                  limitEnd: toDateTime(currentForm.limitEnd),
                  couponPrice: currentForm.couponPrice ? Number(currentForm.couponPrice) : undefined,
                }
                handleSearch(params)
              }}
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
        />
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>로딩중...</Typography>
          </Box>
        ) : (
          <CouponDataGrid data={coupons} />
        )}
      </Box>
    </AdminLayout>
  )
}

export default CouponAdminPage
