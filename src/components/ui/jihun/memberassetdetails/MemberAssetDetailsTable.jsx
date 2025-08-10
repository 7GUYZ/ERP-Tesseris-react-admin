import React, { useState, useMemo, useEffect } from "react";
import { DataGrid } from '@mui/x-data-grid';
import Checkbox from '@mui/material/Checkbox';

const MemberAssetDetailsTable = ({ 
  data = [], 
  onSelectionChange, 
  totalCount = 0,
  currentPage = 0,
  pageSize = 25,
  onPageChange,
  onPageSizeChange,
  loading = false
}) => {
  const [selectedRows, setSelectedRows] = useState(new Set());
  // 실제 OS 스크롤바 두께 측정값 (헤더/바디 정렬용)
  const [scrollbarSizePx, setScrollbarSizePx] = useState(0);

  // 전체 선택 상태
  const [selectAll, setSelectAll] = useState(false);

  // 데이터가 변경될 때 선택된 행들 초기화
  useEffect(() => {
    setSelectedRows(new Set());
    setSelectAll(false);
  }, [data]);

  // 최초 마운트 시 scrollBar width를 계산하여 DataGrid에 전달
  useEffect(() => {
    try {
      const scrollDiv = document.createElement('div');
      scrollDiv.style.width = '100px';
      scrollDiv.style.height = '100px';
      scrollDiv.style.overflow = 'scroll';
      scrollDiv.style.position = 'absolute';
      scrollDiv.style.top = '-9999px';
      document.body.appendChild(scrollDiv);
      const measured = scrollDiv.offsetWidth - scrollDiv.clientWidth; // 스크롤바 두께
      document.body.removeChild(scrollDiv);
      if (measured && measured > 0 && measured < 50) {
        setScrollbarSizePx(measured);
      } else {
        // 윈도우 기본값 보정 (공식문서 권장)
        setScrollbarSizePx(17);
      }
    } catch (_) {
      setScrollbarSizePx(17);
    }
  }, []);

  // 메모이제이션으로 성능 최적화 및 안정성 확보
  const processedData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) {
      return []; // 빈 배열 반환
    }
    
    return data.map((item, index) => { 
      const processedItem = { 
      id: index, 
      ...item,
      // 모든 필드가 존재하는지 확인
      memberId: item?.id || '',
      name: item?.name || '',
      phone: item?.phone || '',
      grade: item?.grade || '',
      franchiseName: item?.franchiseName || '',
      cmHeld: item?.cmHeld || 0,
      cmpHeld: item?.cmpHeld || 0,
      cashHeld: item?.cashHeld || 0,
      registrationDate: item?.registrationDate || ''
      };
      
      return processedItem;
    });
  }, [data]);

  // DataGrid에 id 필수 - 안전한 데이터 처리
  const rowsWithIds = processedData;

  // Data Grid 컬럼 정의 (기본 스펙)
  const baseColumns = [
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
          key={`header-${selectAll}-${selectedRows.size}-${processedData.length}`}
          checked={selectAll}
          indeterminate={selectedRows.size > 0 && selectedRows.size < processedData.length}
          onClick={(e) => e.stopPropagation()}
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
          key={`cb-${params.id}-${selectedRows.has(params.id)}`}
          checked={selectedRows.has(params.id)}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            const targetId = params.id;
            const newSelection = new Set(selectedRows);
            if (e.target.checked) {
              newSelection.add(targetId);
            } else {
              newSelection.delete(targetId);
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
      field: "rowNumber", 
      headerName: "순번", 
      width: 100, 
      minWidth: 80, 
      flex: 1,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: '100%',
          width: '100%'
        }}>
          {params.value}
        </div>
      )
    },
    { field: "email", headerName: "아이디", width: 140, minWidth: 120, flex: 1, align: 'center', headerAlign: 'center' },
    { field: "name", headerName: "이름", width: 140, minWidth: 120, flex: 1, align: 'center', headerAlign: 'center' },
    { field: "phone", headerName: "전화번호", width: 150, minWidth: 130, flex: 1, align: 'center', headerAlign: 'center' },
    { field: "grade", headerName: "등급", width: 120, minWidth: 100, flex: 1, align: 'center', headerAlign: 'center' },
    { field: "franchiseName", headerName: "가맹점 명", width: 160, minWidth: 120, flex: 1, align: 'center', headerAlign: 'center' },
    {
      field: "cmHeld",
      headerName: "보유 TS",
      width: 140,
      minWidth: 120,
      flex: 1,
      align: 'center',
      headerAlign: 'center',
      valueFormatter: (params) => {
        // params 자체가 값이므로 params.value 대신 params 사용
        const value = params.value !== undefined ? params.value : params;
        
        // null, undefined, 빈 문자열 체크
        if (value == null || value === '') {
          return "0";
        }
        
        // 숫자로 변환 후 포맷팅
        const numValue = typeof value === 'string' ? parseInt(value) : value;
        
        const result = isNaN(numValue) ? "0" : numValue.toLocaleString();
        return result;
      }
    },
    { field: "registrationDate", headerName: "등록일", width: 160, minWidth: 150, flex: 1, align: 'center', headerAlign: 'center' }
  ];

  // 컬럼 자동 폭 계산 유틸
  const autoSizeColumns = (rows, cols) => {
    if (!Array.isArray(cols)) return cols || [];
    let ctx = null;
    try {
      const canvas = document.createElement('canvas');
      ctx = canvas.getContext('2d');
      ctx.font = '14px Roboto, Pretendard, sans-serif';
    } catch (_) {}

    const measure = (text) => {
      if (!ctx) return (String(text || '').length * 8);
      return Math.ceil(ctx.measureText(String(text || '')).width);
    };

    const getCellText = (col, row) => {
      const raw = row?.[col.field];
      if (typeof col.valueFormatter === 'function') {
        try { return String(col.valueFormatter({ value: raw })); } catch (_) {}
      }
      return raw == null ? '' : String(raw);
    };

    return cols.map((col) => {
      if (col.field === 'checkbox') return { ...col, flex: undefined };
      const headerText = col.headerName || col.field || '';
      let maxWidthPx = measure(headerText);
      for (let i = 0; i < Math.min(rows.length, 1000); i += 1) {
        const t = getCellText(col, rows[i]);
        const w = measure(t);
        if (w > maxWidthPx) maxWidthPx = w;
      }
      const padding = 32;
      const computed = Math.min(420, Math.max(col.minWidth || 70, maxWidthPx + padding));
      return { ...col, width: computed, minWidth: computed, flex: undefined };
    });
  };

  const columns = useMemo(
    () => autoSizeColumns(rowsWithIds, baseColumns),
    [rowsWithIds, selectedRows, selectAll, processedData.length]
  );

  // 안전장치: data가 undefined나 null인 경우 처리
  if (data === undefined || data === null) {
    return (
      <div className="member-asset-details-table-container" style={{ 
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
        return null;
      }
      
      // 컬럼 유효성 검사
      if (!Array.isArray(columns) || columns.length === 0) {
        return null;
      }
      return (
        <DataGrid
          rows={rowsWithIds || []}
          columns={columns}
          rowCount={totalCount > 0 ? totalCount : (rowsWithIds?.length || 0)}
          pageSizeOptions={[25, 50, 75, 100]}
          paginationMode="server"
          rowHeight={44}
          columnHeaderHeight={44}
          paginationModel={{ page: currentPage || 0, pageSize: pageSize || 25 }}
          onPaginationModelChange={(model) => {
            if (model.page !== currentPage) {
              if (onPageChange) {
                onPageChange(model.page)
              }
            }
            
            if (model.pageSize !== pageSize) {
              if (onPageSizeChange) {
                onPageSizeChange(model.pageSize)
              }
            }
          }}
          loading={loading}
          autoHeight={false}
          height={500}
          disableColumnMenu
          disableColumnFilter
          disableColumnSelector
          disableDensitySelector
          getRowId={(row) => {
            if (row && row.uniqueKey) {
              return row.uniqueKey;
            }
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
            columns: {
              columnVisibilityModel: {},
            },
          }}
          sx={{
            border: 'none',
            borderRadius: '12px',
            backgroundColor: 'white',
            boxShadow: 'none',
            width: '100%',
            minWidth: 'auto',
            overflow: 'hidden',
            // 내역 테이블과 동일한 레이아웃 고정값 적용
            '& .MuiDataGrid-root': {
              overflow: 'hidden !important',
              maxHeight: '500px !important',
              minHeight: '500px !important',
              border: 'none',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: 'none',
              width: '100% !important',
              maxWidth: '100% !important',
              boxSizing: 'border-box !important',
              scrollbarGutter: 'stable both-edges',
              '& *:focus': {
                outline: 'none !important',
                border: 'none !important',
                boxShadow: 'none !important',
              }
            },
            '& .MuiDataGrid-main': {
              overflow: 'auto !important',
              maxHeight: '500px !important',
              minHeight: '500px !important',
              width: '100% !important',
              maxWidth: '100% !important',
              boxSizing: 'border-box !important'
            },
            '& .MuiDataGrid-virtualScrollerContent': {
              overflow: 'visible !important'
            },
            // 행/헤더 높이와 패딩 일치로 미세 틀어짐 방지
            '& .MuiDataGrid-row, & .MuiDataGrid-columnHeaders': {
              minHeight: '44px !important',
              maxHeight: '44px !important'
            },
            '& .MuiDataGrid-cell': {
              lineHeight: '44px',
            },
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
              border: "none !important",
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: 'none !important',
              outline: 'none !important',
              '& *:focus': {
                outline: 'none !important',
                border: 'none !important',
                boxShadow: 'none !important',
              }
            },
            '& .MuiDataGrid-cell': {
              borderBottom: 'none !important',
              borderRight: 'none !important',
              borderLeft: 'none !important',
              borderTop: 'none !important',
              outline: 'none !important',
              padding: '8px 12px',
              fontSize: '14px',
              height: '44px',
              color: '#334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              minWidth: '70px !important',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
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
              borderBottom: 'none !important',
              borderTop: 'none !important',
              borderLeft: 'none !important',
              borderRight: 'none !important',
              outline: 'none !important',
              backgroundColor: 'white',
              '&:nth-of-type(even)': {
                backgroundColor: '#f8fafc',
              },
              '&.Mui-selected': {
                backgroundColor: '#dbeafe !important',
              }
            },
            '& .MuiDataGrid-columnHeaders': {
              borderBottom: 'none !important',
              borderTop: 'none !important',
              borderLeft: 'none !important',
              borderRight: 'none !important',
              outline: 'none !important',
              borderRadius: '12px 12px 0 0',
              background: 'white',
              color: 'black',
              fontWeight: 'bold',
              fontSize: '14px',
              boxSizing: 'border-box',
              '& .MuiDataGrid-columnSeparator': {
                display: 'none !important'
              },
              '& .MuiDataGrid-columnHeader': {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '0 12px',
                outline: 'none !important',
                border: 'none !important',
                borderBottom: 'none !important',
                borderTop: 'none !important',
                borderLeft: 'none !important',
                borderRight: 'none !important',
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
                fontSize: '14px !important',
                textAlign: 'center'
              },
            '& .MuiDataGrid-columnHeaderTitle': {
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            },
              '& .MuiDataGrid-columnHeaderTitleContainer': {
                color: 'black !important',
                display: 'flex',
                justifyContent: 'center'
              }
            },

            '& .MuiDataGrid-footerContainer': {
              borderTop: 'none !important',
              borderBottom: 'none !important',
              borderLeft: 'none !important',
              borderRight: 'none !important',
              outline: 'none !important',
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
            // 셀/헤더 호버 시 뜨는 MUI Tooltip 제거 (겹침 현상 방지)
            '& .MuiTooltip-popper': {
              display: 'none !important'
            },
            '& .MuiDataGrid-virtualScroller': {
              // 스크롤 항상 표시(폭 고정) + 높이 고정
              overflowY: 'scroll',
              overflowX: 'auto',
              scrollbarGutter: 'stable both-edges',
              maxHeight: '500px !important',
              minHeight: '500px !important',
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
      <div className="member-asset-details-table-container" style={{ 
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
      <div className="member-asset-details-table-container" style={{ 
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
    <div className="member-asset-details-table-container" style={{ 
      width: '100%', 
      overflow: 'hidden',
      borderRadius: '12px',
      boxShadow: 'none',
      height: '500px',
      minWidth: 'auto'
    }}>
      {renderDataGrid()}
    </div>
  );
};

export default MemberAssetDetailsTable; 