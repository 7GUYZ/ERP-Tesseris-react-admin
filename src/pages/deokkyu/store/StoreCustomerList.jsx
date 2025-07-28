import React, { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import { getCustomerAllStoreList, getStoreCustomerList, setupInterceptors } from '../../../api/auth/DeokkyuAuth';
import '../../../styles/deokkyu/common.css';
import '../../../styles/deokkyu/StoreCustomerList.css'; 
import NoRowsOverlay from '../../../components/ui/deokkyu/NoRowsOverlay';
import { downloadExcel } from '../../../components/feature/jihun/common/ExcelCommon';

// 가맹점 리스트 컬럼
const storeColumns = [
  { field: 'userId', headerName: '가맹점 ID', width: 120 },
  { field: 'userName', headerName: '이름', width: 100 },
  { field: 'storeCorporateName', headerName: '상호명', width: 160 },
  { field: 'storeName', headerName: '가맹점 명', width: 160 },
  { field: 'customerCount', headerName: '고객 수', width: 100 },
];

// 고객 리스트 컬럼
const customerColumns = [
  { field: 'userId', headerName: 'ID', width: 120 },
  { field: 'userName', headerName: '이름', width: 100 },
  { field: 'storeCustomerStatus', headerName: '고객 등급', width: 160 },
];

function StoreCustomerList() {
  const [loading, setLoading] = useState(false);
  const [storeRows, setStoreRows] = useState([]);
  const [customerRows, setCustomerRows] = useState([]);
  const [selectedStoreRows, setSelectedStoreRows] = useState(new Set());
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  
  // 검색 필터 상태
  const [filter, setFilter] = useState({
    userId: '',
    userName: '',
    storeCorporateName: '',
    storeName: '',
  });

  // ============================================================================
  // API 호출 함수들
  // ============================================================================

  /**
   * 가맹점 리스트 조회
   * @param {Object} params - 검색 파라미터
   */
  const fetchStores = async (params = {}) => {
    try {
      setLoading(true);
      const cleanedParams = {};

      // 문자열 필드 필터링
      const stringFields = ['userId', 'userName', 'storeCorporateName', 'storeName'];
      stringFields.forEach((key) => {
        if (params[key] !== '' && params[key] !== undefined) {
          cleanedParams[key] = params[key];
        }
      });

      const response = await getCustomerAllStoreList(
        Object.keys(cleanedParams).length > 0 ? cleanedParams : undefined
      );

      const data = response.data.map((item, index) => ({
        id: index + 1,
        ...item,
      }));

      setStoreRows(data);
    } catch (error) {
      console.error('가맹점 조회 실패:', error);
      alert('데이터를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 특정 가맹점의 고객 리스트 조회
   * @param {string} storeId - 가맹점 ID
   */
  const fetchCustomers = async (storeId) => {
    try {
      console.log('📡 고객 리스트 API 요청:', storeId);
      const response = await getStoreCustomerList(storeId);
      console.log('📥 고객 리스트 응답:', response.data); // 이 로그가 안 찍히면 요청 자체가 실패한 것
      const data = response.data.map((item, index) => ({
        id: index + 1,
        ...item,
      }));
      setCustomerRows(data);
    } catch (error) {
      console.error('고객 리스트 조회 실패:', error);
      alert('고객 리스트를 불러오는 데 실패했습니다.');
    }
  };

  // ============================================================================
  // 이벤트 핸들러
  // ============================================================================

  /**
   * 가맹점 행 클릭 시 해당 가맹점의 고객 리스트 조회
   * @param {Object} store - 클릭된 가맹점 데이터
   */
  const handleStoreClick = (store) => {
    console.log('클릭된 가맹점:', store); // 🔍 추가
    if (store && store.userId) {
      fetchCustomers(store.userId);
    } else {
      console.warn('userId 없음:', store); // 🔍 추가
    }
  };

  /**
   * 검색 버튼 클릭 시 현재 필터 조건으로 가맹점 조회
   */
  const handleSearch = () => {
    fetchStores({ ...filter });
  };

  // ============================================================================
  // 엑셀 다운로드 함수들
  // ============================================================================

  /**
   * 전체 가맹점의 통합 데이터 엑셀 다운로드
   */
  const handleExcelDownload = async () => {
    if (storeRows.length === 0) {
      alert('다운로드할 데이터가 없습니다.');
      return;
    }

    try {
      const integratedData = [];
      
      // 모든 가맹점의 고객 데이터 수집
      for (const store of storeRows) {
        const response = await getStoreCustomerList(store.userId);
        
        if (response.data && response.data.length > 0) {
          // 고객이 있는 경우: 각 고객별로 가맹점 정보와 함께 데이터 생성
          response.data.forEach(customer => {
            integratedData.push({
              가맹점ID: store.userId,
              가맹점명: store.storeName,
              상호명: store.storeCorporateName,
              고객수: store.customerCount,
              고객ID: customer.userId,
              고객명: customer.userName,
              고객등급: customer.storeCustomerStatus
            });
          });
        } else {
          // 고객이 없는 경우: 가맹점 정보만 포함
          integratedData.push({
            가맹점ID: store.userId,
            가맹점명: store.storeName,
            상호명: store.storeCorporateName,
            고객수: store.customerCount,
            고객ID: '',
            고객명: '',
            고객등급: ''
          });
        }
      }

      if (integratedData.length === 0) {
        alert('다운로드할 데이터가 없습니다.');
        return;
      }

      downloadExcel(integratedData, '가맹점고객관리_전체통합리스트', '가맹점고객통합정보');
      
    } catch (error) {
      console.error('데이터 수집 오류:', error);
      alert('데이터를 가져오는 중 오류가 발생했습니다.');
    }
  };

  /**
   * 선택된 가맹점들의 통합 데이터 엑셀 다운로드
   */
  const handleSelectedExcelDownload = async () => {
    if (selectedStoreRows.size === 0) {
      alert('다운로드할 가맹점을 체크해주세요.');
      return;
    }

    try {
      const integratedData = [];
      
      // 선택된 가맹점들의 고객 데이터 수집
      for (const storeId of selectedStoreRows) {
        const store = storeRows.find(row => row.id === storeId);
        if (store) {
          const response = await getStoreCustomerList(store.userId);
          console.log('고객 리스트 API 응답:', response.data); // 응답 로그
          if (response.data && response.data.length > 0) {
            // 고객이 있는 경우: 각 고객별로 가맹점 정보와 함께 데이터 생성
            response.data.forEach(customer => {
              integratedData.push({
                가맹점ID: store.userId,
                가맹점명: store.storeName,
                상호명: store.storeCorporateName,
                고객수: store.customerCount,
                고객ID: customer.userId,
                고객명: customer.userName,
                고객등급: customer.storeCustomerStatus
              });
            });
          } else {
            // 고객이 없는 경우: 가맹점 정보만 포함
            integratedData.push({
              가맹점ID: store.userId,
              가맹점명: store.storeName,
              상호명: store.storeCorporateName,
              고객수: store.customerCount,
              고객ID: '',
              고객명: '',
              고객등급: ''
            });
          }
        }
      }

      if (integratedData.length === 0) {
        alert('선택된 가맹점의 데이터가 없습니다.');
        return;
      }

      downloadExcel(integratedData, '가맹점고객관리_선택가맹점통합리스트', '가맹점고객통합정보');
      
    } catch (error) {
      console.error('데이터 수집 오류:', error);
      alert('데이터를 가져오는 중 오류가 발생했습니다.');
    }
  };

  // 페이지 진입 시 전체 가맹점 데이터 자동 조회
  useEffect(() => {
    // 인터셉터 설정 (인증 토큰 자동 추가)
    setupInterceptors();
    
    // 데이터 로딩
    fetchStores();
  }, []);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box className="deokkyu-container">
        {/* 페이지 제목 */}
        <div className="deokkyu-page-title">가맹점 고객관리</div>
        
        {/* 버튼 영역 */}
        <div className="deokkyu-actions">
          <button 
            className="deokkyu-btn excel" 
            onClick={handleSelectedExcelDownload}
            disabled={selectedStoreRows.size === 0}
          >
            선택 엑셀
          </button>
          <button 
            className="deokkyu-btn all-excel" 
            onClick={handleExcelDownload}
            disabled={storeRows.length === 0}
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

        {/* 검색 필터 영역 */}
        <div className="store-customer-filter-card">
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
            <div className="deokkyu-filter-row">
              <div className="deokkyu-filter-field">
                <label className="deokkyu-filter-label">가맹점 ID</label>
                <input
                  className="deokkyu-filter-input"
                  value={filter.userId}
                  onChange={(e) => setFilter({ ...filter, userId: e.target.value })}
                  placeholder="가맹점 ID를 입력하세요"
                />
              </div>
              <div className="deokkyu-filter-field">
                <label className="deokkyu-filter-label">이름</label>
                <input
                  className="deokkyu-filter-input"
                  value={filter.userName}
                  onChange={(e) => setFilter({ ...filter, userName: e.target.value })}
                  placeholder="이름을 입력하세요"
                />
              </div>
              <div className="deokkyu-filter-field">
                <label className="deokkyu-filter-label">상호명</label>
                <input
                  className="deokkyu-filter-input"
                  value={filter.storeCorporateName}
                  onChange={(e) => setFilter({ ...filter, storeCorporateName: e.target.value })}
                  placeholder="상호명을 입력하세요"
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
            </div>
          </div>
        </div>

        {/* 데이터 그리드 영역 */}
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          {/* 가맹점 리스트 */}
          <div className="data-grid-container1">
            <DataGrid
              rows={storeRows}
              columns={storeColumns}
              pageSize={25}
              rowsPerPageOptions={[25, 50, 100]}
              onRowClick={(params) => handleStoreClick(params.row)}
              loading={loading}
              checkboxSelection
              onRowSelectionModelChange={(newSelection) => {
                if (newSelection && typeof newSelection === 'object' && newSelection.ids) {
                  setSelectedStoreRows(newSelection.ids);
                } else if (Array.isArray(newSelection)) {
                  setSelectedStoreRows(new Set(newSelection));
                } else {
                  setSelectedStoreRows(new Set());
                }
              }}
              slots={{
                noRowsOverlay: () => <NoRowsOverlay loading={loading} />,
              }}
            />
          </div>
          
          {/* 고객 리스트 */}
          <div className="data-grid-container2">
            <DataGrid
              rows={customerRows}
              columns={customerColumns}
              pageSize={25}
              rowsPerPageOptions={[25, 50, 100]}
              loading={loading}
              slots={{
                noRowsOverlay: () => <NoRowsOverlay loading={loading} />,
              }}
            />
          </div>
        </div>
      </Box>
    </LocalizationProvider>
  );
}

export default StoreCustomerList;
