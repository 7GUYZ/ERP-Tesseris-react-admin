"use client"
import { useState, useEffect, useMemo } from "react"
import { DataGrid } from "@mui/x-data-grid"

const SalesPerformanceDataGrid = ({ data, onSelectionChange }) => {
  const [selectedRows, setSelectedRows] = useState(new Set());

  const processedData = useMemo(() => {
    return data.map((row, index) => ({
      ...row,
      id: row.id || `${row.businessUserId}-${row.storeUserId}-${index}`,
    }));
  }, [data]);

  useEffect(() => {
    // 데이터가 변경되면 선택 상태 초기화
    setSelectedRows(new Set());
  }, [data]);



  const columns = [
    { field: "businessUserId", headerName: "사업자 이메일", width: 200, align: 'center', headerAlign: 'center' },
    { field: "businessGradeName", headerName: "사업자 등급", width: 120, align: 'center', headerAlign: 'center' },
    { field: "businessAreaName", headerName: "사업자 담당구역", width: 150, align: 'center', headerAlign: 'center' },
    { field: "businessUserName", headerName: "사업자 이름", width: 120, align: 'center', headerAlign: 'center' },
    { field: "businessManDistributionFlag", headerName: "사업자 상태", width: 120, align: 'center', headerAlign: 'center' },
    { field: "storeUserId", headerName: "가맹점 이메일", width: 200, align: 'center', headerAlign: 'center' },
    { field: "storeName", headerName: "가맹점 명", width: 150, align: 'center', headerAlign: 'center' },
    { field: "storeRequestStatusName", headerName: "가맹점 승인 여부", width: 150, align: 'center', headerAlign: 'center' },
    { field: "storeTransactionStatus", headerName: "가맹점 상태", width: 120, align: 'center', headerAlign: 'center' },
    { field: "cmrockStatus", headerName: "가맹점 CM락", width: 120, align: 'center', headerAlign: 'center' },
    { field: "sellrockStatus", headerName: "가맹점 판매락", width: 120, align: 'center', headerAlign: 'center' },
    { 
      field: "storeRegistrationDate", 
      headerName: "가맹점 등록일", 
      width: 200, 
      align: 'center', 
      headerAlign: 'center',
      valueFormatter: (params) => {
        console.log("storeRegistrationDate valueFormatter - params:", params);
        
        // params가 직접 값인 경우 처리
        let value;
        if (typeof params === 'object' && params !== null && !Array.isArray(params)) {
          value = params.value;
        } else {
          value = params; // params가 직접 값인 경우
        }
        
        console.log("storeRegistrationDate value:", value, "type:", typeof value);
        if (!value || value === 'null' || value === '') return "-";
        
        try {
          let date;
          if (Array.isArray(value)) {
            // 배열 형태: [년, 월, 일, 시, 분, 초] 또는 [년, 월, 일, 시, 분]
            console.log("storeRegistrationDate - 배열 길이:", value.length);
            let year, month, day, hour, minute, second;
            
            if (value.length === 6) {
              [year, month, day, hour, minute, second] = value;
            } else if (value.length === 5) {
              [year, month, day, hour, minute] = value;
              second = 0; // 초가 없으면 0으로 설정
            } else {
              console.log("storeRegistrationDate - 지원하지 않는 배열 길이:", value.length);
              return "-";
            }
            
            console.log("storeRegistrationDate - 배열 파싱:", year, month, day, hour, minute, second);
            date = new Date(year, month - 1, day, hour, minute, second);
          } else {
            date = new Date(value);
          }
          
          // 유효한 날짜인지 확인
          if (isNaN(date.getTime())) {
            console.log("storeRegistrationDate - 유효하지 않은 날짜");
            return "-";
          }
          
          const result = date.toLocaleString("ko-KR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
          });
          console.log("storeRegistrationDate result:", result);
          return result;
        } catch (error) {
          console.error('날짜 파싱 오류:', error, value);
          return "-";
        }
      },
    },
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

export default SalesPerformanceDataGrid 