"use client"

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
        console.log("쿠폰 개수:", dataWithId.length)
      })
      .catch((error) => {
        console.error("Search Error:", error)
        setCoupons([])
      })
      .finally(() => setLoading(false))
  }

  return (
    <Box className="dabin-page-layout-container">
      {/* 제목과 버튼들을 같은 줄에 배치 */}
      <Box className="dabin-page-layout-titleRow">
        <Typography variant="h4" className="dabin-page-layout-title">
          쿠폰 관리
        </Typography>
        <Box className="dabin-page-layout-buttonGroup">
          <CouponExcelDownloadButton data={coupons} />
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
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
  )
}

export default CouponAdminPage
