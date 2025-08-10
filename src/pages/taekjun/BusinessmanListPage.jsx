import React, { useState, useEffect, useCallback } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { businessmanListApi } from '../../api/auth/TaekjunAuth';
import usePermissionStore from '../../store/taekjun/PermissionStore';
import PermissionGuard from '../../components/common/PermissionGuard';
import { getProgramIndexByPath, PROGRAM_INDEXES } from '../../constants/programIndexes';
import '../../styles/taekjun/BusinessmanListPage.css';

// DataGrid 컬럼 정의
const columns = [
  { field: 'userName', headerName: '이름', width: 120, sortable: true, headerAlign: 'center', align: 'center' },
  { field: 'email', headerName: '이메일', width: 200, sortable: true, headerAlign: 'center', align: 'center' },
  { field: 'userPhone', headerName: '휴대폰 번호', width: 140, sortable: true, headerAlign: 'center', align: 'center' },
  { field: 'businessGradeName', headerName: '사업자 등급', width: 120, sortable: true, headerAlign: 'center', align: 'center' },
  { field: 'userBankName', headerName: '은행명', width: 120, sortable: true, headerAlign: 'center', align: 'center' },
  { field: 'userBankNumber', headerName: '계좌번호', width: 150, sortable: true, headerAlign: 'center', align: 'center' },
  { field: 'userBankHolder', headerName: '예금주', width: 100, sortable: true, headerAlign: 'center', align: 'center' },
  { field: 'businessAreaName', headerName: '사업 지역', width: 120, sortable: true, headerAlign: 'center', align: 'center' },
  { field: 'bossName', headerName: '상사 이름', width: 120, sortable: true, headerAlign: 'center', align: 'center' },
  { field: 'bossEmail', headerName: '상사 이메일', width: 200, sortable: true, headerAlign: 'center', align: 'center' },
];

// 카카오 주소 API 스크립트 로드
const loadKakaoAddressScript = () => {
  return new Promise((resolve, reject) => {
    if (window.daum && window.daum.Postcode) {
      resolve(window.daum.Postcode);
      return;
    }

    const script = document.createElement('script');
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    script.onload = () => resolve(window.daum.Postcode);
    script.onerror = reject;
    document.head.appendChild(script);
  });
};



