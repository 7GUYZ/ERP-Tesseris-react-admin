"use client"
import { useState, useEffect, useMemo } from "react"
import { DataGrid } from "@mui/x-data-grid"

const CouponDataGrid = ({ data, onSelectionChange }) => {
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // 데이터가 변경될 때 선택된 행들 초기화
  useEffect(() => {
    setSelectedRows(new Set());
    setSelectAll(false);
  }, [data]);

  // 메모이제이션으로 성능 최적화
  const processedData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }
    
    return data.map((item, index) => ({
      id: item.id || index,
      ...item
    }));
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
    { field: "issuanceUserRole", headerName: "발행자 구분", width: 120, align: 'center', headerAlign: 'center' },
    { field: "issuanceUser", headerName: "발행자 ID", width: 120, align: 'center', headerAlign: 'center' },
    { 
      field: "couponPrice", 
      headerName: "쿠폰 가격", 
      width: 100, 
      align: 'center', 
      headerAlign: 'center',
      valueFormatter: (params) => {
        if (!params) return "0";
        const value = params.value;
        if (value == null || value === '') return "0";
        const numValue = typeof value === 'string' ? parseInt(value) : value;
        return isNaN(numValue) ? "0" : numValue.toLocaleString();
      }
    },
    { 
      field: "couponLimit", 
      headerName: "쿠폰 한도", 
      width: 100, 
      align: 'center', 
      headerAlign: 'center',
      valueFormatter: (params) => {
        if (!params) return "0";
        const value = params.value;
        if (value == null || value === '') return "0";
        const numValue = typeof value === 'string' ? parseInt(value) : value;
        return isNaN(numValue) ? "0" : numValue.toLocaleString();
      }
    },

    { field: "couponName", headerName: "쿠폰명", width: 150, align: 'center', headerAlign: 'center' },
    { field: "couponIssuanceStatus", headerName: "발행 상태", width: 120, align: 'center', headerAlign: 'center' },
    { 
      field: "couponIssuanceTime", 
      headerName: "발행일", 
      width: 160, 
      align: 'center', 
      headerAlign: 'center',
      valueFormatter: (params) => {
        if (!params) return "-";
        const value = params.value;
        if (!value) return "-";
        try {
          let date;
          if (Array.isArray(value)) {
            // 배열 형태: [년, 월, 일, 시, 분, 초]
            const [year, month, day, hour, minute, second] = value;
            date = new Date(year, month - 1, day, hour, minute, second);
          } else {
            date = new Date(value);
          }
          return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          });
        } catch (error) {
          return value;
        }
      }
    },

    { field: "providedUserRole", headerName: "지급자 구분", width: 120, align: 'center', headerAlign: 'center' },
    { field: "providedUser", headerName: "지급자 ID", width: 120, align: 'center', headerAlign: 'center' },
    { field: "couponProvidedStatus", headerName: "지급 상태", width: 120, align: 'center', headerAlign: 'center' },
    { 
      field: "couponProvidedTime", 
      headerName: "지급일", 
      width: 160, 
      align: 'center', 
      headerAlign: 'center',
      valueFormatter: (params) => {
        if (!params) return "-";
        const value = params.value;
        if (!value) return "-";
        try {
          let date;
          if (Array.isArray(value)) {
            // 배열 형태: [년, 월, 일, 시, 분, 초]
            const [year, month, day, hour, minute, second] = value;
            date = new Date(year, month - 1, day, hour, minute, second);
          } else {
            date = new Date(value);
          }
          return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          });
        } catch (error) {
          return value;
        }
      }
    },
    { 
      field: "couponLimitTime", 
      headerName: "만기일", 
      width: 160, 
      align: 'center', 
      headerAlign: 'center',
      valueFormatter: (params) => {
        if (!params) return "-";
        const value = params.value;
        if (!value) return "-";
        try {
          let date;
          if (Array.isArray(value)) {
            // 배열 형태: [년, 월, 일, 시, 분, 초]
            const [year, month, day, hour, minute, second] = value;
            date = new Date(year, month - 1, day, hour, minute, second);
          } else {
            date = new Date(value);
          }
          return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          });
        } catch (error) {
          return value;
        }
      }
    },
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
          "& .MuiDataGrid-root": {
            border: "none",
          },
          "& .MuiDataGrid-cell": {
            borderBottom: "1px solid #f0f0f0",
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "#f8fafc",
            borderBottom: "1px solid #e2e8f0",
          },
          "& .MuiDataGrid-virtualScroller": {
            backgroundColor: "#ffffff",
          },
          "& .MuiDataGrid-columnHeader:first-of-type": {
            minWidth: "60px !important",
            width: "60px !important",
            maxWidth: "60px !important",
          },
          "& .MuiDataGrid-cell:first-of-type": {
            minWidth: "60px !important",
            width: "60px !important",
            maxWidth: "60px !important",
          },
        }}
      />
    </div>
  )
}

export default CouponDataGrid
