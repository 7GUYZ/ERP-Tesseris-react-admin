"use client"
import { useState, useEffect, useMemo } from "react"
import { DataGrid } from "@mui/x-data-grid"

const CommissionPaymentDataGrid = ({ data, onSelectionChange }) => {
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const processedData = useMemo(() => {
    return data.map((row, index) => ({
      ...row,
      id: row.id || `${row.userId}-${row.detailIndex}-${index}`,
    }));
  }, [data]);

  useEffect(() => {
    // 데이터가 변경되면 선택 상태 초기화
    setSelectedRows(new Set());
    setSelectAll(false);
  }, [data]);

  const handleSelectAll = () => {
    console.log('Select all clicked');
    const newSelectAll = !selectAll;

    if (newSelectAll) {
      const allIds = new Set(processedData.map((row) => row.id));
      setSelectedRows(allIds);
      setSelectAll(true);
      if (onSelectionChange) {
        onSelectionChange(allIds);
      }
    } else {
      setSelectedRows(new Set());
      setSelectAll(false);
      if (onSelectionChange) {
        onSelectionChange(new Set());
      }
    }
  };

  const handleRowSelect = (rowId) => {
    console.log('Row select clicked:', rowId);
    const newSelection = new Set(selectedRows);
    if (newSelection.has(rowId)) {
      newSelection.delete(rowId);
    } else {
      newSelection.add(rowId);
    }
    setSelectedRows(newSelection);
    setSelectAll(newSelection.size === processedData.length);
    if (onSelectionChange) {
      onSelectionChange(newSelection);
    }
  };

  const columns = [
    {
      field: "checkbox",
      headerName: "",
      width: 60,
      minWidth: 60,
      maxWidth: 60,
      sortable: false,
      disableColumnMenu: true,
      align: 'center',
      headerAlign: 'center',
      renderHeader: () => (
        <div
          onClick={handleSelectAll}
          style={{
            width: '20px',
            height: '20px',
            border: '2px solid #ccc',
            borderRadius: '3px',
            backgroundColor: selectAll ? '#1976d2' : 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto'
          }}
        >
          {selectAll && (
            <div style={{
              width: '12px',
              height: '12px',
              backgroundColor: 'white',
              borderRadius: '1px'
            }} />
          )}
        </div>
      ),
      renderCell: (params) => (
        <div
          onClick={() => handleRowSelect(params.row.id)}
          style={{
            width: '20px',
            height: '20px',
            border: '2px solid #ccc',
            borderRadius: '3px',
            backgroundColor: selectedRows.has(params.row.id) ? '#1976d2' : 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto'
          }}
        >
          {selectedRows.has(params.row.id) && (
            <div style={{
              width: '12px',
              height: '12px',
              backgroundColor: 'white',
              borderRadius: '1px'
            }} />
          )}
        </div>
      ),
    },
    { field: "detailIndex", headerName: "DetailIndex", width: 100, align: 'center', headerAlign: 'center' },
    { field: "userId", headerName: "사용자 ID", width: 120, align: 'center', headerAlign: 'center' },
    { field: "userName", headerName: "사용자명", width: 120, align: 'center', headerAlign: 'center' },
    { field: "userPhone", headerName: "전화번호", width: 130, align: 'center', headerAlign: 'center' },
    { field: "transactionName", headerName: "거래명", width: 150, align: 'center', headerAlign: 'center' },
    { field: "chargeTime", headerName: "충전 시간", width: 180, align: 'center', headerAlign: 'center',
      valueFormatter: (params) => {
        if (!params.value) return "";
        if (Array.isArray(params.value)) {
          const [year, month, day, hour, minute] = params.value;
          return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
        }
        return new Date(params.value).toLocaleString('ko-KR');
      }
    },
    { field: "cmValue", headerName: "CM 값", width: 100, align: 'center', headerAlign: 'center',
      valueFormatter: (params) => params.value ? params.value.toLocaleString() : '0'
    },
    { field: "cashValue", headerName: "캐시 값", width: 120, align: 'center', headerAlign: 'center',
      valueFormatter: (params) => params.value ? params.value.toLocaleString() : '0'
    },
    { field: "regularCashValue", headerName: "정기 캐시 값", width: 130, align: 'center', headerAlign: 'center',
      valueFormatter: (params) => params.value ? params.value.toLocaleString() : '0'
    },
    { field: "description", headerName: "설명", width: 100, align: 'center', headerAlign: 'center' },
    { field: "paymentStatus", headerName: "지급 상태", width: 100, align: 'center', headerAlign: 'center',
      renderCell: (params) => (
        <span style={{
          color: params.value === '지급' ? '#059669' : '#dc2626',
          fontWeight: 'bold'
        }}>
          {params.value}
        </span>
      )
    },
    { field: "suggestionUserId", headerName: "추천인 ID", width: 120, align: 'center', headerAlign: 'center' },
    { field: "suggestionUserName", headerName: "추천인명", width: 120, align: 'center', headerAlign: 'center' },
    { field: "suggestionUserPhone", headerName: "추천인 전화번호", width: 140, align: 'center', headerAlign: 'center' },
    { field: "userRoleKorNm", headerName: "사용자 권한", width: 120, align: 'center', headerAlign: 'center' },
    { field: "userBankNumber", headerName: "계좌번호", width: 150, align: 'center', headerAlign: 'center' },
    { field: "userBankName", headerName: "은행명", width: 100, align: 'center', headerAlign: 'center' },
    { field: "userBankHolder", headerName: "예금주", width: 100, align: 'center', headerAlign: 'center' },
  ]

  return (
    <div style={{ height: 600, width: "100%", backgroundColor: "white", borderRadius: "12px", border: "1px solid lightgray" }}>
      <div style={{ padding: '10px', borderBottom: '1px solid #e0e0e0', backgroundColor: '#f8f9fa' }}>
        <strong>선택된 항목: {selectedRows.size}개</strong>
      </div>
      <DataGrid
        rows={processedData}
        columns={columns}
        pageSize={100}
        rowsPerPageOptions={[100, 200, 500, 1000]}
        disableRowSelectionOnClick={true}
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