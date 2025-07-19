import React, { useState, useMemo } from "react";
import { DataGrid } from '@mui/x-data-grid';
import Checkbox from '@mui/material/Checkbox';

const MemberAssetSearchTable = ({ data = [], onSelectionChange }) => {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [selectedRows, setSelectedRows] = useState(new Set());


  
  // 메모이제이션으로 성능 최적화 및 안정성 확보
  const processedData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) {
      return []; // 빈 배열 반환
    }
    return data.map((item, index) => ({ 
      id: index, 
      ...item,
      // 모든 필드가 존재하는지 확인
      fromGrade: item?.fromGrade || '',
      fromId: item?.fromId || '',
      toGrade: item?.toGrade || '',
      toId: item?.toId || '',
      toName: item?.toName || '',
      transactionType: item?.transactionType || '',
      amount: item?.amount || 0,
      unit: item?.unit || '',
      usedValue: item?.usedValue || 0,
      couponUsedValue: item?.couponUsedValue || 0,
      reason: item?.reason || '',
      occurredDate: item?.occurredDate || ''
    }));
  }, [data]);

  // DataGrid에 id 필수 - 안전한 데이터 처리
  const rowsWithIds = processedData;

  // 전체 선택 상태
  const [selectAll, setSelectAll] = useState(false);

  // Data Grid 컬럼 정의
  const columns = [
    {
      field: "checkbox",
      headerName: "",
      width: 50,
      minWidth: 50,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderHeader: () => (
        <Checkbox
          checked={selectAll}
          indeterminate={selectedRows.size > 0 && selectedRows.size < processedData.length}
          onChange={(e) => {
            if (e.target.checked) {
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
          }}
        />
      ),
      renderCell: (params) => (
        <Checkbox
          checked={selectedRows.has(params.row.id)}
          onChange={(e) => {
            const newSelection = new Set(selectedRows);
            if (e.target.checked) {
              newSelection.add(params.row.id);
            } else {
              newSelection.delete(params.row.id);
            }
            setSelectedRows(newSelection);
            setSelectAll(newSelection.size === processedData.length);
            if (onSelectionChange) {
              onSelectionChange(newSelection);
            }
          }}
        />
      ),
    },
    { 
      field: "id", 
      headerName: "순번", 
      width: 80, 
      minWidth: 80, 
      flex: 1,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => params.row.id + 1
    },
    { field: "fromGrade", headerName: "FROM 등급", width: 130, minWidth: 130, flex: 1, align: 'center', headerAlign: 'center' },
    { field: "fromId", headerName: "FROM ID", width: 120, minWidth: 120, flex: 1, align: 'center', headerAlign: 'center' },
    { field: "toGrade", headerName: "TO 등급", width: 130, minWidth: 130, flex: 1, align: 'center', headerAlign: 'center' },
    { field: "toId", headerName: "TO ID", width: 120, minWidth: 120, flex: 1, align: 'center', headerAlign: 'center' },
    { field: "toName", headerName: "TO 이름", width: 120, minWidth: 120, flex: 1, align: 'center', headerAlign: 'center' },
    { field: "transactionType", headerName: "거래 유형", width: 130, minWidth: 130, flex: 1, align: 'center', headerAlign: 'center' },
    {
      field: "amount",
      headerName: "금액",
      width: 100,
      minWidth: 100,
      flex: 1,
      type: 'number',
      align: 'center',
      headerAlign: 'center',
      valueFormatter: (params) => {
        if (params.value == null) return "0";
        return params.value.toLocaleString();
      }
    },
    { field: "unit", headerName: "단위", width: 80, minWidth: 80, flex: 1, align: 'center', headerAlign: 'center' },
    {
      field: "usedValue",
      headerName: "사용 금액",
      width: 120,
      minWidth: 120,
      flex: 1,
      type: 'number',
      align: 'center',
      headerAlign: 'center',
      valueFormatter: (params) => {
        if (params.value == null) return "0";
        return params.value.toLocaleString();
      }
    },
    {
      field: "couponUsedValue",
      headerName: "쿠폰 사용 금액",
      width: 150,
      minWidth: 150,
      flex: 1,
      type: 'number',
      align: 'center',
      headerAlign: 'center',
      valueFormatter: (params) => {
        if (params.value == null) return "0";
        return params.value.toLocaleString();
      }
    },
    { field: "reason", headerName: "사유", width: 150, minWidth: 150, flex: 1, align: 'center', headerAlign: 'center' },
    { field: "occurredDate", headerName: "발생일", width: 120, minWidth: 120, flex: 1, align: 'center', headerAlign: 'center' }
  ];






  
  // 안전장치: data가 undefined나 null인 경우 처리
  if (data === undefined || data === null) {
    return (
      <div className="member-asset-search-table-container" style={{ 
        width: '100%', 
        height: '500px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: '12px'
      }}>
        <div>데이터를 불러오는 중...</div>
      </div>
    );
  }

  // DataGrid 렌더링을 안전하게 처리
  const renderDataGrid = () => {
    try {
      // 데이터 유효성 검사 강화
      if (!Array.isArray(rowsWithIds)) {
        console.warn('rowsWithIds is not an array:', rowsWithIds);
        return null;
      }
      
      // 컬럼 유효성 검사
      if (!Array.isArray(columns) || columns.length === 0) {
        console.warn('columns is not valid:', columns);
        return null;
      }
      return (
        <DataGrid
          rows={rowsWithIds || []}
          columns={columns}
          rowCount={rowsWithIds?.length || 0}
          page={page || 0}
          pageSize={pageSize || 25}
          pageSizeOptions={[25, 50, 100]}
          paginationMode="client"
          onPageChange={(newPage) => setPage(newPage || 0)}
          onPageSizeChange={(newSize) => setPageSize(newSize || 25)}
          autoHeight={false}
          height={400}
          disableColumnMenu
          disableColumnFilter
          disableColumnSelector
          disableDensitySelector
          getRowId={(row) => {
            if (row && typeof row.id !== 'undefined') {
              return row.id;
            }
            return `row-${Math.random().toString(36).substr(2, 9)}`;
          }}
          scrollbarSize={12}
          // MUI 내장 체크박스 기능 완전 제거 (커스텀 체크박스 사용)
          disableRowSelectionOnClick={true}
          disableVirtualization={false}
          density="standard"

          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 25 },
            },
            columns: {
              columnVisibilityModel: {},
            },
          }}
          sx={{
            border: 'none',
            borderRadius: '12px',
            backgroundColor: 'white',
            boxShadow: 'none',
            // 모든 포커스, 아웃라인, 테두리 완전 제거
            '& *': {
              '&:focus': {
                outline: 'none !important',
                border: 'none !important',
                boxShadow: 'none !important',
              },
              '&:focus-visible': {
                outline: 'none !important', 
                border: 'none !important',
                boxShadow: 'none !important',
              }
            },
            '& .MuiDataGrid-root': {
              border: "none",
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: 'none',
              '& *:focus': {
                outline: 'none !important',
                border: 'none !important',
                boxShadow: 'none !important',
              }
            },
            '& .MuiDataGrid-cell': {
              borderBottom: 'none',
              borderRight: 'none',
              borderLeft: 'none',
              borderTop: 'none',
              padding: '8px 12px',
              fontSize: '14px',
              height: '44px',
              color: '#334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '70px !important',
              '&:focus': {
                outline: 'none !important',
                border: 'none !important',
                boxShadow: 'none !important',
              },
              '&:focus-visible': {
                outline: 'none !important',
                border: 'none !important',
                boxShadow: 'none !important',
              },
              '&.Mui-focused': {
                outline: 'none !important',
                border: 'none !important',
                boxShadow: 'none !important',
              }
            },
            '& .MuiDataGrid-row': {
              borderBottom: 'none',
              borderTop: 'none',
              backgroundColor: 'white',
              '&:nth-of-type(even)': {
                backgroundColor: '#f8fafc',
              },
              '&.Mui-selected': {
                backgroundColor: '#dbeafe !important',
              }
            },
            '& .MuiDataGrid-columnHeaders': {
              borderBottom: 'none',
              borderTop: 'none',
              borderRadius: '12px 12px 0 0',
              background: 'white',
              color: 'black',
              fontWeight: 'bold',
              fontSize: '14px',
              '& .MuiDataGrid-columnHeader': {
                outline: 'none !important',
                border: 'none !important',
                minWidth: '70px !important',
                '&:focus': {
                  outline: 'none !important',
                  border: 'none !important',
                },
                '&:focus-visible': {
                  outline: 'none !important',
                  border: 'none !important',
                }
              },
              '& .MuiDataGrid-columnHeaderTitle': {
                color: 'black !important',
                fontWeight: 'bold !important',
                fontSize: '14px !important'
              },
              '& .MuiDataGrid-columnHeaderTitleContainer': {
                color: 'black !important'
              }
            },

            '& .MuiDataGrid-footerContainer': {
              borderTop: 'none',
              borderRadius: '0 0 12px 12px',
              backgroundColor: '#f8fafc',
              minHeight: '52px'
            },
            '& .MuiDataGrid-footerPagination': {
              '& .MuiTablePagination-root': {
                color: '#64748b'
              }
            },

            '& .MuiDataGrid-overlay': {
              backgroundColor: 'white',
              borderRadius: '12px'
            },
            '& .MuiDataGrid-virtualScroller': {
              '&::-webkit-scrollbar': {
                width: '12px',
                height: '12px'
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: '#f1f5f9',
                borderRadius: '6px'
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: '#cbd5e1',
                borderRadius: '6px'
              },
              '&::-webkit-scrollbar-corner': {
                backgroundColor: '#f1f5f9'
              }
            }
          }}
        />
      );
    } catch (error) {
      console.error('DataGrid render error:', error);
      return (
        <div style={{ 
          width: '100%', 
          height: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8f9fa',
          borderRadius: '12px',
          border: '1px solid #e9ecef'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '10px', fontSize: '18px', color: '#dc3545' }}>⚠️</div>
            <div style={{ fontSize: '14px', color: '#6c757d' }}>
              테이블을 불러오는 중 오류가 발생했습니다.<br/>
              오류: {error.message}<br/>
              페이지를 새로고침해주세요.
            </div>
          </div>
        </div>
      );
    }
  };

  // 데이터가 없으면 로딩 상태 표시
  if (!Array.isArray(data)) {
    return (
      <div className="member-asset-search-table-container" style={{ 
        width: '100%', 
        height: '500px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: '12px'
      }}>
        <div>데이터를 불러오는 중...</div>
      </div>
    );
  }

  // 빈 데이터일 때 처리
  if (processedData.length === 0) {
    return (
      <div className="member-asset-search-table-container" style={{ 
        width: '100%', 
        height: '500px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: '12px'
      }}>
        <div>검색 결과가 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="member-asset-search-table-container" style={{ 
      width: '100%', 
      overflow: 'hidden',
      borderRadius: '12px',
      boxShadow: 'none',
      height: '500px'
    }}>
      {renderDataGrid()}
    </div>
  );
};

export default MemberAssetSearchTable; 