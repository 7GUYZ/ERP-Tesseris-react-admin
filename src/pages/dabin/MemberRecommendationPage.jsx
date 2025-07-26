"use client"

import { useState, useEffect } from "react"
import { CircularProgress, Box, Typography, Button } from "@mui/material"
import MemberRecommendationSearchForm from "../../components/forms/dabin/memberRecommendation/MemberRecommendationSearchForm";
import MemberRecommendationDataGrid from "../../components/forms/dabin/memberRecommendation/MemberRecommendationDataGrid";
import MemberRecommendationExcelDownloadButton from "../../components/forms/dabin/memberRecommendation/MemberRecommendationExcelDownloadButton";
import { getUserRoles, searchMemberRecommendations } from "../../api/auth/DabinAuth";
import '../../styles/dabin/dabinPageLayout.css';

const MemberRecommendationPage = () => {
  const [searchParams, setSearchParams] = useState({})
  const [currentForm, setCurrentForm] = useState({})
  const [recommendations, setRecommendations] = useState([])
  const [userRoles, setUserRoles] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getUserRoles(),
      searchMemberRecommendations({}),
    ])
      .then(([rolesRes, searchRes]) => {
        setUserRoles(Array.isArray(rolesRes.data) ? rolesRes.data : [])
        const searchData = Array.isArray(searchRes.data) ? searchRes.data : []
        const dataWithId = searchData.map((row, idx) => ({
          ...row,
          id: `${row.suggestionUserId}-${row.recommendationUserId}-${idx}`,
        }))
        setRecommendations(dataWithId)
        console.log("회원 추천현황 개수:", dataWithId.length)
      })
      .catch((error) => {
        console.error("API Error:", error)
        setUserRoles([])
        setRecommendations([])
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSearch = (params) => {
    setSearchParams(params)
    setLoading(true)
    searchMemberRecommendations(params)
      .then((res) => {
        const searchData = Array.isArray(res.data) ? res.data : []
        const dataWithId = searchData.map((row, idx) => ({
          ...row,
          id: `${row.suggestionUserId}-${row.recommendationUserId}-${idx}`,
        }))
        setRecommendations(dataWithId)
        console.log("회원 추천현황 개수:", dataWithId.length)
      })
      .catch((error) => {
        console.error("Search Error:", error)
        setRecommendations([])
      })
      .finally(() => setLoading(false))
  }

  return (
    <Box className="dabin-page-layout-container">
      {/* 제목과 버튼들을 같은 줄에 배치 */}
      <Box className="dabin-page-layout-titleRow">
        <Typography variant="h4" className="dabin-page-layout-title">
          회원 추천현황
        </Typography>
        <Box className="dabin-page-layout-buttonGroup">
          <MemberRecommendationExcelDownloadButton data={recommendations} />
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              const toDateTime = (dateStr) => (dateStr ? `${dateStr}T00:00:00` : undefined)
              const params = {
                ...currentForm,
                joinDateStart: toDateTime(currentForm.joinDateStart),
                joinDateEnd: toDateTime(currentForm.joinDateEnd),
                suggestionUserRole: currentForm.suggestionUserRole ? Number(currentForm.suggestionUserRole) : undefined,
                recommendationUserRole: currentForm.recommendationUserRole ? Number(currentForm.recommendationUserRole) : undefined,
              }
              handleSearch(params)
            }}
            sx={{ height: 40 }}
          >
            조회
          </Button>
        </Box>
      </Box>
      <MemberRecommendationSearchForm
        onSearch={handleSearch}
        userRoles={userRoles}
        onParamsChange={setCurrentForm}
      />
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>로딩중...</Typography>
        </Box>
      ) : (
        <MemberRecommendationDataGrid data={recommendations} />
      )}
    </Box>
  )
}

export default MemberRecommendationPage 