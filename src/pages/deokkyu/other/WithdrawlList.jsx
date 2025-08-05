import React, { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import { getWithdrawalDetails, setupInterceptors } from '../../../api/auth/DeokkyuAuth';
import '../../../styles/deokkyu/common.css';
import '../../../styles/deokkyu/StoreCustomerList.css'; 
import NoRowsOverlay from '../../../components/ui/deokkyu/NoRowsOverlay';
import { downloadExcel } from '../../../components/feature/jihun/common/ExcelCommon';


// 주차별 날짜 데이터 생성 (현재 날짜 기준으로 과거 1년치)
const generateWeekRows = () => {
  const rows = [];
  const today = new Date();
  
  // 현재 주의 월요일 계산 (일요일인 경우 고려)
  const currentWeekMonday = new Date(today);
  const dayOfWeek = today.getDay(); // 0: 일요일, 1: 월요일, ..., 6: 토요일
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // 일요일이면 -6, 다른 날은 1-dayOfWeek
  currentWeekMonday.setDate(today.getDate() + daysToMonday);
  
  // 과거 52주 생성 (최신 주가 맨 위에 오도록)
  for (let i = 0; i < 52; i++) {
    const weekStart = new Date(currentWeekMonday);
    weekStart.setDate(currentWeekMonday.getDate() - (i * 7)); // 과거로 이동
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const year = weekStart.getFullYear();
    const month = String(weekStart.getMonth() + 1).padStart(2, '0');
    const weekNumber = Math.ceil((weekStart.getDate() + new Date(weekStart.getFullYear(), weekStart.getMonth(), 1).getDay()) / 7);
    
    const weekName = `${year}년 ${month}월 ${weekNumber}주`;
    
    rows.push({
      id: i + 1,
      weekName: weekName,
      weekIndex: i,
      startDate: weekStart.toISOString().split('T')[0],
      endDate: weekEnd.toISOString().split('T')[0]
    });
  }
  
  return rows;
};

const listColumns = [
  { field: 'userId', headerName: 'ID', width: 120 },
  { field: 'userName', headerName: '이름', width: 100 },
  { field: 'userPhone', headerName: '핸드폰 번호', width: 160 },
  { field: 'userBankName', headerName: '은행 이름', width: 160 },
  { field: 'userBankNumber', headerName: '계좌번호', width: 100 },
  { field: 'chargeAmount', headerName: '충전 금액', width: 100 },
  { field: 'transactionName', headerName: '거래명', width: 100 },
  { 
    field: 'chargeDate', 
    headerName: '충전일', 
    width: 120,
    renderCell: (params) => {
      if (!params.value) return '';
      
      // 배열 형태 [2025, 8, 4]를 "2025/08/04" 형식으로 변환
      if (Array.isArray(params.value) && params.value.length === 3) {
        const year = params.value[0];
        const month = String(params.value[1]).padStart(2, '0');
        const day = String(params.value[2]).padStart(2, '0');
        return `${year}/${month}/${day}`;
      }
      
      return params.value;
    }
  },
  { field: 'cmValue', headerName: 'TS', width: 100 },
];

const dateColumns = [
  { field: 'weekName', headerName: '주차', width: 200 },
];

function WithdrawlList() {
  const [loading, setLoading] = useState(false);
  const [withdrawalDetailRows, setWithdrawalDetailRows] = useState([]);


  // ============================================================================
  // API 호출 함수들
  // ============================================================================

  /**
   * 특정 주차의 출금 상세 리스트 조회
   * @param {string} startDate - 시작일 (YYYY-MM-DD)
   * @param {string} endDate - 종료일 (YYYY-MM-DD)
   */
  const fetchWithdrawalDetails = async (startDate, endDate) => {
    try {
      setLoading(true);
      
      const response = await getWithdrawalDetails({ startDate, endDate });
      console.log('👀 응답 데이터:', response.data);
      const rawList = response.data?.data;

      if (!Array.isArray(rawList)) {
        console.error('⚠️ 배열이 아님:', rawList);
        throw new Error('응답 데이터 형식 오류');
      }

      const data = rawList.map((item, index) => ({
        id: index + 1,
        ...item,
      }));

      setWithdrawalDetailRows(data);
    } catch (error) {
      console.error('출금 상세 조회 실패:', error);
      alert('출금 상세 내역을 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // 이벤트 핸들러
  // ============================================================================

  /**
   * 주차별 행 클릭 시 해당 주차의 출금 상세 리스트 조회
   * @param {Object} params - 클릭된 행의 파라미터
   */
  const handleWeekRowClick = (params) => {
    const row = params.row;
    console.log(`📅 선택된 주차: ${row.startDate} ~ ${row.endDate}`);
    fetchWithdrawalDetails(row.startDate, row.endDate);
  };

  // ============================================================================
  // 엑셀 다운로드 함수들
  // ============================================================================

  /**
   * 출금 상세 데이터 엑셀 다운로드
   */
  const handleExcelDownload = async () => {
    if (withdrawalDetailRows.length === 0) {
      alert('다운로드할 데이터가 없습니다.');
      return;
    }

    try {
      downloadExcel(withdrawalDetailRows, '출금상세_리스트', '출금상세정보');
    } catch (error) {
      console.error('엑셀 다운로드 오류:', error);
      alert('엑셀 다운로드 중 오류가 발생했습니다.');
    }
  };

  // 페이지 진입 시 인터셉터 설정
  useEffect(() => {
    setupInterceptors();
  }, []);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box className="deokkyu-container">
        {/* 페이지 제목 */}
        <div className="deokkyu-page-title">출금 관리</div>
        
        {/* 버튼 영역 */}
        <div className="deokkyu-actions">
          <button 
            className="deokkyu-btn all-excel" 
            onClick={handleExcelDownload}
            disabled={withdrawalDetailRows.length === 0}
          >
            엑셀 다운로드
          </button>
        </div>

        {/* 데이터 그리드 영역 */}
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          {/* 출금 요약 리스트 (주차별) */}
          <div className="data-grid-container1">
            <DataGrid
              rows={generateWeekRows()}
              columns={dateColumns}
              pageSize={25}
              rowsPerPageOptions={[25, 50, 100]}
              onRowClick={handleWeekRowClick}
              loading={loading}
              slots={{
                noRowsOverlay: () => <NoRowsOverlay loading={loading} />,
              }}
              sx={{
                '& .MuiDataGrid-cell': {
                  cursor: 'pointer',
                },
                '& .MuiDataGrid-cell:hover': {
                  backgroundColor: '#f5f5f5',
                }
              }}
            />
          </div>
          
          {/* 출금 상세 리스트 */}
          <div className="data-grid-container2">
            <DataGrid
              rows={withdrawalDetailRows}
              columns={listColumns}
              pageSize={25}
              rowsPerPageOptions={[25, 50, 100]}
              loading={loading}
              slots={{
                noRowsOverlay: () => <NoRowsOverlay loading={loading} />,
              }}
            />
          </div>
        </div>
      </Box>
    </LocalizationProvider>
  );
}

export default WithdrawlList;
