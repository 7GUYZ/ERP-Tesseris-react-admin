"use client"

import { useState, useEffect, useMemo } from "react"
import { DataGrid } from "@mui/x-data-grid"
import { Box } from "@mui/material"

const MemberRecommendationDataGrid = ({ data, onSelectionChange }) => {
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
    {
      field: "suggestionUserId",
      headerName: "추천인 아이디",
      width: 150,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: "suggestionUserName",
      headerName: "추천인 이름",
      width: 120,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: "suggestionUserRole",
      headerName: "추천인 등급",
      width: 120,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: "suggestionStoreName",
      headerName: "가맹점 이름",
      width: 150,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: "recommendationUserId",
      headerName: "아이디",
      width: 150,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: "recommendationUserName",
      headerName: "이름",
      width: 120,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: "recommendationUserRole",
      headerName: "등급",
      width: 120,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: "joinDate",
      headerName: "가입일",
      width: 200,
      align: 'center',
      headerAlign: 'center',
      valueFormatter: (params) => {
        console.log("joinDate valueFormatter - params:", params);
        
        // params가 직접 값인 경우 처리
        let value;
        if (typeof params === 'object' && params !== null && !Array.isArray(params)) {
          value = params.value;
        } else {
          value = params; // params가 직접 값인 경우
        }
        
        console.log("joinDate value:", value, "type:", typeof value);
        if (!value || value === 'null' || value === '') return "-";
        
        try {
          let date;
          if (Array.isArray(value)) {
            // 배열 형태: [년, 월, 일, 시, 분, 초] 또는 [년, 월, 일, 시, 분]
            console.log("joinDate - 배열 길이:", value.length);
            let year, month, day, hour, minute, second;
            
            if (value.length === 6) {
              [year, month, day, hour, minute, second] = value;
            } else if (value.length === 5) {
              [year, month, day, hour, minute] = value;
              second = 0; // 초가 없으면 0으로 설정
            } else {
              console.log("joinDate - 지원하지 않는 배열 길이:", value.length);
              return "-";
            }
            
            console.log("joinDate - 배열 파싱:", year, month, day, hour, minute, second);
            date = new Date(year, month - 1, day, hour, minute, second);
          } else {
            date = new Date(value);
          }
          
          // 유효한 날짜인지 확인
          if (isNaN(date.getTime())) {
            console.log("joinDate - 유효하지 않은 날짜");
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
          console.log("joinDate result:", result);
          return result;
        } catch (error) {
          console.error('날짜 파싱 오류:', error, value);
          return "-";
        }
      },
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

export default MemberRecommendationDataGrid 