const BusinessmanListPage = () => {
  const location = useLocation();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRows, setSelectedRows] = useState(new Set());
  // 사업자 등급/지역 상태 추가
  const [businessGrades, setBusinessGrades] = useState([]);
  const [businessAreas, setBusinessAreas] = useState([]);
  const [banks, setBanks] = useState([]);
  // 검색 필터 name 기반으로 (서버에서 매핑 처리)
  const [searchFilters, setSearchFilters] = useState({
    email: '',
    userName: '',
    userPhone: '',
    businessGradeName: '',
    bossEmail: '',
    businessAreaName: ''
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBusinessman, setEditingBusinessman] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [createForm, setCreateForm] = useState({});
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBossSelectModal, setShowBossSelectModal] = useState(false);
  const [bossSearchTerm, setBossSearchTerm] = useState('');
  const [filteredBossList, setFilteredBossList] = useState([]);
  const [isSearchConditionsExpanded, setIsSearchConditionsExpanded] = useState(true);

  // 권한 체크 훅 사용
  const { checkPermission, hasPermission } = usePermissionStore();

  // 현재 페이지의 programIndex 결정
  const programIndex = getProgramIndexByPath(location.pathname) || PROGRAM_INDEXES.BUSINESS_MEMBER_LIST;

  // 컴포넌트 마운트 시 권한 체크
  useEffect(() => {
    const checkBusinessmanPermissions = async () => {
      try {
        // 사업자 관리 관련 권한들 체크
        await checkPermission(programIndex);
      } catch (error) {
        console.error('권한 체크 실패:', error);
      }
    };
    
    checkBusinessmanPermissions();
  }, [programIndex]);

  // 사업자 등급 데이터 로드
  const fetchBusinessGrades = useCallback(async () => {
    try {
      const response = await businessmanListApi.getBusinessGrades();
      setBusinessGrades(response.data || []);
    } catch (err) {
      console.error('사업자 등급 조회 실패:', err);
    }
  }, []);

  // 사업자 지역 데이터 로드
  const fetchBusinessAreas = useCallback(async () => {
    try {
      const response = await businessmanListApi.getBusinessAreas();
      setBusinessAreas(response.data || []);
    } catch (err) {
      console.error('사업자 지역 조회 실패:', err);
    }
  }, []);

  // 은행 데이터 로드
  const fetchBanks = useCallback(async () => {
    try {
      console.log('은행 목록 조회 시작...');
      const response = await businessmanListApi.getBanks();
      console.log('은행 목록 API 응답:', response);
      console.log('은행 목록 데이터:', response.data);
      setBanks(response.data || []);
      console.log('은행 목록 상태 업데이트 완료:', response.data || []);
    } catch (err) {
      console.error('은행 목록 조회 실패:', err);
      console.error('은행 목록 에러 상세:', err.response || err.message);
    }
  }, []);

  // 데이터 조회
  const fetchBusinessmanList = useCallback(async (filters = searchFilters) => {
    try {
      setLoading(true);
      setError(null);
      console.log('사업자 목록 API 호출 시작...');
      
      // 필터가 있으면 검색 API, 없으면 전체 조회 API 사용
      let response;
      console.log('검색 필터 상세:', filters);
      console.log('검색 필터 값들:', Object.values(filters));
      console.log('빈 값이 아닌 필터들:', Object.values(filters).filter(value => value !== ''));
      
      if (filters && Object.values(filters).some(value => value !== '')) {
        console.log('검색 API 호출');
        response = await businessmanListApi.searchBusinessmanList(filters);
      } else {
        console.log('전체 사업자 조회 (모든 조건 제거)');
        response = await businessmanListApi.getAllBusinessmen();
      }
      
      console.log('사업자 목록 API 응답:', response);
      console.log('응답 데이터:', response.data);
      console.log('응답 데이터 타입:', typeof response.data);
      console.log('응답 데이터 길이:', response.data?.length);
      
      // 응답 데이터가 바로 배열로 오는 경우
      if (Array.isArray(response.data)) {
        const mappedData = response.data.map((businessman, index) => ({
          id: index + 1,
          ...businessman,
          businessGradeName: businessman.businessGradeName || '-',
          businessAreaName: businessman.businessAreaName || '-'
        }));
        
        console.log('매핑된 데이터:', mappedData);
        console.log('매핑된 데이터 길이:', mappedData.length);
        setRows(mappedData);
      } else {
        console.error('응답 데이터가 배열이 아닙니다:', response.data);
        setRows([]);
      }
    } catch (err) {
      console.error('사업자 목록 조회 실패:', err);
      console.error('에러 상세:', err.response || err.message);
      setError(`사업자 목록을 불러오는데 실패했습니다. (${err.message})`);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [searchFilters]);

  // 최초 렌더링 시 등급/지역 불러오기
  useEffect(() => {
    fetchBusinessGrades();
    fetchBusinessAreas();
    fetchBanks(); // 은행 데이터도 최초 로딩
  }, [fetchBusinessGrades, fetchBusinessAreas, fetchBanks]);

  // 등급과 지역 데이터가 로드된 후 사업자 목록 조회 (조회 버튼을 눌렀을 때만 검색)
  useEffect(() => {
    // 컴포넌트 마운트 시 사업자 목록 조회
    fetchBusinessmanList();
  }, []); // 빈 의존성 배열로 초기 로딩만 실행

  // 검색 필터 변경 시 자동 검색 (선택사항)
  // useEffect(() => {
  //   if (Object.values(searchFilters).some(value => value !== '')) {
  //     handleSearch();
  //   }
  // }, [searchFilters]);

  // 검색 필터 변경 핸들러
  const handleFilterChange = (field, value) => {
    setSearchFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };



  // 엔터키 핸들러
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 검색 실행
  const handleSearch = async () => {
    // 권한 체크 제거 (이미 useEffect에서 체크됨)
    try {
      setLoading(true);
      setError(null);
      console.log('사업자 검색 시작...');
      
      // 검색 필터가 있으면 필터링된 데이터 조회
      let response;
      if (searchFilters && Object.values(searchFilters).some(value => value !== '')) {
        console.log('검색 필터:', searchFilters);
        response = await businessmanListApi.searchBusinessmanList(searchFilters);
      } else {
        response = await businessmanListApi.getAllActiveBusinessmen();
      }
      
      console.log('API 응답:', response);
      
      const data = response.data.map((item, index) => ({
        id: index + 1,
        ...item,
      }));
      
      setRows(data);
    } catch (err) {
      console.error('사업자 목록 조회 실패:', err);
      setError(`사업자 목록을 불러오는데 실패했습니다. (${err.message})`);
    } finally {
      setLoading(false);
    }
  };

  // 엑셀 다운로드
  const handleExcelDownload = async () => {
    // 권한 체크 제거 (이미 useEffect에서 체크됨)
    try {
      setLoading(true);
      console.log('사업자 목록 엑셀 다운로드 시작...');
      
      const response = await businessmanListApi.downloadBusinessmanList(searchFilters);
      
      const blob = new Blob([response.data], { 
        type: 'text/csv; charset=utf-8' 
      });
      
      const now = new Date();
      const dateStr = now.getFullYear() + 
        String(now.getMonth() + 1).padStart(2, '0') + 
        String(now.getDate()).padStart(2, '0');
      const fileName = `사업자목록_${dateStr}.csv`;
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('사업자 목록 엑셀 다운로드 완료');
      alert('CSV 파일이 성공적으로 다운로드되었습니다.');
    } catch (err) {
      console.error('사업자 목록 엑셀 다운로드 실패:', err);
      alert('CSV 다운로드에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 사업자 생성
  const handleCreateBusinessman = () => {
    // 권한 체크 제거 (이미 useEffect에서 체크됨)
    setCreateForm({
      email: '',
      password: '',
      name: '',
      phone: '',
      businessGrade: '',
      businessArea: '',
      address: '',
      detailAddress: '',
      bankName: '',
      bankNumber: '',
      bankHolder: '',
      bossEmail: '',
      bossName: ''
    });
    setShowCreateModal(true);
  };

  // 사업자 수정
  const handleEditBusinessman = (businessman) => {
    // 권한 체크 제거 (이미 useEffect에서 체크됨)
    console.log('수정할 사업자 데이터:', businessman);
    setEditingBusinessman(businessman);
    setEditForm({
      email: businessman.email || '',
      userName: businessman.userName || '',
      userPhone: businessman.userPhone || '',
      userBirthday: businessman.userBirthday || '',
      userGenderIndex: businessman.userGenderIndex || '',
      userZoneCode: businessman.userZoneCode || '',
      userAddress: businessman.userAddress || '',
      userDetailAddress: businessman.userDetailAddress || '',
      userBankIndex: businessman.userBankIndex || '',
      userBankNumber: businessman.userBankNumber || '',
      userBankHolder: businessman.userBankHolder || '',
      bossEmail: businessman.bossEmail || '',
      businessGradeIndex: businessman.businessGradeIndex || '',
      businessAreaIndex: businessman.businessAreaIndex || ''
    });
    setShowEditModal(true);
  };

  // 사업자 생성 저장 - BusinessmanCreateRequestDTO 구조에 맞게
  const handleCreateBusinessmanSave = async () => {
    try {
      setLoading(true);
      
      // BusinessmanCreateRequestDTO 구조에 맞게 데이터 변환
      const createData = {
        email: createForm.email,
        userName: createForm.userName,
        userPw: createForm.userPw,
        userPhone: createForm.userPhone,
        userBirthday: createForm.userBirthday,
        userGenderIndex: createForm.userGenderIndex ? parseInt(createForm.userGenderIndex) : null,
        userZoneCode: createForm.userZoneCode,
        userAddress: createForm.userAddress,
        userDetailAddress: createForm.userDetailAddress,
        userBankIndex: createForm.userBankIndex ? parseInt(createForm.userBankIndex) : null,
        userBankNumber: createForm.userBankNumber,
        userBankHolder: createForm.userBankHolder,
        bossEmail: createForm.bossEmail,
        businessManRegistrationDate: createForm.businessManRegistrationDate,
        businessGradeIndex: createForm.businessGradeIndex ? parseInt(createForm.businessGradeIndex) : null,
        businessAreaIndex: createForm.businessAreaIndex ? parseInt(createForm.businessAreaIndex) : null
      };
      
      await businessmanListApi.createBusinessman(createData);
      alert('사업자가 성공적으로 등록되었습니다.');
      setShowCreateModal(false);
      fetchBusinessmanList();
    } catch (err) {
      console.error('사업자 생성 실패:', err);
      alert('사업자 등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 사업자 정보 저장 (수정) - BusinessmanUpdateRequestDTO 구조에 맞게
  const handleSaveBusinessman = async () => {
    try {
      setLoading(true);
      
      // BusinessmanUpdateRequestDTO 구조에 맞게 데이터 변환
      const updateData = {
        userIndex: editingBusinessman.userIndex,
        email: editForm.email,
        userName: editForm.userName,
        userPw: editForm.userPw, // 비밀번호 변경 시에만 사용
        userPhone: editForm.userPhone,
        userBirthday: editForm.userBirthday,
        userGenderIndex: editForm.userGenderIndex ? parseInt(editForm.userGenderIndex) : null,
        userZoneCode: editForm.userZoneCode,
        userAddress: editForm.userAddress,
        userDetailAddress: editForm.userDetailAddress,
        userBankIndex: editForm.userBankIndex ? parseInt(editForm.userBankIndex) : null,
        userBankNumber: editForm.userBankNumber,
        userBankHolder: editForm.userBankHolder,
        bossEmail: editForm.bossEmail,
        businessGradeIndex: editForm.businessGradeIndex ? parseInt(editForm.businessGradeIndex) : null,
        businessAreaIndex: editForm.businessAreaIndex ? parseInt(editForm.businessAreaIndex) : null
      };
      
      await businessmanListApi.updateBusinessman(updateData);
      alert('사업자 정보가 성공적으로 수정되었습니다.');
      setShowEditModal(false);
      fetchBusinessmanList();
    } catch (err) {
      console.error('사업자 수정 실패:', err);
      alert('사업자 정보 수정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 사업자 비활성화
  const handleDeleteBusinessman = async () => {
    if (selectedRows.size === 0) {
      alert('비활성화할 사업자를 선택해주세요.');
      return;
    }

    if (!window.confirm('선택한 사업자를 비활성화하시겠습니까?')) {
      return;
    }

    try {
      setLoading(true);
      const selectedUserIndex = rows.find(row => row.id === Array.from(selectedRows)[0])?.userIndex;
      if (selectedUserIndex) {
        await businessmanListApi.deleteBusinessman({
          userIndex: selectedUserIndex
        });
        alert('사업자가 성공적으로 비활성화되었습니다.');
        setSelectedRows(new Set());
        fetchBusinessmanList();
      }
    } catch (err) {
      console.error('사업자 비활성화 실패:', err);
      alert('사업자 비활성화에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };



  // 카카오 주소 검색 함수
  const handleAddressSearch = async (isCreate = false) => {
    try {
      const Postcode = await loadKakaoAddressScript();
      
      new Postcode({
        oncomplete: function(data) {
          // 주소 정보를 해당 필드에 넣는다.
          if (isCreate) {
            setCreateForm(prev => ({
              ...prev,
              userZoneCode: data.zonecode,
              userAddress: data.address,
              userDetailAddress: '' // 상세주소는 초기화
            }));
          } else {
            setEditForm(prev => ({
              ...prev,
              userZoneCode: data.zonecode,
              userAddress: data.address,
              userDetailAddress: '' // 상세주소는 초기화
            }));
          }
        },
        onclose: function() {
          // 팝업이 닫힐 때 실행되는 코드
        }
      }).open();
    } catch (error) {
      console.error('주소 검색 실패:', error);
      alert('주소 검색을 불러오는데 실패했습니다.');
    }
  };

  // 비밀번호 변경 관련 함수들
  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
    // 에러 메시지 초기화
    if (passwordErrors[field]) {
      setPasswordErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validatePassword = () => {
    const errors = {};

    if (!passwordData.newPassword) {
      errors.newPassword = '새 비밀번호를 입력해주세요.';
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = '비밀번호는 6자 이상이어야 합니다.';
    }

    if (!passwordData.confirmPassword) {
      errors.confirmPassword = '비밀번호 확인을 입력해주세요.';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordSubmit = async () => {
    if (!validatePassword()) {
      return;
    }

    try {
      setIsSubmitting(true);
      await businessmanListApi.updateBusinessman({
        userIndex: editingBusinessman.userIndex,
        userPw: passwordData.newPassword
      });
      alert('비밀번호가 성공적으로 변경되었습니다.');
      setShowPasswordModal(false);
      setPasswordData({
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordErrors({});
    } catch (err) {
      console.error('비밀번호 변경 실패:', err);
      alert('비밀번호 변경에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 상사 선택 모달 관련 함수들
  const handleBossSearch = useCallback(() => {
    const filtered = rows.filter(businessman => 
      businessman.email.toLowerCase().includes(bossSearchTerm.toLowerCase()) ||
      businessman.userName.toLowerCase().includes(bossSearchTerm.toLowerCase())
    );
    setFilteredBossList(filtered);
  }, [rows, bossSearchTerm]);

  // 실시간 검색을 위한 useEffect
  useEffect(() => {
    if (bossSearchTerm.trim() === '') {
      setFilteredBossList([]);
    } else {
      handleBossSearch();
    }
  }, [bossSearchTerm, handleBossSearch]);

  // 등록 폼 유효성 검사
  const isCreateFormValid = () => {
    return (
      createForm.email?.trim() !== '' &&
      createForm.userName?.trim() !== '' &&
      createForm.userPw?.trim() !== '' &&
      createForm.userPhone?.trim() !== '' &&
      createForm.businessGradeIndex?.trim() !== '' &&
      createForm.businessAreaIndex?.trim() !== ''
    );
  };

  const handleBossSelect = (bossEmail, bossName) => {
    if (showEditModal) {
      setEditForm(prev => ({
        ...prev,
        bossEmail: bossEmail
      }));
    } else if (showCreateModal) {
      setCreateForm(prev => ({
        ...prev,
        bossEmail: bossEmail
      }));
    }
    setShowBossSelectModal(false);
    setBossSearchTerm('');
    setFilteredBossList([]);
  };



  if (loading && rows.length === 0) {
    return (
      <div className="businessman-list-page">
        <div className="businessman-list-loading-container">
          <div className="businessman-list-loading-spinner"></div>
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="businessman-list-page">
      {/* 페이지 헤더 */}
      <div className="businessman-list-page-header">
        <h1 className="businessman-list-page-title">사업자 리스트</h1>
        <div className="businessman-list-header-actions">
          <PermissionGuard programIndex={programIndex} permissionType="insert">
            <button className="businessman-list-action-btn businessman-list-excel-btn" onClick={handleExcelDownload}>
              엑셀
            </button>
          </PermissionGuard>
          <PermissionGuard programIndex={programIndex} permissionType="insert">
            <button className="businessman-list-action-btn" onClick={handleSearch}>
              조회
            </button>
          </PermissionGuard>
          <PermissionGuard programIndex={programIndex} permissionType="insert">
            <button className="businessman-list-action-btn" onClick={handleCreateBusinessman}>
              생성
            </button>
          </PermissionGuard>
          <PermissionGuard programIndex={programIndex} permissionType="update">
            <button 
              className="businessman-list-action-btn" 
              onClick={() => selectedRows.size > 0 && handleEditBusinessman(rows.find(b => b.id === Array.from(selectedRows)[0]))}
            >
              수정
            </button>
          </PermissionGuard>
          <PermissionGuard programIndex={programIndex} permissionType="delete">
            <button 
              className="businessman-list-action-btn businessman-list-action-btn-danger" 
              onClick={handleDeleteBusinessman}
            >
              비활성화
            </button>
          </PermissionGuard>
        </div>
      </div>

      {/* 검색 조건 */}
      <div className="search-conditions-section">
        <div 
          className="search-conditions-header"
          onClick={() => setIsSearchConditionsExpanded(!isSearchConditionsExpanded)}
        >
          <h3>검색 조건</h3>
          <div className="search-conditions-toggle">
            <span>{isSearchConditionsExpanded ? '▲' : '▼'}</span>
          </div>
        </div>
        
        {isSearchConditionsExpanded && (
          <div className="search-conditions-content">
            <div className="search-conditions-row">
              <div className="search-conditions-item">
                <label>이메일</label>
                <input
                  type="text"
                  placeholder="이메일을 입력하세요"
                  value={searchFilters.email}
                  onChange={(e) => handleFilterChange('email', e.target.value)}
                  onKeyPress={handleKeyPress}
                />
              </div>
              <div className="search-conditions-item">
                <label>이름</label>
                <input
                  type="text"
                  placeholder="이름을 입력하세요"
                  value={searchFilters.userName}
                  onChange={(e) => handleFilterChange('userName', e.target.value)}
                  onKeyPress={handleKeyPress}
                />
              </div>
              <div className="search-conditions-item">
                <label>휴대폰 번호</label>
                <input
                  type="text"
                  placeholder="휴대폰 번호를 입력하세요"
                  value={searchFilters.userPhone}
                  onChange={(e) => handleFilterChange('userPhone', e.target.value)}
                  onKeyPress={handleKeyPress}
                />
              </div>
            </div>
            
            <div className="search-conditions-row">
              <div className="search-conditions-item">
                <label>사업자 등급</label>
                <select
                  value={searchFilters.businessGradeName}
                  onChange={e => setSearchFilters({ ...searchFilters, businessGradeName: e.target.value })}
                >
                  <option value="">사업자 등급 선택</option>
                  {businessGrades.map(grade => (
                    <option key={grade.businessGradeIndex} value={grade.businessGradeName}>
                      {grade.businessGradeName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="search-conditions-item">
                <label>상사 이메일</label>
                <input
                  type="text"
                  placeholder="상사 이메일을 입력하세요"
                  value={searchFilters.bossEmail}
                  onChange={(e) => handleFilterChange('bossEmail', e.target.value)}
                  onKeyPress={handleKeyPress}
                />
              </div>
              <div className="search-conditions-item">
                <label>사업 지역</label>
                <select
                  value={searchFilters.businessAreaName}
                  onChange={e => setSearchFilters({ ...searchFilters, businessAreaName: e.target.value })}
                >
                  <option value="">사업 지역 선택</option>
                  {businessAreas.map(area => (
                    <option key={area.businessAreaIndex} value={area.businessAreaName}>
                      {area.businessAreaName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 사업자 목록 DataGrid */}
      <div className="businessman-list-data-grid">
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
        />
      </div>

      {/* 사업자 수정 모달 */}
      {showEditModal && (
        <div className="businessman-list-modal-overlay">
          <div className="businessman-list-modal">
            <div className="businessman-list-modal-header">
              <h3>사업자 정보 수정</h3>
              <button 
                className="businessman-list-modal-close"
                onClick={() => setShowEditModal(false)}
              >
                ×
              </button>
            </div>
            <div className="businessman-list-modal-content">
              {/* 기본 정보 섹션 */}
              <div className="businessman-list-form-section">
                <h4 className="businessman-list-section-title">기본 정보</h4>
                <div className="businessman-list-form-grid">
                  <div className="businessman-list-form-item">
                    <label>이메일</label>
                    <input
                      type="text"
                      value={editForm.email}
                      onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="이메일을 입력하세요"
                    />
                  </div>
                  <div className="businessman-list-form-item">
                    <label>이름</label>
                    <input
                      type="text"
                      placeholder="이름을 입력하세요."
                      value={editForm.userName}
                      onChange={(e) => setEditForm(prev => ({ ...prev, userName: e.target.value }))}
                    />
                  </div>
                  <div className="businessman-list-form-item">
                    <label>휴대폰 번호</label>
                    <input
                      type="text"
                      placeholder="휴대폰 번호를 입력하세요."
                      value={editForm.userPhone}
                      onChange={(e) => setEditForm(prev => ({ ...prev, userPhone: e.target.value }))}
                    />
                  </div>
                  <div className="businessman-list-form-item">
                    <label>생년월일</label>
                    <input
                      type="date"
                      placeholder="연도-월-일"
                      value={editForm.userBirthday}
                      onChange={(e) => setEditForm(prev => ({ ...prev, userBirthday: e.target.value }))}
                    />
                  </div>
                  <div className="businessman-list-form-item">
                    <label>성별</label>
                    <select
                      value={editForm.userGenderIndex}
                      onChange={(e) => setEditForm(prev => ({ ...prev, userGenderIndex: e.target.value }))}
                    >
                      <option value="">성별을 선택하세요.</option>
                      <option value="1">남자</option>
                      <option value="2">여자</option>
                    </select>
                  </div>
                  <div className="businessman-list-form-item">
                    <label>비밀번호 변경</label>
                    <button 
                      type="button" 
                      className="businessman-list-btn businessman-list-btn-secondary"
                      onClick={() => setShowPasswordModal(true)}
                    >
                      비밀번호 변경
                    </button>
                  </div>
                </div>
              </div>

              {/* 주소 섹션 */}
              <div className="businessman-list-form-section">
                <h4 className="businessman-list-section-title">주소</h4>
                <div className="businessman-list-form-grid">
                  <div className="businessman-list-form-item businessman-list-address-search">
                    <label>주소</label>
                    <div className="businessman-list-address-input-group">
                      <input
                        type="text"
                        value={editForm.userAddress}
                        disabled
                        className="businessman-list-readonly-input"
                      />
                      <button type="button" className="businessman-list-btn businessman-list-btn-secondary" onClick={() => handleAddressSearch(false)}>
                        검색
                      </button>
                    </div>
                  </div>
                  <div className="businessman-list-form-item businessman-list-full-width">
                    <label>상세주소</label>
                    <input
                      type="text"
                      placeholder="상세주소를 입력하세요"
                      value={editForm.userDetailAddress}
                      onChange={(e) => setEditForm(prev => ({ ...prev, userDetailAddress: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* 출금계좌 섹션 */}
              <div className="businessman-list-form-section">
                <h4 className="businessman-list-section-title">출금계좌</h4>
                <div className="businessman-list-form-grid">
                  <div className="businessman-list-form-item">
                    <label>은행명</label>
                    <select
                      value={editForm.userBankIndex}
                      onChange={(e) => setEditForm(prev => ({ ...prev, userBankIndex: e.target.value }))}
                    >
                      <option value="">은행명을 선택하세요.</option>
                      {banks.map(bank => (
                        <option key={bank.userBankIndex} value={bank.userBankIndex}>
                          {bank.userBankName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="businessman-list-form-item">
                    <label>계좌번호</label>
                    <input
                      type="text"
                      placeholder="계좌번호를 입력하세요(-제외)"
                      value={editForm.userBankNumber}
                      onChange={(e) => setEditForm(prev => ({ ...prev, userBankNumber: e.target.value }))}
                    />
                  </div>
                  <div className="businessman-list-form-item">
                    <label>예금주</label>
                    <input
                      type="text"
                      placeholder="예금주"
                      value={editForm.userBankHolder}
                      onChange={(e) => setEditForm(prev => ({ ...prev, userBankHolder: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* 사업자 정보 섹션 */}
              <div className="businessman-list-form-section">
                <h4 className="businessman-list-section-title">사업자 정보</h4>
                <div className="businessman-list-form-grid">
                              {editForm.businessGradeIndex !== '1' && (
                <div className="businessman-list-form-item businessman-list-boss-search">
                    <label>상사 이메일</label>
                  <div className="businessman-list-boss-input-group">
                    <input
                      type="text"
                      placeholder="상사 이메일을 입력하세요"
                      value={editForm.bossEmail}
                      onChange={(e) => setEditForm(prev => ({ ...prev, bossEmail: e.target.value }))}
                      readOnly
                    />
                    <button type="button" className="businessman-list-btn businessman-list-btn-secondary" onClick={() => setShowBossSelectModal(true)}>
                      검색
                    </button>
                  </div>
                </div>
              )}
                  <div className="businessman-list-form-item">
                    <label>사업자 등급</label>
                    <select
                      value={editForm.businessGradeIndex}
                      onChange={(e) => setEditForm(prev => ({ ...prev, businessGradeIndex: e.target.value }))}
                    >
                      <option value="">등급을 선택하세요.</option>
                      {businessGrades.map(grade => (
                        <option key={grade.businessGradeIndex} value={grade.businessGradeIndex}>
                          {grade.businessGradeName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="businessman-list-form-item">
                    <label>사업 지역</label>
                    <select
                      value={editForm.businessAreaIndex}
                      onChange={(e) => setEditForm(prev => ({ ...prev, businessAreaIndex: e.target.value }))}
                    >
                      <option value="">지역을 선택하세요.</option>
                      {businessAreas.map(area => (
                        <option key={area.businessAreaIndex} value={area.businessAreaIndex}>
                          {area.businessAreaName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>


            </div>
            <div className="businessman-list-modal-actions">
              <button 
                className="businessman-list-btn businessman-list-btn-primary"
                onClick={handleSaveBusinessman}
                disabled={loading}
              >
                {loading ? '저장 중...' : '저장'}
              </button>
              <button 
                className="businessman-list-btn businessman-list-btn-secondary"
                onClick={() => setShowEditModal(false)}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 사업자 생성 모달 */}
      {showCreateModal && (
        <div className="businessman-list-modal-overlay">
          <div className="businessman-list-modal">
            <div className="businessman-list-modal-header">
              <h3>사업자 등록</h3>
              <button 
                className="businessman-list-modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>
            <div className="businessman-list-modal-content">
              {/* 기본 정보 섹션 */}
              <div className="businessman-list-form-section">
                <h4 className="businessman-list-section-title">기본 정보</h4>
                <div className="businessman-list-form-grid">
                  <div className="businessman-list-form-item">
                    <label>이메일 *</label>
                    <input
                      type="text"
                      value={createForm.email}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="이메일을 입력하세요"
                      autoComplete="off"
                    />
                  </div>
                  <div className="businessman-list-form-item">
                    <label>이름 *</label>
                    <input
                      type="text"
                      placeholder="이름을 입력하세요."
                      value={createForm.userName}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, userName: e.target.value }))}
                      autoComplete="off"
                    />
                  </div>
                  <div className="businessman-list-form-item">
                    <label>비밀번호 *</label>
                    <input
                      type="password"
                      placeholder="비밀번호를 입력하세요."
                      value={createForm.userPw}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, userPw: e.target.value }))}
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="businessman-list-form-item">
                    <label>휴대폰 번호</label>
                    <input
                      type="text"
                      placeholder="휴대폰 번호를 입력하세요."
                      value={createForm.userPhone}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, userPhone: e.target.value }))}
                      autoComplete="off"
                    />
                  </div>
                  <div className="businessman-list-form-item">
                    <label>생년월일</label>
                    <input
                      type="date"
                      placeholder="연도-월-일"
                      value={createForm.userBirthday}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, userBirthday: e.target.value }))}
                      autoComplete="off"
                    />
                  </div>
                  <div className="businessman-list-form-item">
                    <label>성별</label>
                    <select
                      value={createForm.userGenderIndex}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, userGenderIndex: e.target.value }))}
                    >
                      <option value="">성별을 선택하세요.</option>
                      <option value="1">남자</option>
                      <option value="2">여자</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 주소 섹션 */}
              <div className="businessman-list-form-section">
                <h4 className="businessman-list-section-title">주소</h4>
                <div className="businessman-list-form-grid">
                  <div className="businessman-list-form-item businessman-list-address-search">
                    <label>주소</label>
                    <div className="businessman-list-address-input-group">
                      <input
                        type="text"
                        value={createForm.userAddress}
                        disabled
                        className="businessman-list-readonly-input"
                      />
                      <button type="button" className="businessman-list-btn businessman-list-btn-secondary" onClick={() => handleAddressSearch(true)}>
                        검색
                      </button>
                    </div>
                  </div>
                  <div className="businessman-list-form-item businessman-list-full-width">
                    <label>상세주소</label>
                    <input
                      type="text"
                      placeholder="상세주소를 입력하세요"
                      value={createForm.userDetailAddress}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, userDetailAddress: e.target.value }))}
                      autoComplete="off"
                    />
                  </div>
                </div>
              </div>

              {/* 출금계좌 섹션 */}
              <div className="businessman-list-form-section">
                <h4 className="businessman-list-section-title">출금계좌</h4>
                <div className="businessman-list-form-grid">
                  <div className="businessman-list-form-item">
                    <label>은행명</label>
                    <select
                      value={createForm.userBankIndex}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, userBankIndex: e.target.value }))}
                    >
                      <option value="">은행명을 선택하세요.</option>
                      {banks.map(bank => (
                        <option key={bank.userBankIndex} value={bank.userBankIndex}>
                          {bank.userBankName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="businessman-list-form-item">
                    <label>계좌번호</label>
                    <input
                      type="text"
                      placeholder="계좌번호를 입력하세요(-제외)"
                      value={createForm.userBankNumber}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, userBankNumber: e.target.value }))}
                      autoComplete="off"
                    />
                  </div>
                  <div className="businessman-list-form-item">
                    <label>예금주</label>
                    <input
                      type="text"
                      placeholder="예금주"
                      value={createForm.userBankHolder}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, userBankHolder: e.target.value }))}
                      autoComplete="off"
                    />
                  </div>
                </div>
              </div>

              {/* 사업자 정보 섹션 */}
              <div className="businessman-list-form-section">
                <h4 className="businessman-list-section-title">사업자 정보</h4>
                <div className="businessman-list-form-grid">
                              {createForm.businessGradeIndex !== '1' && (
                <div className="businessman-list-form-item businessman-list-boss-search">
                    <label>상사 이메일</label>
                  <div className="businessman-list-boss-input-group">
                    <input
                      type="text"
                      placeholder="상사 이메일을 입력하세요"
                      value={createForm.bossEmail}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, bossEmail: e.target.value }))}
                      readOnly
                    />
                    <button type="button" className="businessman-list-btn businessman-list-btn-secondary" onClick={() => setShowBossSelectModal(true)}>
                      검색
                    </button>
                  </div>
                </div>
              )}
                  <div className="businessman-list-form-item">
                    <label>사업자 등급</label>
                    <select
                      value={createForm.businessGradeIndex}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, businessGradeIndex: e.target.value }))}
                    >
                      <option value="">등급을 선택하세요.</option>
                      {businessGrades.map(grade => (
                        <option key={grade.businessGradeIndex} value={grade.businessGradeIndex}>
                          {grade.businessGradeName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="businessman-list-form-item">
                    <label>사업 지역</label>
                    <select
                      value={createForm.businessAreaIndex}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, businessAreaIndex: e.target.value }))}
                    >
                      <option value="">지역을 선택하세요.</option>
                      {businessAreas.map(area => (
                        <option key={area.businessAreaIndex} value={area.businessAreaIndex}>
                          {area.businessAreaName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="businessman-list-modal-actions">
              <button 
                className="businessman-list-btn businessman-list-btn-primary"
                onClick={handleCreateBusinessmanSave}
                disabled={loading || !isCreateFormValid()}
              >
                {loading ? '등록 중...' : '등록'}
              </button>
              <button 
                className="businessman-list-btn businessman-list-btn-secondary"
                onClick={() => setShowCreateModal(false)}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="businessman-list-error-message">
          {error}
          <button onClick={fetchBusinessmanList}>다시 시도</button>
        </div>
      )}

      {/* 비밀번호 변경 모달 */}
      {showPasswordModal && (
        <div className="businessman-list-modal-overlay">
          <div className="businessman-list-password-modal">
            <div className="businessman-list-modal-header">
              <h3>비밀번호 변경</h3>
              <button 
                className="businessman-list-modal-close"
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordData({
                    newPassword: '',
                    confirmPassword: ''
                  });
                  setPasswordErrors({});
                }}
              >
                ×
              </button>
            </div>
            <div className="businessman-list-modal-content">
              <div className="businessman-list-password-form">
                <div className="businessman-list-password-input">
                  <label>새 비밀번호</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                    className={passwordErrors.newPassword ? 'businessman-list-input-error' : ''}
                    placeholder="새 비밀번호를 입력하세요"
                  />
                  {passwordErrors.newPassword && (
                    <div className="businessman-list-error-message">{passwordErrors.newPassword}</div>
                  )}
                </div>
                <div className="businessman-list-password-input">
                  <label>새 비밀번호 확인</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    className={passwordErrors.confirmPassword ? 'businessman-list-input-error' : ''}
                    placeholder="새 비밀번호를 다시 입력하세요"
                  />
                  {passwordErrors.confirmPassword && (
                    <div className="businessman-list-error-message">{passwordErrors.confirmPassword}</div>
                  )}
                </div>
              </div>
            </div>
            <div className="businessman-list-modal-actions">
              <button 
                className="businessman-list-btn businessman-list-btn-primary"
                onClick={handlePasswordSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? '변경 중...' : '변경'}
              </button>
              <button 
                className="businessman-list-btn businessman-list-btn-secondary"
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordData({
                    newPassword: '',
                    confirmPassword: ''
                  });
                  setPasswordErrors({});
                }}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 상사 선택 모달 */}
      {showBossSelectModal && (
        <div className="businessman-list-modal-overlay">
          <div className="businessman-list-boss-modal">
            <div className="businessman-list-modal-header">
              <h3>상사 선택</h3>
              <button 
                className="businessman-list-modal-close"
                onClick={() => {
                  setShowBossSelectModal(false);
                  setBossSearchTerm('');
                }}
              >
                ×
              </button>
            </div>
            <div className="businessman-list-modal-content">
              <div className="businessman-list-boss-search">
                <input
                  type="text"
                  placeholder="이메일 또는 이름으로 검색하세요"
                  value={bossSearchTerm}
                  onChange={(e) => setBossSearchTerm(e.target.value)}
                />
              </div>
              <div className="businessman-list-boss-list">
                {(bossSearchTerm ? filteredBossList : rows)
                  .filter(businessman => businessman.businessGradeIndex !== 1) // 딜러 제외
                  .length > 0 ? (
                  (bossSearchTerm ? filteredBossList : rows)
                    .filter(businessman => businessman.businessGradeIndex !== 1) // 딜러 제외
                    .map((businessman) => (
                    <div 
                      key={businessman.userIndex}
                      className="businessman-list-boss-item"
                      onClick={() => handleBossSelect(businessman.email, businessman.userName)}
                      onDoubleClick={() => handleBossSelect(businessman.email, businessman.userName)}
                    >
                      <div className="businessman-list-boss-info">
                        <div className="businessman-list-boss-email">{businessman.email}</div>
                        <div className="businessman-list-boss-name">{businessman.userName}</div>
                        <div className="businessman-list-boss-grade">{businessman.businessGradeName}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="businessman-list-no-data">
                    {bossSearchTerm ? '검색 결과가 없습니다.' : '사업자 목록이 없습니다.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessmanListPage; 