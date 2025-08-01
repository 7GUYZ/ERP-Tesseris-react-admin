import React, { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

import '../../../styles/deokkyu/common.css';
import '../../../styles/deokkyu/BusinessManAllowanceDetails.css'; 
import { getAllowanceList, setupInterceptors } from '../../../api/auth/DeokkyuAuth';
import NoRowsOverlay from '../../../components/ui/deokkyu/NoRowsOverlay';
import { downloadExcel, downloadSelectedExcel } from '../../../components/feature/jihun/common/ExcelCommon';

const columns = [
  { field: 'businessUserId', headerName: '사업자 ID', width: 120 },
  { field: 'businessUserName', headerName: '사업자 이름', width: 120 },
  { field: 'businessGradeName', headerName: '사업자 등급', width: 120 }, 
  { field: 'businessUserPhone', headerName: '핸드폰 번호', width: 140 },
  { field: 'businessAreaName', headerName: '담당 구역', width: 140 },
  { field: 'storeName', headerName: '가맹점 명', width: 160 },
  { field: 'storeUserId', headerName: '가맹점 ID', width: 120 },
  { field: 'storeUserName', headerName: '회원 이름', width: 100 },
  { field: 'temporaryStoreMasterDistributionTime', headerName: '분배시간', width: 120 },
  { field: 'temporaryStoreCmValue', headerName: '중개수수료 CM', width: 120 },
  { field: 'temporaryStoreCashValue', headerName: '중개수수료 Cash', width: 120 },
  { field: 'temporaryStoreTotalValue', headerName: '중개수수료 합계', width: 120 },
];

function BusinessManAllowanceDetails() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [filter, setFilter] = useState({
    businessUserId: '',
    businessUserName: '',
    businessGradeName: '전체',
    businessUserPhone: '',
    businessAreaName: '',
    storeName: '',
    storeUserId: '',
    storeUserName: '',
    temporaryStoreMasterDistributionTimeStart: null,
    temporaryStoreMasterDistributionTimeEnd: null,
  });

  const fetchAllowance = async (params = {}) => {
    try {
      setLoading(true);
      const cleanedParams = {};
      const stringFields = [
        'businessUserId', 'businessUserName', 'businessGradeName',
        'businessUserPhone', 'businessAreaName', 'storeName',
        'storeUserId', 'storeUserName'
      ];

      stringFields.forEach((key) => {
        if (params[key] !== '' && params[key] !== undefined && params[key] !== '전체') {
          cleanedParams[key] = params[key];
        }
      });

      if (params.temporaryStoreMasterDistributionTimeStart)
        cleanedParams.temporaryStoreMasterDistributionTimeStart = dayjs(params.temporaryStoreMasterDistributionTimeStart).format('YYYY-MM-DD');
      if (params.temporaryStoreMasterDistributionTimeEnd)
        cleanedParams.temporaryStoreMasterDistributionTimeEnd = dayjs(params.temporaryStoreMasterDistributionTimeEnd).format('YYYY-MM-DD');

      const response = await getAllowanceList(
        Object.keys(cleanedParams).length > 0 ? cleanedParams : undefined
      );

      const data = response.data.map((item, index) => ({
        id: index + 1,
        ...item,
      }));

      setRows(data);
    } catch (error) {
      console.error('조회 실패:', error);
      alert(`데이터를 불러오는 데 실패했습니다: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 인터셉터 설정 (인증 토큰 자동 추가)
    setupInterceptors();
    
    // 데이터 로딩
    fetchAllowance({});
  }, []);

  const handleSearch = () => {
    fetchAllowance({ ...filter });
  };

  const handleExcelDownload = () => {
    const excelData = rows.map(row => {
      const { id, ...dataWithoutId } = row;
      return dataWithoutId;
    });
    
    downloadExcel(excelData, '사업자수당상세리스트', '사업자수당상세정보');
  }

  const handleSelectedExcelDownload = () => {
    if (!selectedRows || selectedRows.size === 0) {
      alert('다운로드할 항목을 체크해주세요.');
      return;
    }
    
    const selectedIndices = new Set();
    selectedRows.forEach(id => {
      selectedIndices.add(id - 1);
    });
    
    const excelData = rows.map(row => {
      const { id, ...dataWithoutId } = row;
      return dataWithoutId;
    });
    
    downloadSelectedExcel(excelData, selectedIndices, '사업자수당상세리스트_선택항목', '사업자수당상세정보');
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box className="deokkyu-container">
        <div className="deokkyu-page-title">사업자 수당 내역</div>
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
        <div className="businessman-filter-card">
          {/* 필터 토글 헤더 */}
          <div className="deokkyu-filter-toggle-header">
            <button 
              className="deokkyu-filter-toggle-btn"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <span className="deokkyu-filter-toggle-text">검색 조건</span>
              <span className={`deokkyu-filter-toggle-icon ${isFilterOpen ? 'open' : 'closed'}`}>
                ▼
              </span>
            </button>
          </div>
          
          {/* 필터 폼 */}
          <div className={`deokkyu-filter-form ${isFilterOpen ? 'open' : 'closed'}`}>
            {/* 첫 번째 행: 사업자 ID, 사업자 이름, 사업자 등급, 사업자 핸드폰 번호 */}
            <div className="deokkyu-filter-row">
              <div className="deokkyu-filter-field">
                <label className="deokkyu-filter-label">사업자 ID</label>
                <input
                  className="deokkyu-filter-input"
                  value={filter.businessUserId}
                  onChange={(e) => setFilter({ ...filter, businessUserId: e.target.value })}
                  placeholder="사업자 ID를 입력하세요"
                />
              </div>
              <div className="deokkyu-filter-field">
                <label className="deokkyu-filter-label">사업자 이름</label>
                <input
                  className="deokkyu-filter-input"
                  value={filter.businessUserName}
                  onChange={(e) => setFilter({ ...filter, businessUserName: e.target.value })}
                  placeholder="사업자 이름을 입력하세요"
                />
              </div>
              <div className="deokkyu-filter-field">
                <label className="deokkyu-filter-label">사업자 등급</label>
                <select
                  className="deokkyu-filter-select"
                  value={filter.businessGradeName}
                  onChange={(e) => setFilter({ ...filter, businessGradeName: e.target.value })}
                >
                  <option value="전체">전체</option>
                  <option value="A등급">A등급</option>
                  <option value="B등급">B등급</option>
                  <option value="C등급">C등급</option>
                </select>
              </div>
              <div className="deokkyu-filter-field">
                <label className="deokkyu-filter-label">사업자 핸드폰 번호</label>
                <input
                  className="deokkyu-filter-input"
                  value={filter.businessUserPhone}
                  onChange={(e) => setFilter({ ...filter, businessUserPhone: e.target.value })}
                  placeholder="사업자 핸드폰 번호를 입력하세요"
                />
              </div>
            </div>

            {/* 두 번째 행: 담당 구역, 가맹점 명, 가맹점 ID, 회원 이름 */}
            <div className="deokkyu-filter-row">
              <div className="deokkyu-filter-field">
                <label className="deokkyu-filter-label">담당 구역</label>
                <input
                  className="deokkyu-filter-input"
                  value={filter.businessAreaName}
                  onChange={(e) => setFilter({ ...filter, businessAreaName: e.target.value })}
                  placeholder="담당 구역을 입력하세요"
                />
              </div>
              <div className="deokkyu-filter-field">
                <label className="deokkyu-filter-label">가맹점 명</label>
                <input
                  className="deokkyu-filter-input"
                  value={filter.storeName}
                  onChange={(e) => setFilter({ ...filter, storeName: e.target.value })}
                  placeholder="가맹점 명을 입력하세요"
                />
              </div>
              <div className="deokkyu-filter-field">
                <label className="deokkyu-filter-label">가맹점 ID</label>
                <input
                  className="deokkyu-filter-input"
                  value={filter.storeUserId}
                  onChange={(e) => setFilter({ ...filter, storeUserId: e.target.value })}
                  placeholder="가맹점 ID를 입력하세요"
                />
              </div>
              <div className="deokkyu-filter-field">
                <label className="deokkyu-filter-label">회원 이름</label>
                <input
                  className="deokkyu-filter-input"
                  value={filter.storeUserName}
                  onChange={(e) => setFilter({ ...filter, storeUserName: e.target.value })}
                  placeholder="회원 이름을 입력하세요"
                />
              </div>
            </div>

            {/* 세 번째 행: 분배시간 시작, 분배시간 종료 */}
            <div className="deokkyu-filter-row">
              <div className="deokkyu-filter-field">
                <label className="deokkyu-filter-label">분배시간 시작</label>
                <input
                  className="deokkyu-filter-input"
                  type="date"
                  value={filter.temporaryStoreMasterDistributionTimeStart ? dayjs(filter.temporaryStoreMasterDistributionTimeStart).format('YYYY-MM-DD') : ''}
                  onChange={(e) => setFilter({ ...filter, temporaryStoreMasterDistributionTimeStart: e.target.value ? dayjs(e.target.value) : null })}
                />
              </div>
              <div className="deokkyu-filter-field">
                <label className="deokkyu-filter-label">분배시간 종료</label>
                <input
                  className="deokkyu-filter-input"
                  type="date"
                  value={filter.temporaryStoreMasterDistributionTimeEnd ? dayjs(filter.temporaryStoreMasterDistributionTimeEnd).format('YYYY-MM-DD') : ''}
                  onChange={(e) => setFilter({ ...filter, temporaryStoreMasterDistributionTimeEnd: e.target.value ? dayjs(e.target.value) : null })}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="deokkyu-data-grid">
          <DataGrid
            rows={rows}
            columns={columns}
            pageSize={25}
            rowsPerPageOptions={[25, 50, 100]}
            loading={loading}
            checkboxSelection
            disableRowSelectionOnClick
            onRowSelectionModelChange={(newSelection) => {
              if (newSelection && typeof newSelection === 'object' && newSelection.ids) {
                setSelectedRows(newSelection.ids);
              } else if (Array.isArray(newSelection)) {
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
    </LocalizationProvider>
  );
}

export default BusinessManAllowanceDetails;
