import React, { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

import '../../../styles/deokkyu/common.css';
import '../../../styles/deokkyu/StoreList.css'; 
import { getStoreList, setupInterceptors } from '../../../api/auth/DeokkyuAuth';
import { permissionCheckApi } from '../../../api/auth/TaekjunAuth';
import { useToast } from '../../../context/jungeun/ToastContext';
import NoRowsOverlay from '../../../components/ui/deokkyu/NoRowsOverlay';
import StoreDetailModal from '../../../components/feature/deokkyu/dmodal/StoreDetailModal';
import { downloadExcel, downloadSelectedExcel } from '../../../components/feature/jihun/common/ExcelCommon';

const columns = [
  { field: 'businessUserId', headerName: '사업자 ID', width: 120 },
  { field: 'businessUserName', headerName: '사업자 이름', width: 120 },
  { field: 'businessGradeName', headerName: '사업자 등급', width: 120 },
  { field: 'userId', headerName: '가맹점 ID', width: 120 },
  { field: 'userName', headerName: '이름', width: 100 },
  { field: 'userPhone', headerName: '핸드폰 번호', width: 140 },
  { field: 'storeBossName', headerName: '대표자 이름', width: 140 },
  { field: 'storeRegistrationNum', headerName: '사업자 등록번호', width: 160 },
  { field: 'storeTypeTaxation', headerName: '세금 유형', width: 160 },
  { field: 'storeCorporateName', headerName: '상호명', width: 160 },
  { field: 'storeName', headerName: '가맹점 명', width: 160 },
  { field: 'storeCategoryName', headerName: '가맹점 유형', width: 160 }, 
  { field: 'storePhone', headerName: '대표 번호', width: 160 },
  { field: 'storeRequestStatusName', headerName: '승인 여부', width: 100 },
  { field: 'storeTransactionStatus', headerName: '거래 상태', width: 100 },
  { field: 'userCmpInit', headerName: '초기지급 CMP', width: 100 },
  { field: 'totalCM', headerName: '보유 TS', width: 100 },
  { field: 'storeCreateDate', headerName: '신청일', width: 120 },
];

function StoreList() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [canUpdate, setCanUpdate] = useState(false);
  const { showToast } = useToast();
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  
  // 모달 상태
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const [selectedStoreData, setSelectedStoreData] = useState(null);
  const [filter, setFilter] = useState({
    userId: '',
    userName: '', // 
    userPhone: '', // 가맹점 번호
    storeBossName: '', // 대표자이름
    storeRequestStatusName: '전체', // 승인여부 - 라디오
    storeTransactionStatus: '전체',// 거래상태 - 라디오
    storeCorporateName: '', // 상호명
    storeName: '', // 가맹점 명
    businessUserName: '', // 사업자 이름
    storeCreateDateStart: null, 
    storeCreateDateEnd: null,
  });

  const fetchStores = async (params = {}) => {
    try {
      setLoading(true); // 로딩 시작
      const cleanedParams = {};
      const stringFields = [
        'userId', 'userName', 'userPhone', 'storeBossName',
        'storeRequestStatusName', 'storeTransactionStatus',
        'storeCorporateName', 'storeName', 'businessUserName'
      ];

      stringFields.forEach((key) => {
        if (params[key] !== '' && params[key] !== undefined) {
          cleanedParams[key] = params[key];
        }
      });

      if (params.storeCreateDateStart)
        cleanedParams.storeCreateDateStart = dayjs(params.storeCreateDateStart).format('YYYY-MM-DD');
      if (params.storeCreateDateEnd)
        cleanedParams.storeCreateDateEnd = dayjs(params.storeCreateDateEnd).format('YYYY-MM-DD');

      const response = await getStoreList(
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
  // 권한 체크
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const response = await permissionCheckApi.checkPermission(20); // programIndex: 20 (가맹점 회원 리스트)
        if (response.data) {
          setCanUpdate(response.data.hasUpdateAuthority === 1);
          console.log('가맹점 회원 리스트 수정 권한 체크 결과:', response.data.hasUpdateAuthority);
        }
      } catch (error) {
        console.error('권한 체크 실패:', error);
        setCanUpdate(false);
      }
    };
    
    checkPermission();
  }, []);

  useEffect(() => {
    // 인터셉터 설정 (인증 토큰 자동 추가)
    setupInterceptors();
    
    // 데이터 로딩
    fetchStores({}); // 최초 진입 시에만 로딩중 표시
  }, []);

  // 조회 버튼 클릭 시 → 현재 검색 조건으로 조회
  const handleSearch = () => {
    fetchStores({ ...filter }); // 검색 시에는 로딩중 표시 안 함
  };

  const handleExcelDownload = () => {
    // id 필드를 제외하고 엑셀 다운로드용 데이터 준비
    const excelData = rows.map(row => {
      const { id, ...dataWithoutId } = row;
      return dataWithoutId;
    });
    
    downloadExcel(excelData, '가맹점회원리스트', '가맹점회원정보');
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
    
    downloadSelectedExcel(excelData, selectedIndices, '가맹점회원리스트_선택항목', '가맹점회원정보');
  }

  // 수정 버튼 클릭 핸들러
  const handleEditClick = () => {
    if (!canUpdate) {
      showToast("error", "수정 권한이 없습니다.");
      return;
    }

    console.log('🖱️ 수정 버튼 클릭, 선택된 행 수:', selectedRows.size);
    console.log('📋 선택된 행 IDs:', Array.from(selectedRows));

    if (selectedRows.size === 0) {
      alert('수정할 가맹점을 선택해주세요.');
      return;
    }

    if (selectedRows.size > 1) {
      alert('한 번에 하나의 가맹점만 수정할 수 있습니다.\n여러 개가 선택되었습니다.');
      return;
    }

    // 선택된 행이 정확히 1개인 경우
    const selectedId = Array.from(selectedRows)[0];
    console.log('📝 선택된 ID:', selectedId);
    
    // rows에서 해당 id를 가진 행 찾기
    const selectedRow = rows.find(row => row.id === selectedId);
    
    if (selectedRow) {
      console.log('✅ 선택된 가맹점 데이터:', selectedRow);
      setSelectedStoreId(selectedRow.userId);
      setSelectedStoreData(selectedRow);
      setModalOpen(true);
      console.log('🔥 모달 열기 완료');
    } else {
      console.error('🚨 선택된 행을 찾을 수 없습니다:', selectedId);
      alert('선택된 가맹점 정보를 찾을 수 없습니다.');
    }
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box className="deokkyu-container">
        <div className="deokkyu-page-title">가맹점 회원 리스트</div>
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
            className="deokkyu-btn edit"
            onClick={handleEditClick}
            disabled={selectedRows.size === 0 || !canUpdate}
            style={!canUpdate ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
            ✏️ 수정
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
            {/* 첫 번째 행: 가맹점 ID, 이름, 핸드폰 번호, 대표자 이름 */}
            <div className="store-filter-row">
              <div className="store-filter-field">
                <label className="store-filter-label">가맹점 ID</label>
                <input
                  className="store-filter-input"
                  value={filter.userId}
                  onChange={(e) => setFilter({ ...filter, userId: e.target.value })}
                  placeholder="가맹점 ID를 입력하세요"
                />
              </div>
              <div className="store-filter-field">
                <label className="store-filter-label">이름</label>
                <input
                  className="store-filter-input"
                  value={filter.userName}
                  onChange={(e) => setFilter({ ...filter, userName: e.target.value })}
                  placeholder="이름을 입력하세요"
                />
              </div>
              <div className="store-filter-field">
                <label className="store-filter-label">핸드폰 번호</label>
                <input
                  className="store-filter-input"
                  value={filter.userPhone}
                  onChange={(e) => setFilter({ ...filter, userPhone: e.target.value })}
                  placeholder="핸드폰 번호를 입력하세요"
                />
              </div>
              <div className="store-filter-field">
                <label className="store-filter-label">대표자 이름</label>
                <input
                  className="store-filter-input"
                  value={filter.storeBossName}
                  onChange={(e) => setFilter({ ...filter, storeBossName: e.target.value })}
                  placeholder="대표자 이름을 입력하세요"
                />
              </div>
            </div>

            {/* 두 번째 행: 승인 여부, 거래 상태, 상호명, 가맹점 명 */}
            <div className="store-filter-row">
              <div className="store-filter-field">
                <label className="store-filter-label">승인 여부</label>
                <select
                  className="store-filter-select"
                  value={filter.storeRequestStatusName}
                  onChange={(e) => setFilter({ ...filter, storeRequestStatusName: e.target.value })}
                >
                  <option value="전체">전체</option>
                  <option value="승인">승인</option>
                  <option value="대기">대기</option>
                  <option value="거절">거절</option>
                  <option value="보류">보류</option>
                  <option value="해지">해지</option>
                </select>
              </div>
              <div className="store-filter-field">
                <label className="store-filter-label">거래 상태</label>
                <select
                  className="store-filter-select"
                  value={filter.storeTransactionStatus}
                  onChange={(e) => setFilter({ ...filter, storeTransactionStatus: e.target.value })}
                >
                  <option value="전체">전체</option>
                  <option value="정상">정상</option>
                  <option value="정지">정지</option>
                </select>
              </div>
              <div className="store-filter-field">
                <label className="store-filter-label">상호명</label>
                <input
                  className="store-filter-input"
                  value={filter.storeCorporateName}
                  onChange={(e) => setFilter({ ...filter, storeCorporateName: e.target.value })}
                  placeholder="상호명을 입력하세요"
                />
              </div>
              <div className="store-filter-field">
                <label className="store-filter-label">가맹점 명</label>
                <input
                  className="store-filter-input"
                  value={filter.storeName}
                  onChange={(e) => setFilter({ ...filter, storeName: e.target.value })}
                  placeholder="가맹점 명을 입력하세요"
                />
              </div>
            </div>

            {/* 세 번째 행: 사업자 이름, 신청일 시작, 신청일 종료 */}
            <div className="store-filter-row">
              <div className="store-filter-field">
                <label className="store-filter-label">사업자 이름</label>
                <input
                  className="store-filter-input"
                  value={filter.businessUserName}
                  onChange={(e) => setFilter({ ...filter, businessUserName: e.target.value })}
                  placeholder="사업자 이름을 입력하세요"
                />
              </div>
              <div className="store-filter-field">
                <label className="store-filter-label">신청일 시작</label>
                <input
                  className="store-filter-input"
                  type="date"
                  value={filter.storeCreateDateStart ? dayjs(filter.storeCreateDateStart).format('YYYY-MM-DD') : ''}
                  onChange={(e) => setFilter({ ...filter, storeCreateDateStart: e.target.value ? dayjs(e.target.value) : null })}
                />
              </div>
              <div className="store-filter-field">
                <label className="store-filter-label">신청일 종료</label>
                <input
                  className="store-filter-input"
                  type="date"
                  value={filter.storeCreateDateEnd ? dayjs(filter.storeCreateDateEnd).format('YYYY-MM-DD') : ''}
                  onChange={(e) => setFilter({ ...filter, storeCreateDateEnd: e.target.value ? dayjs(e.target.value) : null })}
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
      
      {/* 가맹점 상세정보 모달 */}
      <StoreDetailModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedStoreId(null);
          setSelectedStoreData(null);
        }}
        storeId={selectedStoreId}
        initialData={selectedStoreData}
      />

    </LocalizationProvider>
  );
}

export default StoreList;
