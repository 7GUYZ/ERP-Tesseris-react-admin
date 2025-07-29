import { useState, useEffect, useCallback, useMemo } from "react";
import { DataGrid } from '@mui/x-data-grid';
import Checkbox from '@mui/material/Checkbox';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import {
  searchCmsAccessLogs,
  getAdminTypes,
} from "../../../api/auth/JiyoonAuth";
import { downloadSelectedExcel } from "../../../components/feature/jihun/common/ExcelCommon.jsx";
import "../../../styles/jiyun/cmsAccessLog/CmsAccessLogPage.css";

const CmsAccessLog = () => {
  const [searchParams, setSearchParams] = useState({
    userId: "",
    userName: "",
    cmsAccessUserIp: "",
    adminTypeIndex: "0",
    cmsAccessUserTimeStart: "",
    cmsAccessUserTimeEnd: "",
  });

  const [searchResults, setSearchResults] = useState([]);
  const [adminTypes, setAdminTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSearchFormOpen, setIsSearchFormOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [error, setError] = useState(null);

  const keys = [
    "userId",
    "userName", 
    "cmsAccessUserValue",
    "adminTypeName",
    "cmsAccessUserIp",
    "cmsAccessUserTime",
  ];

  // 날짜 포맷팅 함수
  const formatDateToSecond = useCallback((dateOrTimestamp) => {
    let date;
    if (!dateOrTimestamp) return "";
    if (typeof dateOrTimestamp === "number") {
      date = new Date(dateOrTimestamp);
    } else if (Array.isArray(dateOrTimestamp)) {
      const [year, month, day, hour = 0, min = 0, sec = 0] = dateOrTimestamp;
      date = new Date(year, month - 1, day, hour, min, sec);
    } else if (
      typeof dateOrTimestamp === "string" &&
      !isNaN(Number(dateOrTimestamp))
    ) {
      date = new Date(Number(dateOrTimestamp));
    } else {
      date = new Date(dateOrTimestamp);
    }
    if (!date || isNaN(date.getTime())) return "";
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const h = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    const s = String(date.getSeconds()).padStart(2, "0");
    return `${y}-${m}-${d} ${h}:${min}:${s}`;
  }, []);

  // 초기 데이터 로딩 함수
  const loadInitialData = useCallback(async () => {
    try {
      const response = await searchCmsAccessLogs({});
      if (response.data.resultCode === 200) {
        // 2차원 배열을 객체 배열로 매핑
        const mapped = Array.isArray(response.data.data)
          ? response.data.data.map((arr) =>
              keys.reduce(
                (obj, key, idx) => ({ ...obj, [key]: arr[idx] }),
                {}
              )
            )
          : [];
        setSearchResults(mapped);
      }
    } catch (error) {
      console.error("초기 데이터 로딩 중 오류:", error);
      setSearchResults([]);
    }
  }, []);

  // 관리자 타입 목록 로드 및 초기 데이터 로딩
  useEffect(() => {
    const loadOptions = async () => {
      try {
        setLoading(true);
        const [adminTypesRes] = await Promise.all([
          getAdminTypes()
        ]);
        
        if (adminTypesRes.data.resultCode === 200) {
          setAdminTypes(adminTypesRes.data.data);
        }
        
        // 초기 데이터 로딩
        await loadInitialData();
      } catch (error) {
        setError(error.message || "옵션 데이터를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };
    loadOptions();
  }, []);

  // 폼 입력 변경 핸들러 (성능 최적화)
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setSearchParams((prev) => ({ ...prev, [name]: value }));
  }, []);

  // 검색 핸들러
  const handleSearch = useCallback(async () => {
    try {
      setLoading(true);
      
      // 검색 조건 준비 - 파라미터가 있으면 검색, 없으면 전체 조회
      const params = {};
      Object.keys(searchParams).forEach((key) => {
        if (searchParams[key] && searchParams[key].trim() !== "" && searchParams[key] !== "0") {
          params[key] = searchParams[key];
        }
      });
      
      const response = await searchCmsAccessLogs(params);
      if (response.data.resultCode === 200) {
        // 2차원 배열을 객체 배열로 매핑
        const mapped = Array.isArray(response.data.data)
          ? response.data.data.map((arr) =>
              keys.reduce((obj, key, idx) => ({ ...obj, [key]: arr[idx] }), {})
            )
          : [];
        setSearchResults(mapped);
      } else {
        setError("검색 실패: " + response.data.resultMessage);
      }
    } catch (error) {
      console.error("검색 중 오류 발생:", error);
      setError("검색 중 오류가 발생했습니다.");
      // 에러 발생 시 전체 데이터라도 보여주기 위해 초기 데이터 로딩 시도
      try {
        await loadInitialData();
      } catch (initError) {
        console.error("초기 데이터 로딩도 실패:", initError);
        setSearchResults([]);
      }
    } finally {
      setLoading(false);
    }
  }, [searchParams, keys]);

  // 선택된 행들 처리 핸들러
  const handleSelectionChange = useCallback((newSelection) => {
    // Set으로 안전한 선택 처리
    const safeSelection = newSelection instanceof Set ? newSelection : new Set(newSelection || []);
    setSelectedRows(safeSelection);
  }, []);

  // 엑셀 다운로드 핸들러
  const handleExcelDownload = useCallback(() => {
    // 데이터 변환 (순번 추가)
    const excelData = searchResults.map((row, index) => ({
      '순번': index + 1,
      '아이디': row.userId || '',
      '이름': row.userName || '',
      '로그': row.cmsAccessUserValue || '',
      '권한': row.adminTypeName || '',
      '접속 IP': row.cmsAccessUserIp || '',
      '발생 시간': row.cmsAccessUserTime ? formatDateToSecond(row.cmsAccessUserTime) : ''
    }));

    downloadSelectedExcel(excelData, selectedRows, 'CMS접속기록', 'CMS접속기록');
  }, [searchResults, selectedRows, formatDateToSecond]);

  // 오늘 날짜 구하기 (yyyy-mm-dd) - 성능 최적화
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  // DataGrid용 데이터 처리
  const processedData = useMemo(() => {
    if (!Array.isArray(searchResults) || searchResults.length === 0) {
      return [];
    }
    return searchResults.map((item, index) => ({
      id: index,
      userId: item?.userId || '',
      userName: item?.userName || '',
      cmsAccessUserValue: item?.cmsAccessUserValue || '',
      adminTypeName: item?.adminTypeName || '',
      cmsAccessUserIp: item?.cmsAccessUserIp || '',
      cmsAccessUserTime: item?.cmsAccessUserTime ? formatDateToSecond(item.cmsAccessUserTime) : ''
    }));
  }, [searchResults, formatDateToSecond]);

  // 전체 선택 상태
  const [selectAll, setSelectAll] = useState(false);

  // Material-UI 테마 생성
  const theme = createTheme();

  // DataGrid 컬럼 정의
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
      width: 60, 
      minWidth: 60, 
      flex: 0,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => params.row.id + 1
    },
    { field: "userId", headerName: "아이디", width: 300, minWidth: 300, flex: 0, align: 'center', headerAlign: 'center' },
    { field: "userName", headerName: "이름", width: 100, minWidth: 100, flex: 0, align: 'center', headerAlign: 'center' },
    { 
      field: "cmsAccessUserValue", 
      headerName: "로그", 
      width: 150, 
      minWidth: 150, 
      flex: 0, 
      align: 'center', 
      headerAlign: 'center',
      renderCell: (params) => {
        const value = params.value || '';
        return value.length > 30 ? value.slice(0, 30) + "..." : value;
      }
    },
    { field: "adminTypeName", headerName: "권한", width: 100, minWidth: 100, flex: 0, align: 'center', headerAlign: 'center' },
    { field: "cmsAccessUserIp", headerName: "접속 IP", width: 120, minWidth: 120, flex: 0, align: 'center', headerAlign: 'center' },
    { field: "cmsAccessUserTime", headerName: "발생 시간", width: 150, minWidth: 150, flex: 0, align: 'center', headerAlign: 'center' }
  ];

  return (
    <div className="cms-accesslog-container">
      {/* 페이지 제목과 액션 버튼 */}
      <div className="cms-accesslog-page-header">
        <h1 className="cms-accesslog-page-title">CMS 접속 기록</h1>
        <div className="cms-accesslog-actions">
          <button 
            className="cms-accesslog-btn excel" 
            onClick={handleExcelDownload}
            disabled={searchResults.length === 0}
          >
            엑셀
          </button>
          <button
            className="cms-accesslog-btn search"
            onClick={handleSearch}
            disabled={loading}
          >
            {loading ? "조회 중..." : "조회"}
          </button>
        </div>
      </div>

      {/* 검색 조건 섹션 */}
      <div className="cms-accesslog-section">
        {/* 검색 조건 토글 헤더 */}
        <div className="cms-accesslog-toggle-header">
          <button 
            className="cms-accesslog-toggle-btn"
            onClick={() => setIsSearchFormOpen(!isSearchFormOpen)}
          >
            <span className="cms-accesslog-toggle-text">검색 조건</span>
            <span className={`cms-accesslog-toggle-icon ${isSearchFormOpen ? 'open' : 'closed'}`}>
              ▼
            </span>
          </button>
        </div>
        
        {/* 검색 조건 폼 */}
        <div className={`cms-accesslog-form ${isSearchFormOpen ? 'open' : 'closed'}`}>
          {/* 첫 번째 행: 아이디, 이름, IP */}
          <div className="cms-accesslog-row">
            <div className="cms-accesslog-field">
              <label className="cms-accesslog-label">아이디</label>
              <input
                className="cms-accesslog-input"
                name="userId"
                value={searchParams.userId}
                onChange={handleInputChange}
                placeholder="검색명을 입력하세요."
              />
            </div>
            <div className="cms-accesslog-field">
              <label className="cms-accesslog-label">이름</label>
              <input
                className="cms-accesslog-input"
                name="userName"
                value={searchParams.userName}
                onChange={handleInputChange}
                placeholder="검색명을 입력하세요."
              />
            </div>
            <div className="cms-accesslog-field">
              <label className="cms-accesslog-label">IP</label>
              <input
                className="cms-accesslog-input"
                name="cmsAccessUserIp"
                value={searchParams.cmsAccessUserIp}
                onChange={handleInputChange}
                placeholder="검색명을 입력하세요."
              />
            </div>
          </div>

          {/* 두 번째 행: 등급, 발생일 */}
          <div className="cms-accesslog-row">
            <div className="cms-accesslog-field">
              <label className="cms-accesslog-label">등급</label>
              <select
                className="cms-accesslog-select"
                name="adminTypeIndex"
                value={searchParams.adminTypeIndex}
                onChange={handleInputChange}
              >
                <option value="0">등급을 선택하세요.</option>
                {adminTypes.map((type) => (
                  <option key={type.adminTypeIndex} value={type.adminTypeIndex}>
                    {type.adminTypeName}
                  </option>
                ))}
              </select>
            </div>
            <div className="cms-accesslog-field">
              <label className="cms-accesslog-label">발생일(시작)</label>
              <input
                className="cms-accesslog-input"
                type="date"
                name="cmsAccessUserTimeStart"
                value={searchParams.cmsAccessUserTimeStart}
                onChange={handleInputChange}
                max={today}
                placeholder="연도-월-일"
              />
            </div>
            <div className="cms-accesslog-field">
              <label className="cms-accesslog-label">발생일(종료)</label>
              <input
                className="cms-accesslog-input"
                type="date"
                name="cmsAccessUserTimeEnd"
                value={searchParams.cmsAccessUserTimeEnd}
                onChange={handleInputChange}
                max={today}
                placeholder="연도-월-일"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="cms-accesslog-error">
          {error}
        </div>
      )}

      {/* 결과 테이블 섹션 */}
      <div className="cms-accesslog-table-container">
        {processedData.length === 0 && !loading ? (
          <div className="cms-accesslog-no-results">
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
                    borderRadius: '6px'
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

export default CmsAccessLog;
