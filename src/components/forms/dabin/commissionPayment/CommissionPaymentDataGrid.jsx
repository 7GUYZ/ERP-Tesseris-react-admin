"use client"
import { useState, useEffect, useMemo } from "react"
import { DataGrid } from "@mui/x-data-grid"

const CommissionPaymentDataGrid = ({ data, onSelectionChange }) => {
  const [selectedRows, setSelectedRows] = useState(new Set());

  console.log("DataGrid 컴포넌트에서 받은 데이터:", data);
  console.log("DataGrid 컴포넌트에서 받은 데이터 개수:", data.length);

  const processedData = useMemo(() => {
    const processed = data.map((row, index) => ({
      ...row,
      id: row.id || `${row.userId || 'unknown'}-${row.detailIndex || 'unknown'}-${index}`,
      lineNo: data.length - index // No 값을 역순으로 설정
    }));
    console.log("DataGrid processedData:", processed);
    
    // 첫 번째 행의 모든 필드명과 값을 자세히 로깅
    if (processed.length > 0) {
      console.log("=== 첫 번째 행 상세 분석 ===");
      const firstRow = processed[0];
      console.log("첫 번째 행 전체:", firstRow);
      console.log("첫 번째 행의 모든 키:", Object.keys(firstRow));
      console.log("chargeTime 값:", firstRow.chargeTime, "타입:", typeof firstRow.chargeTime);
      console.log("cmValue 값:", firstRow.cmValue, "타입:", typeof firstRow.cmValue);
      console.log("cashValue 값:", firstRow.cashValue, "타입:", typeof firstRow.cashValue);
      console.log("regularCashValue 값:", firstRow.regularCashValue, "타입:", typeof firstRow.regularCashValue);
    }
    
    return processed;
  }, [data]);

  useEffect(() => {
    // 데이터가 변경되면 선택 상태 초기화
    setSelectedRows(new Set());
  }, [data]);



  const columns = [
    { field: "lineNo", headerName: "No", width: 40, align: 'center', headerAlign: 'center' },
    { field: "userIndex", headerName: "충전 회원 인덱스", width: 130, align: 'left', headerAlign: 'center' },
    { field: "userId", headerName: "충전 회원 이메일", width: 200, align: 'left', headerAlign: 'center' },
    { field: "userName", headerName: "충전 회원 이름", width: 120, align: 'left', headerAlign: 'center' },
    { field: "userPhone", headerName: "충전 회원 번호", width: 130, align: 'center', headerAlign: 'center' },
    { field: "transactionName", headerName: "거래명", width: 180, align: 'left', headerAlign: 'center' },
    { field: "advanceMsg", headerName: "승인여부", width: 100, align: 'center', headerAlign: 'center' },
    { field: "chargeTime", headerName: "충전 시간", width: 200, align: 'center', headerAlign: 'center',
      valueFormatter: (params) => {
        // params가 직접 값인 경우 처리
        let value;
        if (typeof params === 'object' && params !== null && !Array.isArray(params)) {
          value = params.value;
        } else {
          value = params; // params가 직접 값인 경우
        }
        
        if (!value || value === 'null' || value === '') return "-";
        try {
          let date;
          if (Array.isArray(value)) {
            // 배열 형태: [년, 월, 일, 시, 분, 초] 또는 [년, 월, 일, 시, 분]
            let year, month, day, hour, minute, second;
            
            if (value.length === 6) {
              [year, month, day, hour, minute, second] = value;
            } else if (value.length === 5) {
              [year, month, day, hour, minute] = value;
              second = 0; // 초가 없으면 0으로 설정
            } else {
              return "-";
            }
            
            date = new Date(year, month - 1, day, hour, minute, second);
          } else {
            date = new Date(value);
          }
          // 유효한 날짜인지 확인
          if (isNaN(date.getTime())) {
            return "-";
          }
          const result = date.toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });
          return result;
        } catch (error) {
          return "-";
        }
      }
    },
    { field: "description", headerName: "충전내역", width: 100, align: 'center', headerAlign: 'center' },
    { field: "cmValue", headerName: "충전TS", width: 100, align: 'right', headerAlign: 'center' },
    { field: "cashValue", headerName: "결제금액", width: 120, align: 'right', headerAlign: 'center' },
    { field: "regularCashValue", headerName: "수당지급", width: 130, align: 'right', headerAlign: 'center' },
    { field: "suggestionUserId", headerName: "추천인 아이디", width: 200, align: 'left', headerAlign: 'center' },
    { field: "suggestionUserName", headerName: "추천인 이름", width: 120, align: 'left', headerAlign: 'center' },
    { field: "suggestionUserPhone", headerName: "추천인 연락처", width: 140, align: 'center', headerAlign: 'center' },
    { field: "userRoleKorNm", headerName: "추천인 등급", width: 100, align: 'center', headerAlign: 'center' },
    { field: "userBankNumber", headerName: "추천인 계좌번호", width: 150, align: 'left', headerAlign: 'center' },
    { field: "userBankName", headerName: "추천인 은행", width: 100, align: 'left', headerAlign: 'center' },
    { field: "userBankHolder", headerName: "추천인 예금주", width: 100, align: 'left', headerAlign: 'center' },
  ]

  return (
    <div style={{ width: "100%", backgroundColor: "white", borderRadius: "12px", border: "1px solid lightgray" }}>
      <DataGrid
        rows={processedData}
        columns={columns}
        initialState={{
          pagination: {
            paginationModel: { page: 0, pageSize: 25 }
          }
        }}
        pageSizeOptions={[25, 50, 100]}
        disableRowSelectionOnClick={true}
        checkboxSelection
        onRowSelectionModelChange={(newSelection) => {
          if (newSelection && typeof newSelection === 'object' && newSelection.ids) {
            const selectionSet = new Set(newSelection.ids);
            setSelectedRows(selectionSet);
            if (onSelectionChange) {
              onSelectionChange(selectionSet);
            }
          } else if (Array.isArray(newSelection)) {
            const selectionSet = new Set(newSelection);
            setSelectedRows(selectionSet);
            if (onSelectionChange) {
              onSelectionChange(selectionSet);
            }
          } else {
            const emptySet = new Set();
            setSelectedRows(emptySet);
            if (onSelectionChange) {
              onSelectionChange(emptySet);
            }
          }
        }}
        sx={{
          "& .MuiDataGrid-root": { border: "none" },
          "& .MuiDataGrid-cell": { borderBottom: "1px solid #f0f0f0" },
          "& .MuiDataGrid-columnHeaders": { backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" },
          "& .MuiDataGrid-virtualScroller": { backgroundColor: "#ffffff" },
          "& .MuiDataGrid-columnHeader:first-of-type": { minWidth: "60px !important", width: "60px !important", maxWidth: "60px !important" },
          "& .MuiDataGrid-cell:first-of-type": { minWidth: "60px !important", width: "60px !important", maxWidth: "60px !important" },
        }}
      />
    </div>
  )
}

export default CommissionPaymentDataGrid 