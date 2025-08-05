

import { useState, useEffect } from "react"
import { CircularProgress, Box, Typography, Button } from "@mui/material"

import MemberRecommendationSearchForm from "../../components/forms/dabin/memberRecommendation/MemberRecommendationSearchForm";
import MemberRecommendationDataGrid from "../../components/forms/dabin/memberRecommendation/MemberRecommendationDataGrid";
import MemberRecommendationExcelDownloadButton from "../../components/forms/dabin/memberRecommendation/MemberRecommendationExcelDownloadButton";
import { getUserRoles, searchMemberRecommendations } from "../../api/auth/DabinAuth";

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
          회원 추천현황
        </Typography>
        <div style={{ display: 'flex', gap: '12px' }}>
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
        <MemberRecommendationSearchForm
          onSearch={handleSearch}
          userRoles={userRoles}
          onParamsChange={setCurrentForm}
          onDateErrorsChange={handleDateErrorsChange}
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
        <MemberRecommendationDataGrid 
          data={recommendations} 
          onSelectionChange={handleSelectionChange}
        />
      )}
    </div>
  )
}

export default MemberRecommendationPage 