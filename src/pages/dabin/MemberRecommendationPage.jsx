

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
  const [selectedRows, setSelectedRows] = useState(new Set())
  const [dateErrors, setDateErrors] = useState({}) // 날짜 에러 상태 추가

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
        setSelectedRows(new Set()) // 검색 시 선택된 행들 초기화
        console.log("회원 추천현황 개수:", dataWithId.length)
      })
      .catch((error) => {
        console.error("Search Error:", error)
        setRecommendations([])
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
          회원 추천현황
        </Typography>
        <Box className="dabin-page-layout-buttonGroup">
          <MemberRecommendationExcelDownloadButton data={recommendations} selectedRows={selectedRows} />
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
              const params = {
                ...currentForm,
                joinDateStart: toDateTime(currentForm.joinDateStart),
                joinDateEnd: toEndDateTime(currentForm.joinDateEnd),
                suggestionUserRole: currentForm.suggestionUserRole ? Number(currentForm.suggestionUserRole) : undefined,
                recommendationUserRole: currentForm.recommendationUserRole ? Number(currentForm.recommendationUserRole) : undefined,
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
      <MemberRecommendationSearchForm
        onSearch={handleSearch}
        userRoles={userRoles}
        onParamsChange={setCurrentForm}
        onDateErrorsChange={handleDateErrorsChange}
      />
      {loading ? (
        <Box className="dabin-page-layout-loading">
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>로딩중...</Typography>
        </Box>
      ) : (
        <MemberRecommendationDataGrid 
          data={recommendations} 
          onSelectionChange={handleSelectionChange}
        />
      )}
    </Box>
  )
}

export default MemberRecommendationPage 