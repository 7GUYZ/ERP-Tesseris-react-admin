import React, { useState, useEffect, useCallback } from 'react';
import { businessmanListApi } from '../../api/auth/TaekjunAuth';
import '../../styles/taekjun/BusinessmanListPage.css';

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
  const [businessmanList, setBusinessmanList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBusinessmen, setSelectedBusinessmen] = useState([]);
  // 사업자 등급/지역 상태 추가
  const [businessGrades, setBusinessGrades] = useState([]);
  const [businessAreas, setBusinessAreas] = useState([]);
  // 검색 필터 name 기반으로 (서버에서 매핑 처리)
  const [searchFilters, setSearchFilters] = useState({
    email: '',
    userName: '',
    userPhone: '',
    businessGradeName: '',
    bossEmail: '',
    businessAreaName: '',
    businessManDistributionFlag: ''
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

  // 배포 상태 옵션
  const distributionFlagOptions = [
    { value: '', label: '상태를 선택하세요.' },
    { value: '정상', label: '정상' },
    { value: '정지', label: '정지' }
  ];

  // 데이터 조회
  const fetchBusinessmanList = useCallback(async (filters = searchFilters) => {
    try {
      setLoading(true);
      setError(null);
      console.log('사업자 목록 API 호출 시작...');
      
      // 필터가 있으면 검색 API, 없으면 전체 조회 API 사용
      let response;
      if (filters && Object.values(filters).some(value => value !== '')) {
      console.log('검색 필터:', filters);
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
        const mappedData = response.data.map(businessman => ({
          ...businessman,
          businessGradeName: businessman.businessGradeName || '-',
          businessAreaName: businessman.businessAreaName || '-',
          businessManDistributionFlag: businessman.businessManDistributionFlag || '-'
        }));
        
        console.log('매핑된 데이터:', mappedData);
        console.log('매핑된 데이터 길이:', mappedData.length);
        setBusinessmanList(mappedData);
        setFilteredList(mappedData);
      } else {
        console.error('응답 데이터가 배열이 아닙니다:', response.data);
        setBusinessmanList([]);
        setFilteredList([]);
      }
    } catch (err) {
      console.error('사업자 목록 조회 실패:', err);
      console.error('에러 상세:', err.response || err.message);
      setError(`사업자 목록을 불러오는데 실패했습니다. (${err.message})`);
      setBusinessmanList([]);
      setFilteredList([]);
    } finally {
      setLoading(false);
    }
  }, [searchFilters]);

  // 최초 렌더링 시 등급/지역 불러오기
  useEffect(() => {
    fetchBusinessGrades();
    fetchBusinessAreas();
  }, [fetchBusinessGrades, fetchBusinessAreas]);

  // 등급과 지역 데이터가 로드된 후 사업자 목록 조회
  useEffect(() => {
    // 컴포넌트 마운트 시 사업자 목록 조회
    fetchBusinessmanList();
  }, [fetchBusinessmanList]); // fetchBusinessmanList 의존성 추가

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

  // 검색 실행 (클라이언트 사이드 필터링)
  const handleSearch = () => {
      console.log('검색 실행 - 필터:', searchFilters);
    // 클라이언트 사이드 필터링만 수행
    // getFilteredList() 함수가 자동으로 필터링된 결과를 반환
  };

  // 개별 선택/해제 (단일 선택만 가능)
  const handleSelectBusinessman = (userIndex, checked) => {
    if (checked) {
      // 다른 모든 선택 해제하고 현재 항목만 선택
      setSelectedBusinessmen([userIndex]);
    } else {
      setSelectedBusinessmen([]);
    }
  };

  // CSV 다운로드
  const handleExcelDownload = async () => {
    try {
      setLoading(true);
      console.log('CSV 다운로드 시작...');
      
      // 현재 검색 필터를 사용하여 CSV 다운로드 요청
      const response = await businessmanListApi.downloadBusinessmanList(searchFilters);
      
      // Blob 생성 및 다운로드
      const blob = new Blob([response.data], { 
        type: 'text/csv; charset=utf-8' 
      });
      
      // 파일명 생성 (현재 날짜 포함)
      const now = new Date();
      const dateStr = now.getFullYear() + 
        String(now.getMonth() + 1).padStart(2, '0') + 
        String(now.getDate()).padStart(2, '0');
      const fileName = `사업자목록_${dateStr}.csv`;
      
      // 다운로드 링크 생성 및 클릭
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('CSV 다운로드 완료');
      alert('CSV 파일이 성공적으로 다운로드되었습니다.');
    } catch (err) {
      console.error('CSV 다운로드 실패:', err);
      alert('CSV 다운로드에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 사업자 수정
  const handleEditBusinessman = (businessman) => {
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
      businessAreaIndex: businessman.businessAreaIndex || '',
      businessManDistributionFlag: businessman.businessManDistributionFlag || ''
    });
    setShowEditModal(true);
  };

  // 사업자 생성
  const handleCreateBusinessman = () => {
    setCreateForm({
      email: '',
      userName: '',
      userPw: '',
      userPhone: '',
      userBirthday: '',
      userGenderIndex: '',
      userZoneCode: '',
      userAddress: '',
      userDetailAddress: '',
      userBankIndex: '',
      userBankNumber: '',
      userBankHolder: '',
      bossEmail: '',
      businessManRegistrationDate: '',
      businessGradeIndex: '',
      businessAreaIndex: '',
      businessManDistributionFlag: ''
    });
    setShowCreateModal(true);
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
        businessAreaIndex: editForm.businessAreaIndex ? parseInt(editForm.businessAreaIndex) : null,
        businessManDistributionFlag: editForm.businessManDistributionFlag
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
        businessAreaIndex: createForm.businessAreaIndex ? parseInt(createForm.businessAreaIndex) : null,
        businessManDistributionFlag: createForm.businessManDistributionFlag
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

  // 사업자 비활성화
  const handleDeleteBusinessman = async () => {
    if (selectedBusinessmen.length === 0) {
      alert('비활성화할 사업자를 선택해주세요.');
      return;
    }

    if (!window.confirm('선택한 사업자를 비활성화하시겠습니까?')) {
      return;
    }

    try {
      setLoading(true);
      await businessmanListApi.deleteBusinessman({
        userIndex: selectedBusinessmen[0]
      });
      alert('사업자가 성공적으로 비활성화되었습니다.');
      setSelectedBusinessmen([]);
      fetchBusinessmanList();
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
    const filtered = businessmanList.filter(businessman => 
      businessman.email.toLowerCase().includes(bossSearchTerm.toLowerCase()) ||
      businessman.userName.toLowerCase().includes(bossSearchTerm.toLowerCase())
    );
    setFilteredBossList(filtered);
  }, [businessmanList, bossSearchTerm]);

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
      createForm.userBirthday?.trim() !== '' &&
      createForm.userGenderIndex?.trim() !== '' &&
      createForm.userAddress?.trim() !== '' &&
      createForm.userDetailAddress?.trim() !== '' &&
      createForm.userBankIndex?.trim() !== '' &&
      createForm.userBankNumber?.trim() !== '' &&
      createForm.userBankHolder?.trim() !== '' &&
      createForm.bossEmail?.trim() !== '' &&
      createForm.businessGradeIndex?.trim() !== '' &&
      createForm.businessAreaIndex?.trim() !== '' &&
      createForm.businessManDistributionFlag?.trim() !== ''
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

  if (loading && businessmanList.length === 0) {
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
          <button className="businessman-list-action-btn" onClick={handleExcelDownload}>
            엑셀
          </button>
          <button className="businessman-list-action-btn" onClick={handleSearch}>
            조회
          </button>
          <button className="businessman-list-action-btn" onClick={handleCreateBusinessman}>
            등록
          </button>
          <button 
            className="businessman-list-action-btn" 
            onClick={() => selectedBusinessmen.length > 0 && handleEditBusinessman(filteredList.find(b => b.userIndex === selectedBusinessmen[0]))}
          >
            수정
          </button>
          <button 
            className="businessman-list-action-btn businessman-list-action-btn-danger" 
            onClick={handleDeleteBusinessman}
          >
            비활성화
          </button>
        </div>
      </div>

      {/* 검색 필터 */}
      <div className="businessman-list-search-section">
        <div className="businessman-list-search-grid">
          <div className="businessman-list-search-row">
            <div className="businessman-list-search-item">
              <label>이메일</label>
              <input
                type="text"
                placeholder="이메일을 입력하세요."
                value={searchFilters.email}
                onChange={(e) => handleFilterChange('email', e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>
            <div className="businessman-list-search-item">
              <label>이름</label>
              <input
                type="text"
                placeholder="이름을 입력하세요."
                value={searchFilters.userName}
                onChange={(e) => handleFilterChange('userName', e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>
            <div className="businessman-list-search-item">
              <label>휴대폰 번호</label>
              <input
                type="text"
                placeholder="휴대폰 번호를 입력하세요."
                value={searchFilters.userPhone}
                onChange={(e) => handleFilterChange('userPhone', e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>
          </div>
          <div className="businessman-list-search-row">
            <div className="businessman-list-search-item">
              <label>사업자 등급</label>
              <select
                value={searchFilters.businessGradeName}
                onChange={e => setSearchFilters({ ...searchFilters, businessGradeName: e.target.value })}
              >
                <option value=''>전체 등급</option>
                {businessGrades.map(grade => (
                  <option key={grade.businessGradeIndex} value={grade.businessGradeName}>
                    {grade.businessGradeName}
                  </option>
                ))}
              </select>
            </div>
            <div className="businessman-list-search-item">
              <label>상사 이메일</label>
              <input
                type="text"
                placeholder="상사 이메일을 입력하세요."
                value={searchFilters.bossEmail}
                onChange={(e) => handleFilterChange('bossEmail', e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>
            <div className="businessman-list-search-item">
              <label>사업 지역</label>
              <select
                value={searchFilters.businessAreaName}
                onChange={e => setSearchFilters({ ...searchFilters, businessAreaName: e.target.value })}
              >
                <option value=''>전체 지역</option>
                {businessAreas.map(area => (
                  <option key={area.businessAreaIndex} value={area.businessAreaName}>
                    {area.businessAreaName}
                  </option>
                ))}
              </select>
            </div>
            <div className="businessman-list-search-item">
              <label>배포 상태</label>
              <select
                value={searchFilters.businessManDistributionFlag}
                onChange={(e) => handleFilterChange('businessManDistributionFlag', e.target.value)}
              >
                {distributionFlagOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 사업자 목록 테이블 */}
      <div className="businessman-list-table-container">
        <div className="businessman-list-table-header-fixed">
          <table className="businessman-list-table">
            <thead>
              <tr>
                <th className="businessman-list-checkbox-col">
                  <input
                    type="checkbox"
                    checked={false}
                    disabled={true}
                    title="단일 선택 모드"
                  />
                </th>
                <th>No</th>
                <th>이름</th>
                <th>이메일</th>
                <th>휴대폰 번호</th>
                <th>사업자 등급</th>
                <th>배포 상태</th>
                <th>은행명</th>
                <th>계좌번호</th>
                <th>예금주</th>
                <th>사업 지역</th>
                <th>상사 이름</th>
                <th>상사 이메일</th>
              </tr>
            </thead>
          </table>
        </div>
        
        <div className="businessman-list-table-body-scrollable">
          <table className="businessman-list-table">
            <tbody>
              {businessmanList.length > 0 ? (
                businessmanList.map((businessman, index) => (
                  <tr key={businessman.userIndex}>
                    <td className="businessman-list-checkbox-col">
                      <input
                        type="checkbox"
                        checked={selectedBusinessmen.includes(businessman.userIndex)}
                        onChange={(e) => handleSelectBusinessman(businessman.userIndex, e.target.checked)}
                      />
                    </td>
                    <td>{businessmanList.length - index}</td>
                    <td>{businessman.userName || '-'}</td>
                    <td>{businessman.email || '-'}</td>
                    <td>{businessman.userPhone || '-'}</td>
                    <td>{businessman.businessGradeName || '-'}</td>
                    <td>{businessman.businessManDistributionFlag || '-'}</td>
                    <td>{businessman.userBankName || '-'}</td>
                    <td>{businessman.userBankNumber || '-'}</td>
                    <td>{businessman.userBankHolder || '-'}</td>
                    <td>{businessman.businessAreaName || '-'}</td>
                    <td>{businessman.bossName || '-'}</td>
                    <td>{businessman.bossEmail || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="13" style={{ textAlign: 'center', padding: '20px' }}>
                    {loading ? '데이터를 불러오는 중...' : '데이터가 없습니다.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
                      <option value="1">신한은행</option>
                      <option value="2">국민은행</option>
                      <option value="3">우리은행</option>
                      <option value="4">하나은행</option>
                      <option value="5">기업은행</option>
                      <option value="6">농협은행</option>
                      <option value="7">새마을금고</option>
                      <option value="8">신협</option>
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
                  <div className="businessman-list-form-item">
                    <label>배포 상태</label>
                    <select
                      value={editForm.businessManDistributionFlag}
                      onChange={(e) => setEditForm(prev => ({ ...prev, businessManDistributionFlag: e.target.value }))}
                    >
                      <option value="">상태를 선택하세요.</option>
                      <option value="정상">정상</option>
                      <option value="정지">정지</option>
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
                      <option value="1">신한은행</option>
                      <option value="2">국민은행</option>
                      <option value="3">우리은행</option>
                      <option value="4">하나은행</option>
                      <option value="5">기업은행</option>
                      <option value="6">농협은행</option>
                      <option value="7">새마을금고</option>
                      <option value="8">신협</option>
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
                  <div className="businessman-list-form-item">
                    <label>배포 상태</label>
                    <select
                      value={createForm.businessManDistributionFlag}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, businessManDistributionFlag: e.target.value }))}
                    >
                      <option value="정상">정상</option>
                      <option value="정지">정지</option>
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
                {(bossSearchTerm ? filteredBossList : businessmanList)
                  .filter(businessman => businessman.businessGradeIndex !== 1) // 딜러 제외
                  .length > 0 ? (
                  (bossSearchTerm ? filteredBossList : businessmanList)
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