

import { useState, useEffect } from "react"
import { CircularProgress, Box, Typography, Button } from "@mui/material"
import { permissionCheckApi } from "../../api/auth/TaekjunAuth"
import { useToast } from "../../context/jungeun/ToastContext"
import CommissionPaymentSearchForm from "../../components/forms/dabin/commissionPayment/CommissionPaymentSearchForm";
import CommissionPaymentDataGrid from "../../components/forms/dabin/commissionPayment/CommissionPaymentDataGrid";
import CommissionPaymentExcelDownloadButton from "../../components/forms/dabin/commissionPayment/CommissionPaymentExcelDownloadButton";
import { searchCommissionPayments } from "../../api/auth/DabinAuth";
import { api } from "../../api/Http";

const CommissionPaymentPage = () => {
  const [searchParams, setSearchParams] = useState({})
  const [currentForm, setCurrentForm] = useState({})
  const [commissionData, setCommissionData] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedRows, setSelectedRows] = useState(new Set())
  const [canUpdate, setCanUpdate] = useState(false)
  const { showToast } = useToast()

  // 권한 체크
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const response = await permissionCheckApi.checkPermission(35); // programIndex: 35 (수당 지급 내역)
        if (response.data) {
          setCanUpdate(response.data.hasUpdateAuthority === 1);
          console.log('수수료 지급 수정 권한 체크 결과:', response.data.hasUpdateAuthority);
        }
      } catch (error) {
        console.error('권한 체크 실패:', error);
        setCanUpdate(false);
      }
    };
    
    checkPermission();
  }, []);
  const [dateErrors, setDateErrors] = useState({}) // 날짜 에러 상태 추가

  useEffect(() => {
    setLoading(true)
    
    searchCommissionPayments({})
      .then((res) => {
        console.log("=== API 응답 성공 ===")
        console.log("API 응답 전체:", res)
        console.log("API 응답 데이터:", res.data)
        
        // res.data.data에서 실제 데이터 추출
        const searchData = Array.isArray(res.data?.data) ? res.data.data : []
        console.log("처리된 검색 데이터:", searchData)
        console.log("수당 지급 내역 개수:", searchData.length)
        
        // 첫 번째 데이터의 구조 확인
        if (searchData.length > 0) {
          console.log("첫 번째 데이터 구조:", searchData[0])
          console.log("첫 번째 데이터의 키들:", Object.keys(searchData[0]))
          
          // 각 필드의 값도 확인
          console.log("=== 필드별 값 확인 ===")
          console.log("userIndex:", searchData[0].userIndex)
          console.log("userId:", searchData[0].userId)
          console.log("userName:", searchData[0].userName)
          console.log("userPhone:", searchData[0].userPhone)
          console.log("transactionName:", searchData[0].transactionName)
          console.log("advanceMsg:", searchData[0].advanceMsg)
          console.log("chargeTime:", searchData[0].chargeTime)
          console.log("description:", searchData[0].description)
          console.log("cmValue:", searchData[0].cmValue)
          console.log("cashValue:", searchData[0].cashValue)
          console.log("regularCashValue:", searchData[0].regularCashValue)
          console.log("suggestionUserId:", searchData[0].suggestionUserId)
          console.log("suggestionUserName:", searchData[0].suggestionUserName)
          console.log("suggestionUserPhone:", searchData[0].suggestionUserPhone)
          console.log("userRoleKorNm:", searchData[0].userRoleKorNm)
          console.log("userBankNumber:", searchData[0].userBankNumber)
          console.log("userBankName:", searchData[0].userBankName)
          console.log("userJumin:", searchData[0].userJumin)
          console.log("userBankHolder:", searchData[0].userBankHolder)
          console.log("paymentStatus:", searchData[0].paymentStatus)
          console.log("detailIndex:", searchData[0].detailIndex)
        }
        
        const dataWithId = searchData.map((row, idx) => ({
          ...row,
          id: `${row.userId || 'unknown'}-${row.detailIndex || 'unknown'}-${idx}`,
        }))
        setCommissionData(dataWithId)
        setSelectedRows(new Set()) // 초기화
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
    
    // 백엔드 DTO에 맞게 camelCase로 매핑
    const mappedParams = {
      userId: params.userId || "",
      userName: params.userName ? `%${params.userName}%` : "",
      userPhone: params.userPhone || "",
      chargeTimeStart: params.chargeTimeStart || "",
      chargeTimeEnd: params.chargeTimeEnd || "",
      transactionName: params.transactionName ? `%${params.transactionName}%` : "",
      suggestionUserId: params.suggestionUserId || "",
      suggestionUserName: params.suggestionUserName ? `%${params.suggestionUserName}%` : "",
      userRoleIndex: params.userRoleIndex || ""
    };
    
    console.log("매핑된 파라미터:", mappedParams);
    
    setSearchParams(mappedParams)
    setLoading(true)
    searchCommissionPayments(mappedParams)
      .then((res) => {
        console.log("=== 검색 API 응답 성공 ===")
        console.log("검색 응답 데이터:", res.data)
        
        // res.data.data에서 실제 데이터 추출
        const searchData = Array.isArray(res.data?.data) ? res.data.data : []
        console.log("검색 추출된 데이터:", searchData)
        
        // 첫 번째 데이터의 구조 확인
        if (searchData.length > 0) {
          console.log("검색 첫 번째 데이터 구조:", searchData[0])
          console.log("검색 첫 번째 데이터의 키들:", Object.keys(searchData[0]))
        
          // 각 필드의 값도 확인
          console.log("=== 검색 필드별 값 확인 ===")
          console.log("userIndex:", searchData[0].userIndex)
          console.log("userId:", searchData[0].userId)
          console.log("userName:", searchData[0].userName)
          console.log("userPhone:", searchData[0].userPhone)
          console.log("transactionName:", searchData[0].transactionName)
          console.log("advanceMsg:", searchData[0].advanceMsg)
          console.log("chargeTime:", searchData[0].chargeTime)
          console.log("description:", searchData[0].description)
          console.log("cmValue:", searchData[0].cmValue)
          console.log("cashValue:", searchData[0].cashValue)
          console.log("regularCashValue:", searchData[0].regularCashValue)
          console.log("suggestionUserId:", searchData[0].suggestionUserId)
          console.log("suggestionUserName:", searchData[0].suggestionUserName)
          console.log("suggestionUserPhone:", searchData[0].suggestionUserPhone)
          console.log("userRoleKorNm:", searchData[0].userRoleKorNm)
          console.log("userBankNumber:", searchData[0].userBankNumber)
          console.log("userBankName:", searchData[0].userBankName)
          console.log("userJumin:", searchData[0].userJumin)
          console.log("userBankHolder:", searchData[0].userBankHolder)
          console.log("paymentStatus:", searchData[0].paymentStatus)
          console.log("detailIndex:", searchData[0].detailIndex)
        }
        
        const dataWithId = searchData.map((row, idx) => ({
          ...row,
          id: `${row.userId || 'unknown'}-${row.detailIndex || 'unknown'}-${idx}`,
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
          수당 지급 내역
        </Typography>
        <div style={{ display: 'flex', gap: '12px' }}>
          <CommissionPaymentExcelDownloadButton data={commissionData} selectedRows={selectedRows} />
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              handleSearch(currentForm)
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
        <CommissionPaymentSearchForm
          onSearch={handleSearch}
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
        <>
          {console.log("DataGrid에 전달되는 데이터:", commissionData)}
          {console.log("DataGrid에 전달되는 데이터 개수:", commissionData.length)}
          <CommissionPaymentDataGrid 
            data={commissionData} 
            onSelectionChange={handleSelectionChange}
          />
        </>
      )}
    </div>
  )
}

export default CommissionPaymentPage 