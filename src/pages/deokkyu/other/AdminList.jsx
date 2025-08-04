import React, { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

import '../../../styles/deokkyu/common.css';
import '../../../styles/deokkyu/StoreList.css'; 
import { getAdminList, createAdmin, getAdminDetail, updateAdmin, setupInterceptors } from '../../../api/auth/DeokkyuAuth';
import { permissionApi, permissionCheckApi } from '../../../api/auth/TaekjunAuth';
import { addressApi } from '../../../api/auth/TaekjunAuth';
import { useToast } from '../../../context/jungeun/ToastContext';
import NoRowsOverlay from '../../../components/ui/deokkyu/NoRowsOverlay';
import { downloadExcel, downloadSelectedExcel } from '../../../components/feature/jihun/common/ExcelCommon';

function AdminList() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [canInsert, setCanInsert] = useState(false);
  const { showToast } = useToast();
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [filter, setFilter] = useState({
    adminUserEmail: '',
    adminUserName: '', 
    adminUserPhone: '', 
    adminTypeName: '', 
    adminRegistrationDateStart: null, 
    adminRegistrationDateEnd: null,
  });

  // 등록 모달 관련 상태
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    // 기본 정보
    adminUserEmail: '',
    adminUserName: '',
    adminUserBirthday: '',
    adminUserGender: '',
    adminUserPhone: '',
    adminPassword: '',
    adminPasswordConfirm: '',
    
    // 관리자 정보
    adminTypeIndex: '',
    adminRegistrationDate: '',
    adminAddress: '',
    adminDetailAddress: ''
  });

  const [editingAdminId, setEditingAdminId] = useState(null);

  // 상세정보 모달 관련 상태
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [detailData, setDetailData] = useState({
    adminUserEmail: '',
    adminUserName: '',
    adminUserBirthday: '',
    adminUserGender: '',
    adminUserPhone: '',
    adminTypeIndex: '',
    adminTypeName: '',
    adminRegistrationDate: '',
    adminAddress: '',
    adminDetailAddress: ''
  });
  const [originalDetailData, setOriginalDetailData] = useState({});

  // 관리자 타입 목록 상태
  const [adminTypes, setAdminTypes] = useState([]);
  
  // 주소 검색 관련 상태
  const [addressSearchQuery, setAddressSearchQuery] = useState('');
  const [addressSearchResults, setAddressSearchResults] = useState([]);
  const [showAddressResults, setShowAddressResults] = useState(false);

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

      console.log('API 응답 데이터:', response.data);
      
      const data = response.data.map((item, index) => {
        const rowData = {
          id: index + 1,
          ...item,
        };
        console.log(`Row ${index + 1}:`, rowData);
        return rowData;
      });

      console.log('최종 rows 데이터:', data);
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
        const response = await permissionCheckApi.checkPermission(10); // programIndex: 28 (관리자 리스트)
        if (response.data) {
          setCanInsert(response.data.hasInsertAuthority === 1);
          console.log('관리자 리스트 등록 권한 체크 결과:', response.data.hasInsertAuthority);
        }
      } catch (error) {
        console.error('권한 체크 실패:', error);
        setCanInsert(false);
      }
    };
    
    checkPermission();
  }, []);

  useEffect(() => {
    // 인터셉터 설정 (인증 토큰 자동 추가)
    setupInterceptors();
    
    // 데이터 로딩
    fetchAdmins({}); // 최초 진입 시에만 로딩중 표시
    fetchAdminTypes(); // 관리자 타입 목록 로딩
  }, []);

  // 조회 버튼 클릭 시 → 현재 검색 조건으로 조회
  const handleSearch = () => {
    fetchAdmins({ ...filter }); // 검색 시에는 로딩중 표시 안 함
  };

  // 등록 모달 열기
  const handleCreateAdmin = () => {
    if (!canInsert) {
      showToast("error", "등록 권한이 없습니다.");
      return;
    }
    setCreateForm({
      adminUserEmail: '',
      adminUserName: '',
      adminUserBirthday: '',
      adminUserGender: '',
      adminUserPhone: '',
      adminPassword: '',
      adminPasswordConfirm: '',
      adminTypeIndex: '',
      adminRegistrationDate: '',
      adminAddress: '',
      adminDetailAddress: ''
    });
    setShowCreateModal(true);
  };

  // 등록 폼 변경 핸들러
  const handleCreateFormChange = (field, value) => {
    setCreateForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 상세정보 모달 열기 (행 클릭 시)
  const handleRowClick = async (params) => {
    const admin = params.row;
    // adminUserIndex를 우선으로 사용하되, 문자열로 변환
    const adminId = String(admin.adminUserIndex || admin.adminIndex || admin.id);
    
    try {
      setLoading(true);
      // 상세정보 API 호출
      const response = await getAdminDetail(adminId);
      const detailInfo = response.data;
      
      // 생년월일 포맷 변환 (LocalDate -> YYYY-MM-DD 문자열)
      const formatBirthday = (birthday) => {
        if (!birthday) return '';
        
        // LocalDate 배열 형태인 경우 [year, month, day]
        if (Array.isArray(birthday)) {
          const [year, month, day] = birthday;
          return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
        
        // 이미 문자열 형태인 경우
        if (typeof birthday === 'string') {
          return birthday;
        }
        
        // Date 객체인 경우
        if (birthday instanceof Date) {
          return birthday.toISOString().split('T')[0];
        }
        
        return birthday.toString();
      };

      const data = {
        adminUserIndex: detailInfo.adminUserIndex || admin.adminUserIndex || adminId, // adminUserIndex 추가
        adminUserEmail: detailInfo.adminUserEmail || admin.adminUserEmail || '',
        adminUserName: detailInfo.adminUserName || admin.adminUserName || '',
        adminUserBirthday: formatBirthday(detailInfo.adminUserBirthday),
        adminUserGender: detailInfo.adminUserGender || '',
        adminUserPhone: detailInfo.adminUserPhone || admin.adminUserPhone || '',
        adminTypeIndex: admin.adminTypeIndex || '',
        adminTypeName: admin.adminTypeName || '',
        adminRegistrationDate: admin.adminRegistrationDate || '',
        adminAddress: detailInfo.adminAddress || '',
        adminDetailAddress: detailInfo.adminDetailAddress || ''
      };
      
      setDetailData(data);
      setOriginalDetailData(data);
      setEditingAdminId(adminId);
      setIsEditMode(false);
      setShowDetailModal(true);
    } catch (error) {
      console.error('관리자 상세정보 조회 실패:', error);
      // API 실패 시 기본 데이터로 설정
      const data = {
        adminUserIndex: admin.adminUserIndex || adminId,
        adminUserEmail: admin.adminUserEmail || '',
        adminUserName: admin.adminUserName || '',
        adminUserBirthday: '',
        adminUserGender: '',
        adminUserPhone: admin.adminUserPhone || '',
        adminTypeIndex: admin.adminTypeIndex || '',
        adminTypeName: admin.adminTypeName || '',
        adminRegistrationDate: admin.adminRegistrationDate || '',
        adminAddress: '',
        adminDetailAddress: ''
      };
      
      setDetailData(data);
      setOriginalDetailData(data);
      setEditingAdminId(adminId);
      setIsEditMode(false);
      setShowDetailModal(true);
    } finally {
      setLoading(false);
    }
  };

  // 편집 모드로 전환
  const handleEditFromDetail = () => {
    setIsEditMode(true);
  };

  // 편집 취소
  const handleCancelEdit = () => {
    setDetailData(originalDetailData);
    setIsEditMode(false);
  };

  // 상세정보 모달에서 데이터 변경
  const handleDetailDataChange = (field, value) => {
    setDetailData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 관리자 타입 목록 가져오기
  const fetchAdminTypes = async () => {
    try {
      const response = await permissionApi.getAdminType();
      setAdminTypes(response.data);
    } catch (error) {
      console.error('관리자 타입 목록 조회 실패:', error);
    }
  };

  // 등록 폼 유효성 검사
  const isCreateFormValid = () => {
    return (
      createForm.adminUserEmail?.trim() !== '' &&
      createForm.adminUserName?.trim() !== '' &&
      createForm.adminUserBirthday?.trim() !== '' &&
      createForm.adminUserGender?.trim() !== '' &&
      createForm.adminUserPhone?.trim() !== '' &&
      createForm.adminPassword?.trim() !== '' &&
      createForm.adminPasswordConfirm?.trim() !== '' &&
      createForm.adminPassword === createForm.adminPasswordConfirm &&
      createForm.adminTypeIndex?.trim() !== ''
    );
  };

  // 카카오 주소 검색 팝업 열기 (등록 모달용)
  const handleAddressSearch = () => {
    new window.daum.Postcode({
      oncomplete: function(data) {
        console.log('카카오 주소 검색 결과:', data);
        
        // 주소 정보를 해당 필드에 넣는다.
        let addr = ''; // 주소 변수
        
        // 사용자가 선택한 주소 타입에 따라 해당 주소 값을 가져온다.
        if (data.userSelectedType === 'R') { // 사용자가 도로명 주소를 선택했을 경우
          addr = data.roadAddress;
        } else { // 사용자가 지번 주소를 선택했을 경우(J)
          addr = data.jibunAddress;
        }
        
        // 주소 정보를 폼에 설정
        setCreateForm(prev => ({
          ...prev,
          adminAddress: addr
        }));
        
        // 검색 결과 초기화
        setShowAddressResults(false);
        setAddressSearchQuery('');
      }
    }).open();
  };

  // 카카오 주소 검색 팝업 열기 (상세정보 모달용)
  const handleDetailAddressSearch = () => {
    new window.daum.Postcode({
      oncomplete: function(data) {
        console.log('카카오 주소 검색 결과:', data);
        
        // 주소 정보를 해당 필드에 넣는다.
        let addr = ''; // 주소 변수
        
        // 사용자가 선택한 주소 타입에 따라 해당 주소 값을 가져온다.
        if (data.userSelectedType === 'R') { // 사용자가 도로명 주소를 선택했을 경우
          addr = data.roadAddress;
        } else { // 사용자가 지번 주소를 선택했을 경우(J)
          addr = data.jibunAddress;
        }
        
        // 주소 정보를 상세정보 데이터에 설정
        handleDetailDataChange('adminAddress', addr);
      }
    }).open();
  };
  
  // 주소 선택 함수
  const handleAddressSelect = (address) => {
    console.log('선택된 주소:', address);
    setCreateForm(prev => ({
      ...prev,
      adminAddress: address.address_name || address.road_address?.address_name || ''
    }));
    setShowAddressResults(false);
    setAddressSearchQuery('');
  };
  
  // 관리자 등록 저장
  const handleCreateAdminSave = async () => {
    try {
      setLoading(true);
      
      // API 호출
      await createAdmin(createForm);
      
      alert('관리자가 성공적으로 등록되었습니다.');
      setShowCreateModal(false);
      fetchAdmins(); // 목록 새로고침
    } catch (err) {
      console.error('관리자 등록 실패:', err);
      alert('관리자 등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 상세정보 모달에서 수정 저장
  const handleSaveDetailEdit = async () => {
    try {
      setLoading(true);
      
      // 수정 가능한 필드만 추출 (아이디, 관리자 타입, 담당자 등록일 제외)
      const updateData = {
        adminUserName: detailData.adminUserName,
        adminUserBirthday: detailData.adminUserBirthday,
        adminUserGender: detailData.adminUserGender,
        adminUserPhone: detailData.adminUserPhone,
        adminAddress: detailData.adminAddress,
        adminDetailAddress: detailData.adminDetailAddress
      };
      
      // API 호출
      await updateAdmin(editingAdminId, updateData);
      
      alert('관리자 정보가 성공적으로 수정되었습니다.');
      setOriginalDetailData(detailData); // 수정된 데이터를 원본으로 저장
      setIsEditMode(false);
      fetchAdmins(); // 목록 새로고침
    } catch (err) {
      console.error('관리자 수정 실패:', err);
      alert('관리자 수정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
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

  // DataGrid columns 정의
  const columns = [
    { field: 'adminUserEmail', headerName: '관리자 ID', width: 120 },
    { field: 'adminUserName', headerName: '관리자 이름', width: 120 },
    { field: 'adminUserPhone', headerName: '핸드폰 번호', width: 140 },
    { field: 'adminTypeName', headerName: '관리자 타입', width: 120 },
    { 
      field: 'adminRegistrationDate', 
      headerName: '등록시간', 
      width: 150,
      renderCell: (params) => {
        const value = params.row.adminRegistrationDate;
        
        if (!value) return '';
        
        try {
          // 배열 형태인 경우 (LocalDateTime이 배열로 전송됨)
          if (Array.isArray(value)) {
            const [year, month, day, hour, minute, second = 0] = value;
            
            // ISO 문자열로 변환
            const isoString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
            const date = new Date(isoString);
            
            if (!isNaN(date.getTime())) {
              return date.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
              });
            }
          }
          
          // 문자열 형태인 경우
          if (typeof value === 'string') {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
              return date.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
              });
            }
          }
          
          // 기타 경우
          return String(value);
          
        } catch (e) {
          console.error('날짜 파싱 오류:', e);
          return String(value);
        }
      }
    },
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box className="deokkyu-container">
        <div className="deokkyu-page-title">관리자 리스트</div>
        <div className="deokkyu-actions">
          <button 
            className="taekjun-btn admin create"
            onClick={handleCreateAdmin}
            disabled={loading || !canInsert}
            style={!canInsert ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
            등록
          </button>
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
                <select
                  className="store-filter-input"
                  value={filter.adminTypeName}
                  onChange={(e) => setFilter({ ...filter, adminTypeName: e.target.value })}
                >
                  <option value="">전체</option>
                  {adminTypes.map((adminType) => (
                    <option key={adminType.adminTypeIndex} value={adminType.adminTypeName}>
                      {adminType.adminTypeName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 두 번째 행: 관리자 등급, 등록일 시작, 등록일 종료 */}
            <div className="store-filter-row">
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
            onRowClick={handleRowClick}
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

      {/* 등록 모달 */}
      {showCreateModal && (
        <div className="admin-create-modal-overlay">
          <div className="admin-create-modal-content">
            <div className="admin-create-modal-header">
              <h3>관리자 등록</h3>
              <button 
                className="admin-create-modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>
            <div className="admin-create-modal-body">
              {/* 기본 정보 섹션 */}
              <div className="admin-create-section">
                <h4 className="admin-create-section-title">기본 정보</h4>
                <div className="admin-create-form-grid">
                  <div className="admin-create-form-field">
                    <label>아이디</label>
                    <input
                      type="email"
                      value={createForm.adminUserEmail}
                      onChange={(e) => handleCreateFormChange('adminUserEmail', e.target.value)}
                      placeholder="아이디를 입력하세요"
                      autocomplete="off"
                      autoComplete="off"
                    />
                  </div>
                  <div className="admin-create-form-field">
                    <label>이름</label>
                    <input
                      type="text"
                      value={createForm.adminUserName}
                      onChange={(e) => handleCreateFormChange('adminUserName', e.target.value)}
                      placeholder="이름을 입력하세요"
                      autocomplete="off"
                      autoComplete="off"
                    />
                  </div>
                  <div className="admin-create-form-field">
                    <label>생년월일</label>
                    <input
                      type="date"
                      value={createForm.adminUserBirthday}
                      onChange={(e) => handleCreateFormChange('adminUserBirthday', e.target.value)}
                      autocomplete="off"
                      autoComplete="off"
                    />
                  </div>
                  <div className="admin-create-form-field">
                    <label>성별</label>
                    <select
                      value={createForm.adminUserGender}
                      onChange={(e) => handleCreateFormChange('adminUserGender', e.target.value)}
                      autocomplete="off"
                      autoComplete="off"
                    >
                      <option value="">성별을 선택하세요</option>
                      <option value="남자">남자</option>
                      <option value="여자">여자</option>
                    </select>
                  </div>
                  <div className="admin-create-form-field">
                    <label>휴대폰 번호</label>
                    <input
                      type="tel"
                      value={createForm.adminUserPhone}
                      onChange={(e) => handleCreateFormChange('adminUserPhone', e.target.value)}
                      placeholder="휴대폰 번호를 입력하세요(-제외)"
                      autocomplete="off"
                      autoComplete="off"
                    />
                  </div>
                  <div className="admin-create-form-field">
                    <label className="required">비밀번호</label>
                    <input
                      type="password"
                      value={createForm.adminPassword}
                      onChange={(e) => handleCreateFormChange('adminPassword', e.target.value)}
                      placeholder="비밀번호를 입력하세요"
                      autocomplete="off"
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="admin-create-form-field">
                    <label className="required">비밀번호 확인</label>
                    <input
                      type="password"
                      value={createForm.adminPasswordConfirm}
                      onChange={(e) => handleCreateFormChange('adminPasswordConfirm', e.target.value)}
                      placeholder="비밀번호를 다시 입력하세요"
                      autocomplete="off"
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              </div>

              {/* 관리자 정보 섹션 */}
              <div className="admin-create-section">
                <h4 className="admin-create-section-title">관리자 정보</h4>
                <div className="admin-create-form-grid">
                  <div className="admin-create-form-field">
                    <label>관리자 타입</label>
                    <select
                      value={createForm.adminTypeIndex}
                      onChange={(e) => handleCreateFormChange('adminTypeIndex', e.target.value)}
                      autocomplete="off"
                      autoComplete="off"
                    >
                      <option value="">관리자 타입을 선택하세요</option>
                      {adminTypes.map((adminType) => (
                        <option key={adminType.adminTypeIndex} value={adminType.adminTypeIndex}>
                          {adminType.adminTypeName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="admin-create-form-field">
                    <label>담당자 등록일</label>
                    <input
                      type="date"
                      value={createForm.adminRegistrationDate}
                      onChange={(e) => handleCreateFormChange('adminRegistrationDate', e.target.value)}
                      autocomplete="off"
                      autoComplete="off"
                    />
                  </div>
                  <div className="admin-create-form-field">
                    <label>주소</label>
                    <div className="admin-create-address-field">
                      <input
                        type="text"
                        value={createForm.adminAddress}
                        placeholder="주소를 검색하세요"
                        readOnly
                        autocomplete="off"
                        autoComplete="off"
                      />
                      <button 
                        type="button" 
                        className="admin-create-address-search-btn"
                        onClick={handleAddressSearch}
                      >
                        검색
                      </button>
                    </div>
                    {createForm.adminAddress && (
                      <div className="admin-create-selected-address">
                        선택된 주소: {createForm.adminAddress}
                      </div>
                    )}
                  </div>
                  <div className="admin-create-form-field">
                    <label>상세주소</label>
                    <input
                      type="text"
                      value={createForm.adminDetailAddress}
                      onChange={(e) => handleCreateFormChange('adminDetailAddress', e.target.value)}
                      placeholder="상세주소를 입력하세요"
                      autocomplete="off"
                      autoComplete="off"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="admin-create-modal-actions">
              <button 
                className="admin-create-modal-btn primary"
                onClick={handleCreateAdminSave}
                disabled={loading || !isCreateFormValid()}
              >
                {loading ? '등록 중...' : '등록'}
              </button>
              <button 
                className="admin-create-modal-btn secondary"
                onClick={() => setShowCreateModal(false)}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 상세정보 모달 */}
      {showDetailModal && (
        <div className="admin-create-modal-overlay">
          <div className="admin-create-modal-content">
            <div className="admin-create-modal-header">
              <h3>관리자 상세정보</h3>
              <button 
                className="admin-create-modal-close"
                onClick={() => setShowDetailModal(false)}
              >
                ×
              </button>
            </div>
            <div className="admin-create-modal-body">
              {/* 기본 정보 섹션 */}
              <div className="admin-create-section">
                <h4 className="admin-create-section-title">기본 정보</h4>
                <div className="admin-create-form-grid">
                  <div className="admin-create-form-field">
                    <label>아이디</label>
                    <input
                      type="email"
                      value={detailData.adminUserEmail}
                      readOnly
                      className="readonly-input"
                    />
                  </div>
                  <div className="admin-create-form-field">
                    <label>이름</label>
                    <input
                      type="text"
                      value={detailData.adminUserName}
                      onChange={(e) => isEditMode && handleDetailDataChange('adminUserName', e.target.value)}
                      readOnly={!isEditMode}
                      className={isEditMode ? "" : "readonly-input"}
                      autoComplete="off"
                    />
                  </div>
                  <div className="admin-create-form-field">
                    <label>생년월일</label>
                    <input
                      type="date"
                      value={detailData.adminUserBirthday}
                      onChange={(e) => isEditMode && handleDetailDataChange('adminUserBirthday', e.target.value)}
                      readOnly={!isEditMode}
                      className={isEditMode ? "" : "readonly-input"}
                      autoComplete="off"
                    />
                  </div>
                  <div className="admin-create-form-field">
                    <label>성별</label>
                    {isEditMode ? (
                      <select
                        value={detailData.adminUserGender}
                        onChange={(e) => handleDetailDataChange('adminUserGender', e.target.value)}
                        autoComplete="off"
                      >
                        <option value="">성별을 선택하세요</option>
                        <option value="남자">남자</option>
                        <option value="여자">여자</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={detailData.adminUserGender}
                        readOnly
                        className="readonly-input"
                      />
                    )}
                  </div>
                  <div className="admin-create-form-field">
                    <label>휴대폰 번호</label>
                    <input
                      type="tel"
                      value={detailData.adminUserPhone}
                      onChange={(e) => isEditMode && handleDetailDataChange('adminUserPhone', e.target.value)}
                      readOnly={!isEditMode}
                      className={isEditMode ? "" : "readonly-input"}
                      placeholder={isEditMode ? "휴대폰 번호를 입력하세요(-제외)" : ""}
                      autoComplete="off"
                    />
                  </div>
                </div>
              </div>

              {/* 관리자 정보 섹션 */}
              <div className="admin-create-section">
                <h4 className="admin-create-section-title">관리자 정보</h4>
                <div className="admin-create-form-grid">
                  <div className="admin-create-form-field">
                    <label>관리자 타입</label>
                    <input
                      type="text"
                      value={detailData.adminTypeName}
                      readOnly
                      className="readonly-input"
                    />
                  </div>
                  <div className="admin-create-form-field">
                    <label>담당자 등록일</label>
                    <input
                      type="text"
                      value={detailData.adminRegistrationDate ? 
                        (Array.isArray(detailData.adminRegistrationDate) 
                          ? `${detailData.adminRegistrationDate[0]}-${String(detailData.adminRegistrationDate[1]).padStart(2, '0')}-${String(detailData.adminRegistrationDate[2]).padStart(2, '0')}`
                          : detailData.adminRegistrationDate
                        ) : ''
                      }
                      readOnly
                      className="readonly-input"
                    />
                  </div>
                  <div className="admin-create-form-field">
                    <label>주소</label>
                    {isEditMode ? (
                      <div className="admin-create-address-field">
                        <input
                          type="text"
                          value={detailData.adminAddress}
                          placeholder="주소를 검색하세요"
                          readOnly
                          autoComplete="off"
                        />
                        <button 
                          type="button" 
                          className="admin-create-address-search-btn"
                          onClick={handleDetailAddressSearch}
                        >
                          검색
                        </button>
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={detailData.adminAddress}
                        readOnly
                        className="readonly-input"
                      />
                    )}
                    {isEditMode && detailData.adminAddress && (
                      <div className="admin-create-selected-address">
                        선택된 주소: {detailData.adminAddress}
                      </div>
                    )}
                  </div>
                  <div className="admin-create-form-field">
                    <label>상세주소</label>
                    <input
                      type="text"
                      value={detailData.adminDetailAddress}
                      onChange={(e) => isEditMode && handleDetailDataChange('adminDetailAddress', e.target.value)}
                      readOnly={!isEditMode}
                      className={isEditMode ? "" : "readonly-input"}
                      placeholder={isEditMode ? "상세주소를 입력하세요" : ""}
                      autoComplete="off"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="admin-create-modal-actions">
              {isEditMode ? (
                <>
                  <button 
                    className="admin-create-modal-btn primary"
                    onClick={handleSaveDetailEdit}
                    disabled={loading}
                  >
                    {loading ? '저장 중...' : '저장'}
                  </button>
                  <button 
                    className="admin-create-modal-btn secondary"
                    onClick={handleCancelEdit}
                    disabled={loading}
                  >
                    취소
                  </button>
                </>
              ) : (
                <>
                  <button 
                    className="admin-create-modal-btn primary"
                    onClick={handleEditFromDetail}
                  >
                    수정
                  </button>
                  <button 
                    className="admin-create-modal-btn secondary"
                    onClick={() => {
                      setShowDetailModal(false);
                      setIsEditMode(false);
                    }}
                  >
                    닫기
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}


      
    </LocalizationProvider>
  );
}

export default AdminList;
