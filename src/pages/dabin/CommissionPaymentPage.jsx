"use client"

import { useState, useEffect } from "react"
import { CircularProgress, Box, Typography, Button } from "@mui/material"
import CommissionPaymentSearchForm from "../../components/forms/dabin/commissionPayment/CommissionPaymentSearchForm";
import CommissionPaymentDataGrid from "../../components/forms/dabin/commissionPayment/CommissionPaymentDataGrid";
import CommissionPaymentExcelDownloadButton from "../../components/forms/dabin/commissionPayment/CommissionPaymentExcelDownloadButton";
import { searchCommissionPayments, updateCommissionPaymentStatus, validateCommissionPaymentEligibility } from "../../api/auth/DabinAuth";
import { api } from "../../api/Http";
import '../../styles/dabin/dabinPageLayout.css';

const CommissionPaymentPage = () => {
  const [searchParams, setSearchParams] = useState({})
  const [currentForm, setCurrentForm] = useState({})
  const [commissionData, setCommissionData] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedRows, setSelectedRows] = useState([])

  useEffect(() => {
    setLoading(true)
    
    // 먼저 간단한 테스트 API 호출
    console.log("=== API 연결 테스트 시작 ===")
    console.log("현재 baseURL:", api.defaults.baseURL)
    console.log("현재 토큰:", localStorage.getItem("access-token"))
    
    searchCommissionPayments({})
      .then((res) => {
        console.log("=== API 응답 성공 ===")
        console.log("API 응답 전체:", res)
        console.log("API 응답 데이터:", res.data)
        console.log("API 응답 타입:", typeof res.data)
        console.log("API 응답이 배열인가:", Array.isArray(res.data))
        
        // ResponseDTO 구조에 맞게 데이터 추출
        const responseData = res.data?.data || res.data
        console.log("추출된 데이터:", responseData)
        console.log("추출된 데이터 타입:", typeof responseData)
        console.log("추출된 데이터가 배열인가:", Array.isArray(responseData))
        
        // Ensure search results is an array before mapping
        const searchData = Array.isArray(responseData) ? responseData : []
        console.log("처리된 검색 데이터:", searchData)
        
        const dataWithId = searchData.map((row, idx) => ({
          ...row,
          id: `${row.userId || 'unknown'}-${row.userIndex || 'unknown'}-${idx}`,
        }))
        setCommissionData(dataWithId)
        console.log("수당 지급 내역 개수:", dataWithId.length)
        console.log("최종 데이터:", dataWithId)
      })
      .catch((error) => {
        console.error("=== API 응답 실패 ===")
        console.error("API Error:", error)
        console.error("API Error Response:", error.response)
        console.error("API Error Status:", error.response?.status)
        console.error("API Error Data:", error.response?.data)
        setCommissionData([])
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSearch = (params) => {
    console.log("=== 검색 파라미터 상세 ===");
    console.log("전체 파라미터:", params);
    console.log("추천인 등급 (userRoleIndex):", params.userRoleIndex);
    console.log("추천인 등급 타입:", typeof params.userRoleIndex);
    console.log("추천인 등급이 빈 문자열인가:", params.userRoleIndex === "");
    
    setSearchParams(params)
    setLoading(true)
    searchCommissionPayments(params)
      .then((res) => {
        console.log("=== 검색 API 응답 성공 ===")
        console.log("검색 응답 데이터:", res.data)
        
        // ResponseDTO 구조에 맞게 데이터 추출
        const responseData = res.data?.data || res.data
        console.log("검색 추출된 데이터:", responseData)
        
        // Ensure search results is an array before mapping
        const searchData = Array.isArray(responseData) ? responseData : []
        const dataWithId = searchData.map((row, idx) => ({
          ...row,
          id: `${row.userId || 'unknown'}-${row.userIndex || 'unknown'}-${idx}`,
        }))
        setCommissionData(dataWithId)
        console.log("수당 지급 내역 개수:", dataWithId.length)
      })
      .catch((error) => {
        console.error("Search Error:", error)
        setCommissionData([])
      })
      .finally(() => setLoading(false))
  }

  const handlePay = async () => {
    console.log("=== 지급 처리 시작 ===");
    console.log("선택된 행 개수:", selectedRows.length);
    console.log("선택된 행 데이터:", selectedRows);
    console.log("selectedRows 타입:", typeof selectedRows);
    console.log("selectedRows가 배열인가:", Array.isArray(selectedRows));
    
    // 각 선택된 행의 detailIndex 확인
    if (selectedRows.length > 0) {
      selectedRows.forEach((row, index) => {
        console.log(`지급 대상 행 ${index + 1}:`, {
          id: row.id,
          detailIndex: row.detailIndex,
          userId: row.userId,
          userName: row.userName
        });
      });
    }
    
    if (selectedRows.length === 0) {
      alert("지급할 충전 건을 선택하여 주십시오.");
      return;
    }

    if (!window.confirm("지급 하시겠습니까?")) {
      return;
    }

    setLoading(true);
    let successCount = 0;
    let failCount = 0;

    for (const selected of selectedRows) {
      try {
        console.log(`[${selected.detailIndex}] 지급 처리 시작`);
        console.log(`[${selected.detailIndex}] 현재 행 데이터:`, {
          detailIndex: selected.detailIndex,
          userId: selected.userId,
          userName: selected.userName,
          paymentStatus: selected.paymentStatus,
          transactionName: selected.transactionName,
          userRoleKorNm: selected.userRoleKorNm,
          userBankNumber: selected.userBankNumber,
          userBankName: selected.userBankName,
          userBankHolder: selected.userBankHolder
        });
        
        // 유효성 검사
        const validateRes = await validateCommissionPaymentEligibility(selected.detailIndex);
        console.log(`[${selected.detailIndex}] 유효성 검사 결과:`, validateRes.data);
        
        if (validateRes.data.resultCode !== 200 || !validateRes.data.data) {
          failCount++;
          console.error(`[${selected.detailIndex}] 유효성 검사 실패:`, validateRes.data.resultMessage);
          continue;
        }

        // 지급 처리
        console.log(`[${selected.detailIndex}] 지급 요청 파라미터:`, {
          detailIndexes: [selected.detailIndex],
          paymentStatus: "지급"
        });
        
        const payRes = await updateCommissionPaymentStatus({
          detailIndexes: [selected.detailIndex],
          paymentStatus: "지급"
        });

        console.log(`[${selected.detailIndex}] 지급 처리 결과:`, payRes.data);

        // resultMessage에서 실제 성공/실패 확인
        const isSuccess = payRes.data.resultMessage && payRes.data.resultMessage.includes('완료') && !payRes.data.resultMessage.includes('실패');
        
        if (payRes.data.resultCode === 200 && isSuccess) {
          successCount++;
          console.log(`[${selected.detailIndex}] 지급 성공`);
        } else {
          failCount++;
          console.error(`[${selected.detailIndex}] 지급 실패:`, payRes.data.resultMessage);
          console.error(`[${selected.detailIndex}] 전체 응답:`, payRes.data);
        }
      } catch (error) {
        failCount++;
        console.error(`[${selected.detailIndex}] 처리 실패:`, error);
        console.error(`[${selected.detailIndex}] 에러 상세:`, error.response?.data);
      }
    }

    // 결과 알림
    if (successCount > 0) {
      alert(`${successCount}건 지급 완료`);
    }
    if (failCount > 0) {
      alert(`${failCount}건 지급 실패`);
    }

    // 재조회
    console.log("=== 지급 후 재조회 시작 ===");
    console.log("현재 폼 데이터:", currentForm);
    
    // 현재 폼이 비어있으면 기본 검색 조건으로 재조회
    const searchParams = Object.keys(currentForm).length > 0 ? currentForm : {};
    console.log("재조회에 사용할 파라미터:", searchParams);
    
    handleSearch(searchParams);
    setLoading(false);
  };

  const handleNoPay = async () => {
    console.log("=== 미지급 처리 시작 ===");
    console.log("선택된 행 개수:", selectedRows.length);
    console.log("선택된 행 데이터:", selectedRows);
    
    // 각 선택된 행의 detailIndex 확인
    if (selectedRows.length > 0) {
      selectedRows.forEach((row, index) => {
        console.log(`미지급 대상 행 ${index + 1}:`, {
          id: row.id,
          detailIndex: row.detailIndex,
          userId: row.userId,
          userName: row.userName
        });
      });
    }
    
    if (selectedRows.length === 0) {
      alert("미지급할 충전 건을 선택하여 주십시오.");
      return;
    }

    if (!window.confirm("미지급 처리하시겠습니까?")) {
      return;
    }

    setLoading(true);
    let successCount = 0;
    let failCount = 0;

    for (const selected of selectedRows) {
      try {
        console.log(`[${selected.detailIndex}] 미지급 처리 시작`);
        console.log(`[${selected.detailIndex}] 현재 행 데이터:`, {
          detailIndex: selected.detailIndex,
          userId: selected.userId,
          userName: selected.userName,
          paymentStatus: selected.paymentStatus,
          transactionName: selected.transactionName,
          userRoleKorNm: selected.userRoleKorNm,
          userBankNumber: selected.userBankNumber,
          userBankName: selected.userBankName,
          userBankHolder: selected.userBankHolder
        });
        console.log(`[${selected.detailIndex}] 요청 파라미터:`, {
          detailIndexes: [selected.detailIndex],
          paymentStatus: "미지급"
        });
        
        const res = await updateCommissionPaymentStatus({
          detailIndexes: [selected.detailIndex],
          paymentStatus: "미지급"
        });

        console.log(`[${selected.detailIndex}] 미지급 응답:`, res.data);

        // resultMessage에서 실제 성공/실패 확인
        const isSuccess = res.data.resultMessage && res.data.resultMessage.includes('완료') && !res.data.resultMessage.includes('실패');
        
        if (res.data.resultCode === 200 && isSuccess) {
          successCount++;
          console.log(`[${selected.detailIndex}] 미지급 성공`);
        } else {
          failCount++;
          console.error(`[${selected.detailIndex}] 미지급 실패:`, res.data.resultMessage);
          console.error(`[${selected.detailIndex}] 전체 응답:`, res.data);
        }
      } catch (error) {
        failCount++;
        console.error(`[${selected.detailIndex}] 처리 실패:`, error);
        console.error(`[${selected.detailIndex}] 에러 상세:`, error.response?.data);
      }
    }

    // 결과 알림
    if (successCount > 0) {
      alert(`${successCount}건 미지급 완료`);
    }
    if (failCount > 0) {
      alert(`${failCount}건 미지급 실패`);
    }

    // 재조회
    console.log("=== 미지급 후 재조회 시작 ===");
    console.log("현재 폼 데이터:", currentForm);
    
    // 현재 폼이 비어있으면 기본 검색 조건으로 재조회
    const searchParams = Object.keys(currentForm).length > 0 ? currentForm : {};
    console.log("재조회에 사용할 파라미터:", searchParams);
    
    handleSearch(searchParams);
    setLoading(false);
  };

  const handleSelectionChange = (newSelection) => {
    console.log("=== 선택 변경 ===");
    console.log("새로운 선택 ID들:", newSelection);
    console.log("newSelection 타입:", typeof newSelection);
    console.log("newSelection이 배열인가:", Array.isArray(newSelection));
    console.log("전체 데이터:", commissionData);
    
    let selectedIds = [];
    
    // newSelection이 객체인 경우 (최신 DataGrid API)
    if (typeof newSelection === 'object' && newSelection !== null && !Array.isArray(newSelection)) {
      console.log("newSelection이 객체임, ids Set에서 추출");
      if (newSelection.ids && newSelection.ids instanceof Set) {
        selectedIds = Array.from(newSelection.ids);
        console.log("Set에서 추출된 ID들:", selectedIds);
      } else {
        console.log("newSelection 객체에 ids Set이 없음");
        setSelectedRows([]);
        return;
      }
    }
    // newSelection이 배열인 경우 (이전 DataGrid API)
    else if (Array.isArray(newSelection)) {
      console.log("newSelection이 배열임");
      selectedIds = newSelection;
    }
    // 그 외의 경우
    else {
      console.log("newSelection이 예상치 못한 타입임, 빈 배열로 처리");
      setSelectedRows([]);
      return;
    }
    
    // 선택된 행 데이터 찾기
    const selectedData = commissionData.filter(row => selectedIds.includes(row.id));
    console.log("필터링된 선택된 데이터:", selectedData);
    console.log("선택된 데이터 개수:", selectedData.length);
    
    // 각 선택된 행의 detailIndex 확인
    selectedData.forEach((row, index) => {
      console.log(`선택된 행 ${index + 1}:`, {
        id: row.id,
        detailIndex: row.detailIndex,
        userId: row.userId,
        userName: row.userName
      });
    });
    
    setSelectedRows(selectedData);
  };

  return (
    <Box className="dabin-page-layout-container">
      {/* 제목과 버튼들을 같은 줄에 배치 */}
      <Box className="dabin-page-layout-titleRow">
        <Typography variant="h4" className="dabin-page-layout-title">
          수당 지급 내역
        </Typography>
        <Box className="dabin-page-layout-buttonGroup">
          <CommissionPaymentExcelDownloadButton data={commissionData} />
          <Button
            variant="contained"
            color="success"
            onClick={handlePay}
            sx={{ height: 40, mr: 1 }}
          >
            지급
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleNoPay}
            sx={{ height: 40, mr: 1 }}
          >
            미지급
          </Button>
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
      <CommissionPaymentSearchForm
        onSearch={handleSearch}
        onParamsChange={setCurrentForm}
      />
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>로딩중...</Typography>
        </Box>
      ) : (
        <CommissionPaymentDataGrid 
          data={commissionData} 
          onSelectionChange={handleSelectionChange}
        />
      )}
    </Box>
  )
}

export default CommissionPaymentPage 