import React, { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

import '../../../styles/deokkyu/common.css';
import '../../../styles/deokkyu/StoreList.css'; 
import { getAdminList, setupInterceptors } from '../../../api/auth/DeokkyuAuth';
import NoRowsOverlay from '../../../components/ui/deokkyu/NoRowsOverlay';
import RealTimeChat from '../../../components/chat/RealTimeChat';
import { downloadExcel, downloadSelectedExcel } from '../../../components/feature/jihun/common/ExcelCommon';

const columns = [
  { field: 'adminUserEmail', headerName: '관리자 ID', width: 120 },
  { field: 'adminUserName', headerName: '관리자 이름', width: 120 },
  { field: 'adminUserPhone', headerName: '핸드폰 번호', width: 140 },
  // user_index로 user_tesseris 테이블 가서 users_id 조회 후 users 테이블에서 동일한 id 칼럼의 email, name, phone 조회

  { field: 'adminTypeName', headerName: '관리자 타입', width: 120 }, // admin_type_index 로 admin_type 테이블에서 조회
  { field: 'adminRankName', headerName: '관리자 등급', width: 120 },
  { field: 'adminRegistrationDate', headerName: '등록시간', width: 150 },
  
];

function AdminList() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [filter, setFilter] = useState({
    adminUserEmail: '',
    adminUserName: '', 
    adminUserPhone: '', 
    adminTypeName: '', 
    adminRankName: '', 
    adminRegistrationDateStart: null, 
    adminRegistrationDateEnd: null,
  });

  const fetchAdmins = async (params = {}) => {
    try {
      setLoading(true); // 로딩 시작
      const cleanedParams = {};
      const stringFields = [
        'adminUserEmail', 'adminUserName', 'adminUserPhone', 'adminTypeName',
        'adminRankName'
      ];

      stringFields.forEach((key) => {
        if (params[key] !== '' && params[key] !== undefined) {
          cleanedParams[key] = params[key];
        }
      });

      if (params.adminRegistrationDateStart)
        cleanedParams.adminRegistrationDateStart = dayjs(params.adminRegistrationDateStart).format('YYYY-MM-DD');
      if (params.adminRegistrationDateEnd)
        cleanedParams.adminRegistrationDateEnd = dayjs(params.adminRegistrationDateEnd).format('YYYY-MM-DD');

      const response = await getAdminList(
        Object.keys(cleanedParams).length > 0 ? cleanedParams : undefined
      );

      const data = response.data.map((item, index) => ({
        id: index + 1,
        ...item,
      }));

      setRows(data);
    } catch (error) {
      console.error('조회 실패:', error);
      alert('데이터를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false); // 로딩 종료
    }
  };

  // 페이지 진입 시 → 빈 검색 조건으로 전체 데이터 자동 조회
  useEffect(() => {
    // 인터셉터 설정 (인증 토큰 자동 추가)
    setupInterceptors();
    
    // 데이터 로딩
    fetchAdmins({}); // 최초 진입 시에만 로딩중 표시
  }, []);

  // 조회 버튼 클릭 시 → 현재 검색 조건으로 조회
  const handleSearch = () => {
    fetchAdmins({ ...filter }); // 검색 시에는 로딩중 표시 안 함
  };

  const handleExcelDownload = () => {
    // id 필드를 제외하고 엑셀 다운로드용 데이터 준비
    const excelData = rows.map(row => {
      const { id, ...dataWithoutId } = row;
      return dataWithoutId;
    });
    
        downloadExcel(excelData, '관리자리스트', '관리자정보');
  }

  const handleSelectedExcelDownload = () => {
    if (!selectedRows || selectedRows.size === 0) {
      alert('다운로드할 항목을 체크해주세요.');
      return;
    }
    
    // 선택된 행들의 실제 인덱스 계산 (id - 1)
    const selectedIndices = new Set();
    selectedRows.forEach(id => {
      selectedIndices.add(id - 1); // id는 index + 1이므로 실제 인덱스는 id - 1
    });
    
    // id 필드를 제외하고 엑셀 다운로드용 데이터 준비
    const excelData = rows.map(row => {
      const { id, ...dataWithoutId } = row;
      return dataWithoutId;
    });
    
    downloadSelectedExcel(excelData, selectedIndices, '관리자리스트_선택항목', '관리자정보');
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box className="deokkyu-container">
        <div className="deokkyu-page-title">관리자 리스트</div>
        <div className="deokkyu-actions">
          <button 
            className="deokkyu-btn excel" 
            onClick={handleSelectedExcelDownload}
            disabled={selectedRows.size === 0}
          >
            선택 엑셀
          </button>
          <button 
            className="deokkyu-btn all-excel" 
            onClick={handleExcelDownload}
            disabled={rows.length === 0}
          >
            전체 엑셀
          </button>
          <button
            className="deokkyu-btn search"
            onClick={handleSearch}
            disabled={loading}
          >
            {loading ? "조회 중..." : "조회"}
          </button>
        </div>
        
        {/* 필터 섹션 */}
        <div className="store-filter-card">
          {/* 필터 토글 헤더 */}
          <div className="store-filter-toggle-header">
            <button 
              className="store-filter-toggle-btn"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <span className="store-filter-toggle-text">검색 조건</span>
              <span className={`store-filter-toggle-icon ${isFilterOpen ? 'open' : 'closed'}`}>
                ▼
              </span>
            </button>
          </div>
          
          {/* 필터 폼 */}
          <div className={`store-filter-form ${isFilterOpen ? 'open' : 'closed'}`}>
            {/* 첫 번째 행: 사업자 ID, 사업자 이름, 핸드폰 번호, 관리자 타입 */}
            <div className="store-filter-row">
              <div className="store-filter-field">
                <label className="store-filter-label">관리자 ID</label>
                <input
                  className="store-filter-input"
                  value={filter.adminUserEmail}
                  onChange={(e) => setFilter({ ...filter, adminUserEmail: e.target.value })}
                  placeholder="관리자 ID를 입력하세요"
                />
              </div>
              <div className="store-filter-field">
                <label className="store-filter-label">관리자 이름</label>
                <input
                  className="store-filter-input"
                  value={filter.adminUserName}
                  onChange={(e) => setFilter({ ...filter, adminUserName: e.target.value })}
                  placeholder="관리자 이름을 입력하세요"
                />
              </div>
              <div className="store-filter-field">
                <label className="store-filter-label">핸드폰 번호</label>
                <input
                  className="store-filter-input"
                  value={filter.adminUserPhone}
                  onChange={(e) => setFilter({ ...filter, adminUserPhone: e.target.value })}
                  placeholder="핸드폰 번호를 입력하세요"
                />
              </div>
              <div className="store-filter-field">
                <label className="store-filter-label">관리자 타입</label>
                <input
                  className="store-filter-input"
                  value={filter.adminTypeName}
                  onChange={(e) => setFilter({ ...filter, adminTypeName: e.target.value })}
                  placeholder="관리자 타입을 입력하세요"
                />
              </div>
            </div>

            {/* 두 번째 행: 관리자 등급, 등록일 시작, 등록일 종료 */}
            <div className="store-filter-row">
              <div className="store-filter-field">
                <label className="store-filter-label">관리자 등급</label>
                <input
                  className="store-filter-input"
                  value={filter.adminRankName}
                  onChange={(e) => setFilter({ ...filter, adminRankName: e.target.value })}
                  placeholder="관리자 등급을 입력하세요"
                />
              </div>
              <div className="store-filter-field">
                <label className="store-filter-label">등록일 시작</label>
                <input
                  className="store-filter-input"
                  type="date"
                  value={filter.adminRegistrationDateStart ? dayjs(filter.adminRegistrationDateStart).format('YYYY-MM-DD') : ''}
                  onChange={(e) => setFilter({ ...filter, adminRegistrationDateStart: e.target.value ? dayjs(e.target.value) : null })}
                />
              </div>
              <div className="store-filter-field">
                <label className="store-filter-label">등록일 종료</label>
                <input
                  className="store-filter-input"
                  type="date"
                  value={filter.adminRegistrationDateEnd ? dayjs(filter.adminRegistrationDateEnd).format('YYYY-MM-DD') : ''}
                  onChange={(e) => setFilter({ ...filter, adminRegistrationDateEnd: e.target.value ? dayjs(e.target.value) : null })}
                />
              </div>
              <div className="store-filter-field">
                {/* 빈 필드 - 레이아웃 유지용 */}
              </div>
            </div>


          </div>
        </div>

        <div className="deokkyu-data-grid">
          <DataGrid
            rows={rows}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 25 }
              }
            }}
            pageSizeOptions={[25, 50, 100]}
            loading={loading}
            checkboxSelection
            disableRowSelectionOnClick
            onRowSelectionModelChange={(newSelection) => {
              // newSelection이 객체이고 ids 속성이 있는 경우
              if (newSelection && typeof newSelection === 'object' && newSelection.ids) {
                setSelectedRows(newSelection.ids);
              } else if (Array.isArray(newSelection)) {
                // 배열인 경우 (이전 버전 호환성)
                setSelectedRows(new Set(newSelection));
              } else {
                setSelectedRows(new Set());
              }
            }}
            slots={{
              noRowsOverlay: () => <NoRowsOverlay loading={loading} />,
            }}
          />
        </div>
      </Box>
      
      
      <RealTimeChat />
    </LocalizationProvider>
  );
}

export default AdminList;
