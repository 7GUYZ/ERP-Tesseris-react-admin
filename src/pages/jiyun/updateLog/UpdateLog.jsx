import { useState, useEffect, useCallback, useMemo } from "react";
import { DataGrid } from '@mui/x-data-grid';
import Checkbox from '@mui/material/Checkbox';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { getUpdateLog } from "../../../api/auth/JiyoonAuth";
import { downloadSelectedExcel } from "../../../components/feature/jihun/common/ExcelCommon.jsx";
import "../../../styles/jiyun/updateLog/update-log.css";

const UpdateLog = () => {
  const [searchParams, setSearchParams] = useState({
    updateUserId: "",
    inflictUserId: "",
    updateDataValue: "",
    updateUserLogUpdateTimeStart: "",
    updateUserLogUpdateTimeEnd: "",
  });

  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSearchFormOpen, setIsSearchFormOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [error, setError] = useState(null);

  // 날짜 배열을 Date 객체로 변환하는 함수
  const parseDate = useCallback((arr) => {
    if (!Array.isArray(arr) || arr.length < 3) return "";
    const [year, month, day, hour = 0, min = 0] = arr;
    return new Date(year, month - 1, day, hour, min, 0);
  }, []);

  // 날짜 포맷팅 함수
  const formatDateToMinute = useCallback((date) => {
    if (!date || isNaN(date.getTime())) return "";
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const h = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${d} ${h}:${min}`;
  }, []);

  // 초기 데이터 로딩 함수
  const loadInitialData = useCallback(async () => {
    try {
      const response = await getUpdateLog({});
      setSearchResults(response.data || []);
    } catch (error) {
      console.error("초기 데이터 로딩 중 오류:", error);
      setSearchResults([]);
    }
  }, []);

  // 초기 데이터 로딩
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await loadInitialData();
      } catch (error) {
        setError(error.message || "데이터를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [loadInitialData]);

  // 폼 입력 변경 핸들러 (성능 최적화)
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setSearchParams((prev) => ({ ...prev, [name]: value }));
  }, []);

  // 검색 핸들러
  const handleSearch = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      Object.keys(searchParams).forEach((key) => {
        if (searchParams[key] && searchParams[key].trim() !== "") {
          params[key] = searchParams[key];
        }
      });
      
      const response = await getUpdateLog(params);
      setSearchResults(response.data || []);
    } catch (error) {
      console.error("검색 중 오류 발생:", error);
      setError("검색 중 오류가 발생했습니다.");
      try {
        await loadInitialData();
      } catch (initError) {
        console.error("초기 데이터 로딩도 실패:", initError);
        setSearchResults([]);
      }
    } finally {
      setLoading(false);
    }
  }, [searchParams, loadInitialData]);

  // 선택된 행들 처리 핸들러
  const handleSelectionChange = useCallback((newSelection) => {
    const safeSelection = newSelection instanceof Set ? newSelection : new Set(newSelection || []);
    setSelectedRows(safeSelection);
  }, []);

  const handleExcelDownload = useCallback(() => {
    const excelData = searchResults.map((row, index) => ({
      '순번': index + 1,
      '수정자 ID': row.updateUserId || '',
      '수정자 역할': row.updateUserRoleNm1 || '',
      '대상 ID': row.inflictUserId || '',
      '대상 역할': row.updateUserRoleNm2 || '',
      '프로그램명': row.updateDataValue || '',
      '수정 전 데이터': row.updateBeforeData || '',
      '수정 후 데이터': row.updateAfterData || '',
      '수정 시간': row.updateUserLogUpdateTime ? formatDateToMinute(parseDate(row.updateUserLogUpdateTime)) : ''
    }));

    downloadSelectedExcel(excelData, selectedRows, '사용자업데이트로그', '사용자업데이트로그');
  }, [searchResults, selectedRows, formatDateToMinute, parseDate]);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const processedData = useMemo(() => {
    if (!Array.isArray(searchResults) || searchResults.length === 0) {
      return [];
    }
    return searchResults.map((item, index) => ({
      id: index,
      updateUserId: item?.updateUserId || '',
      updateUserRoleNm1: item?.updateUserRoleNm1 || '',
      inflictUserId: item?.inflictUserId || '',
      updateUserRoleNm2: item?.updateUserRoleNm2 || '',
      updateDataValue: item?.updateDataValue || '',
      updateBeforeData: item?.updateBeforeData || '',
      updateAfterData: item?.updateAfterData || '',
      updateUserLogUpdateTime: item?.updateUserLogUpdateTime ? formatDateToMinute(parseDate(item.updateUserLogUpdateTime)) : ''
    }));
  }, [searchResults, formatDateToMinute, parseDate]);

  const [selectAll, setSelectAll] = useState(false);

  const theme = createTheme();

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
              if (handleSelectionChange) {
                handleSelectionChange(allIds);
              }
            } else {
              setSelectedRows(new Set());
              setSelectAll(false);
              if (handleSelectionChange) {
                handleSelectionChange(new Set());
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
            if (handleSelectionChange) {
              handleSelectionChange(newSelection);
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
    { field: "updateUserId", headerName: "수정자 ID", width: 120, minWidth: 120, flex: 1, align: 'center', headerAlign: 'center', renderCell: (params) => (params.value === null || params.value === undefined || params.value === '' ? '-' : params.value) },
    { field: "updateUserRoleNm1", headerName: "수정자 역할", width: 120, minWidth: 120, flex: 1, align: 'center', headerAlign: 'center', renderCell: (params) => (params.value === null || params.value === undefined || params.value === '' ? '-' : params.value) },
    { field: "inflictUserId", headerName: "대상 ID", width: 120, minWidth: 120, flex: 1, align: 'center', headerAlign: 'center', renderCell: (params) => (params.value === null || params.value === undefined || params.value === '' ? '-' : params.value) },
    { field: "updateUserRoleNm2", headerName: "대상 역할", width: 120, minWidth: 120, flex: 1, align: 'center', headerAlign: 'center', renderCell: (params) => (params.value === null || params.value === undefined || params.value === '' ? '-' : params.value) },
    { field: "updateDataValue", headerName: "프로그램명", width: 150, minWidth: 150, flex: 1, align: 'center', headerAlign: 'center', renderCell: (params) => (params.value === null || params.value === undefined || params.value === '' ? '-' : params.value) },
    { 
      field: "updateBeforeData", 
      headerName: "수정 전 데이터", 
      width: 200, 
      minWidth: 200, 
      flex: 1, 
      align: 'center', 
      headerAlign: 'center',
      renderCell: (params) => (params.value === null || params.value === undefined || params.value === '' || params.value === 0 ? '-' : params.value)
    },
    { 
      field: "updateAfterData", 
      headerName: "수정 후 데이터", 
      width: 200, 
      minWidth: 200, 
      flex: 1, 
      align: 'center', 
      headerAlign: 'center',
      renderCell: (params) => (params.value === null || params.value === undefined || params.value === '' || params.value === 0 ? '-' : params.value)
    },
    { field: "updateUserLogUpdateTime", headerName: "수정 시간", width: 150, minWidth: 150, flex: 1, align: 'center', headerAlign: 'center', renderCell: (params) => (params.value === null || params.value === undefined || params.value === '' ? '-' : params.value) }
  ];

  return (
    <div className="update-log-container">
      <div className="update-log-page-header">
        <h1 className="update-log-page-title">사용자 업데이트 로그</h1>
        <div className="update-log-actions">
          <button 
            className="update-log-btn excel" 
            onClick={handleExcelDownload}
            disabled={searchResults.length === 0}
          >
            엑셀
          </button>
          <button
            className="update-log-btn search"
            onClick={handleSearch}
            disabled={loading}
          >
            {loading ? "조회 중..." : "조회"}
          </button>
        </div>
      </div>

      <div className="update-log-section">
        <div className="update-log-toggle-header">
          <button 
            className="update-log-toggle-btn"
            onClick={() => setIsSearchFormOpen(!isSearchFormOpen)}
          >
            <span className="update-log-toggle-text">검색 조건</span>
            <span className={`update-log-toggle-icon ${isSearchFormOpen ? 'open' : 'closed'}`}>
              ▼
            </span>
          </button>
        </div>
        
        <div className={`update-log-form ${isSearchFormOpen ? 'open' : 'closed'}`}>
          <div className="update-log-row">
            <div className="update-log-field">
              <label className="update-log-label">아이디(수정자)</label>
              <input
                className="update-log-input"
                name="updateUserId"
                value={searchParams.updateUserId}
                onChange={handleInputChange}
                placeholder="검색명을 입력하세요."
              />
            </div>
            <div className="update-log-field">
              <label className="update-log-label">아이디</label>
              <input
                className="update-log-input"
                name="inflictUserId"
                value={searchParams.inflictUserId}
                onChange={handleInputChange}
                placeholder="검색명을 입력하세요."
              />
            </div>
            <div className="update-log-field">
              <label className="update-log-label">프로그램명</label>
              <input
                className="update-log-input"
                name="updateDataValue"
                value={searchParams.updateDataValue}
                onChange={handleInputChange}
                placeholder="검색명을 입력하세요."
              />
            </div>
          </div>

          <div className="update-log-row">
            <div className="update-log-field">
              <label className="update-log-label">발생일(시작)</label>
              <input
                className="update-log-input"
                type="date"
                name="updateUserLogUpdateTimeStart"
                value={searchParams.updateUserLogUpdateTimeStart}
                onChange={handleInputChange}
                max={today}
                placeholder="연도-월-일"
              />
            </div>
            <div className="update-log-field">
              <label className="update-log-label">발생일(종료)</label>
              <input
                className="update-log-input"
                type="date"
                name="updateUserLogUpdateTimeEnd"
                value={searchParams.updateUserLogUpdateTimeEnd}
                onChange={handleInputChange}
                max={today}
                placeholder="연도-월-일"
              />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="update-log-error">
          {error}
        </div>
      )}

      <div className="update-log-table-container">
        {processedData.length === 0 && !loading ? (
          <div className="update-log-no-results">
            검색 결과가 없습니다.
          </div>
        ) : (
          <ThemeProvider theme={theme}>
            <DataGrid
              rows={processedData}
              columns={columns}
              rowCount={processedData.length}
              page={0}
              pageSize={25}
              pageSizeOptions={[25, 50, 100]}
              paginationMode="client"
              onPageChange={() => {}}
              onPageSizeChange={() => {}}
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
              columnBuffer={2}
              columnThreshold={2}
              sx={{
                border: 'none',
                borderRadius: '12px',
                backgroundColor: 'white',
                boxShadow: 'none',
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
                    borderRadius: '6px',
                    '&:hover': {
                      backgroundColor: '#94a3b8'
                    }
                  },
                  '&::-webkit-scrollbar-corner': {
                    backgroundColor: '#f1f5f9'
                  }
                },
                '& .MuiDataGrid-main': {
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
                    borderRadius: '6px',
                    '&:hover': {
                      backgroundColor: '#94a3b8'
                    }
                  },
                  '&::-webkit-scrollbar-corner': {
                    backgroundColor: '#f1f5f9'
                  }
                }
              }}
            />
          </ThemeProvider>
        )}
      </div>
    </div>
  );
};

export default UpdateLog;
