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

// 관리자 user_index 추출
const getAdminUserIndex = () => {
  try {
    const userInfo = localStorage.getItem('user-info');
    const userData = userInfo ? JSON.parse(userInfo) : null;
    return userData?.user_index;
  } catch {
    return undefined;
  }
};

const BusinessmanListPage = () => {
  const [businessmanList, setBusinessmanList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBusinessmen, setSelectedBusinessmen] = useState([]);
  const [searchFilters, setSearchFilters] = useState({
    email: '',
    userName: '',
    userPhone: '',
    businessGradeName: '',
    bossEmail: '',
    businessAreaName: '',
    businessAreaLevel: '',
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

  // 사업자 등급 옵션
  const businessGradeOptions = [
    { value: '', label: '등급을 선택하세요' },
    { value: '일반', label: '일반' },
    { value: '실버', label: '실버' },
    { value: '골드', label: '골드' },
    { value: '플래티넘', label: '플래티넘' }
  ];

  // 사업자 지역 옵션
  const businessAreaOptions = [
    { value: '', label: '지역을 선택하세요' },
    { value: '서울', label: '서울' },
    { value: '부산', label: '부산' },
    { value: '대구', label: '대구' },
    { value: '인천', label: '인천' },
    { value: '광주', label: '광주' },
    { value: '대전', label: '대전' },
    { value: '울산', label: '울산' }
  ];

  // 배포 상태 옵션
  const distributionFlagOptions = [
    { value: '', label: '상태를 선택하세요' },
    { value: '정상', label: '정상' },
    { value: '정지', label: '정지' }
  ];

  // 데이터 조회
  const fetchBusinessmanList = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('사업자 목록 API 호출 시작...');
      const response = await businessmanListApi.searchBusinessmanList(searchFilters);
      console.log('사업자 목록 API 응답:', response);
      setBusinessmanList(response.data || []);
      setFilteredList(response.data || []);
    } catch (err) {
      console.error('사업자 목록 조회 실패:', err);
      console.error('에러 상세:', err.response || err.message);
      setError(`사업자 목록을 불러오는데 실패했습니다. (${err.message})`);
    } finally {
      setLoading(false);
    }
  }, [searchFilters]);

  useEffect(() => {
    fetchBusinessmanList();
  }, [fetchBusinessmanList]);

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
    try {
      setLoading(true);
      await fetchBusinessmanList();
    } catch (err) {
      console.error('검색 실패:', err);
      setError('검색에 실패했습니다.');
    } finally {
      setLoading(false);
    }
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

  // 엑셀 다운로드
  const handleExcelDownload = () => {
    alert('엑셀 다운로드 기능은 추후 구현 예정입니다.');
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
      businessManDistributionFlag: businessman.businessManDistributionFlag || '',
      newBossEmail: '',
      changeOrganization: false
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
      businessManDistributionFlag: '정상'
    });
    setShowCreateModal(true);
  };

  // 사업자 정보 저장 (수정)
  const handleSaveBusinessman = async () => {
    try {
      setLoading(true);
      const adminUserIndex = getAdminUserIndex();
      await businessmanListApi.updateBusinessman({
        userIndex: editingBusinessman.userIndex,
        ...editForm
      });
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

  // 사업자 생성 저장
  const handleCreateBusinessmanSave = async () => {
    try {
      setLoading(true);
      await businessmanListApi.createBusinessman(createForm);
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

  // 사업자 삭제
  const handleDeleteBusinessman = async () => {
    if (selectedBusinessmen.length === 0) {
      alert('삭제할 사업자를 선택해주세요.');
      return;
    }

    if (!window.confirm('선택한 사업자를 삭제하시겠습니까?')) {
      return;
    }

    try {
      setLoading(true);
      const adminUserIndex = getAdminUserIndex();
      await businessmanListApi.deleteBusinessman({
        userIndex: selectedBusinessmen[0],
        reason: '관리자에 의한 삭제'
      });
      alert('사업자가 성공적으로 삭제되었습니다.');
      setSelectedBusinessmen([]);
      fetchBusinessmanList();
    } catch (err) {
      console.error('사업자 삭제 실패:', err);
      alert('사업자 삭제에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR');
  };

  // 숫자 포맷팅
  const formatNumber = (number) => {
    if (number === null || number === undefined) return '0';
    return number.toLocaleString();
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
              userAddress: data.address,
              userDetailAddress: '' // 상세주소는 초기화
            }));
          } else {
            setEditForm(prev => ({
              ...prev,
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
      const adminUserIndex = getAdminUserIndex();
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
            삭제
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
                onChange={(e) => handleFilterChange('businessGradeName', e.target.value)}
              >
                {businessGradeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
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
                onChange={(e) => handleFilterChange('businessAreaName', e.target.value)}
              >
                {businessAreaOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
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
                <th>이메일</th>
                <th>이름</th>
                <th>휴대폰 번호</th>
                <th>사업자 등급</th>
                <th>배포 상태</th>
                <th>은행명</th>
                <th>계좌번호</th>
                <th>예금주</th>
                <th>사업 지역</th>
                <th>상사 이메일</th>
              </tr>
            </thead>
          </table>
        </div>
        
        <div className="businessman-list-table-body-scrollable">
          <table className="businessman-list-table">
            <tbody>
              {filteredList.map((businessman, index) => (
                <tr key={businessman.userIndex}>
                  <td className="businessman-list-checkbox-col">
                    <input
                      type="checkbox"
                      checked={selectedBusinessmen.includes(businessman.userIndex)}
                      onChange={(e) => handleSelectBusinessman(businessman.userIndex, e.target.checked)}
                    />
                  </td>
                  <td>{businessmanList.length - index}</td>
                  <td>{businessman.email || '-'}</td>
                  <td>{businessman.userName || '-'}</td>
                  <td>{businessman.userPhone || '-'}</td>
                  <td>{businessman.businessGradeName || '-'}</td>
                  <td>{businessman.businessManDistributionFlag || '-'}</td>
                  <td>{businessman.userBankName || '-'}</td>
                  <td>{businessman.userBankNumber || '-'}</td>
                  <td>{businessman.userBankHolder || '-'}</td>
                  <td>{businessman.businessAreaName || '-'}</td>
                  <td>{businessman.bossEmail || '-'}</td>
                </tr>
              ))}
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
                  <div className="businessman-list-form-item">
                    <label>상사 이메일</label>
                    <input
                      type="text"
                      placeholder="상사 이메일을 입력하세요"
                      value={editForm.bossEmail}
                      onChange={(e) => setEditForm(prev => ({ ...prev, bossEmail: e.target.value }))}
                    />
                  </div>
                  <div className="businessman-list-form-item">
                    <label>사업자 등급</label>
                    <select
                      value={editForm.businessGradeIndex}
                      onChange={(e) => setEditForm(prev => ({ ...prev, businessGradeIndex: e.target.value }))}
                    >
                      <option value="">등급을 선택하세요.</option>
                      <option value="1">일반</option>
                      <option value="2">실버</option>
                      <option value="3">골드</option>
                      <option value="4">플래티넘</option>
                    </select>
                  </div>
                  <div className="businessman-list-form-item">
                    <label>사업 지역</label>
                    <select
                      value={editForm.businessAreaIndex}
                      onChange={(e) => setEditForm(prev => ({ ...prev, businessAreaIndex: e.target.value }))}
                    >
                      <option value="">지역을 선택하세요.</option>
                      <option value="1">서울</option>
                      <option value="2">부산</option>
                      <option value="3">대구</option>
                      <option value="4">인천</option>
                      <option value="5">광주</option>
                      <option value="6">대전</option>
                      <option value="7">울산</option>
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

              {/* 조직도 변경 섹션 */}
              <div className="businessman-list-form-section">
                <h4 className="businessman-list-section-title">조직도 변경</h4>
                <div className="businessman-list-form-grid">
                  <div className="businessman-list-form-item">
                    <label>
                      <input
                        type="checkbox"
                        checked={editForm.changeOrganization}
                        onChange={(e) => setEditForm(prev => ({ ...prev, changeOrganization: e.target.checked }))}
                      />
                      조직도 변경
                    </label>
                  </div>
                  {editForm.changeOrganization && (
                    <div className="businessman-list-form-item">
                      <label>새로운 상사 이메일</label>
                      <input
                        type="text"
                        placeholder="새로운 상사 이메일을 입력하세요"
                        value={editForm.newBossEmail}
                        onChange={(e) => setEditForm(prev => ({ ...prev, newBossEmail: e.target.value }))}
                      />
                    </div>
                  )}
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
                    />
                  </div>
                  <div className="businessman-list-form-item">
                    <label>이름 *</label>
                    <input
                      type="text"
                      placeholder="이름을 입력하세요."
                      value={createForm.userName}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, userName: e.target.value }))}
                    />
                  </div>
                  <div className="businessman-list-form-item">
                    <label>비밀번호 *</label>
                    <input
                      type="password"
                      placeholder="비밀번호를 입력하세요."
                      value={createForm.userPw}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, userPw: e.target.value }))}
                    />
                  </div>
                  <div className="businessman-list-form-item">
                    <label>휴대폰 번호</label>
                    <input
                      type="text"
                      placeholder="휴대폰 번호를 입력하세요."
                      value={createForm.userPhone}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, userPhone: e.target.value }))}
                    />
                  </div>
                  <div className="businessman-list-form-item">
                    <label>생년월일</label>
                    <input
                      type="date"
                      placeholder="연도-월-일"
                      value={createForm.userBirthday}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, userBirthday: e.target.value }))}
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
                    />
                  </div>
                  <div className="businessman-list-form-item">
                    <label>예금주</label>
                    <input
                      type="text"
                      placeholder="예금주"
                      value={createForm.userBankHolder}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, userBankHolder: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* 사업자 정보 섹션 */}
              <div className="businessman-list-form-section">
                <h4 className="businessman-list-section-title">사업자 정보</h4>
                <div className="businessman-list-form-grid">
                  <div className="businessman-list-form-item">
                    <label>상사 이메일</label>
                    <input
                      type="text"
                      placeholder="상사 이메일을 입력하세요"
                      value={createForm.bossEmail}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, bossEmail: e.target.value }))}
                    />
                  </div>
                  <div className="businessman-list-form-item">
                    <label>사업자 등급</label>
                    <select
                      value={createForm.businessGradeIndex}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, businessGradeIndex: e.target.value }))}
                    >
                      <option value="">등급을 선택하세요.</option>
                      <option value="1">일반</option>
                      <option value="2">실버</option>
                      <option value="3">골드</option>
                      <option value="4">플래티넘</option>
                    </select>
                  </div>
                  <div className="businessman-list-form-item">
                    <label>사업 지역</label>
                    <select
                      value={createForm.businessAreaIndex}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, businessAreaIndex: e.target.value }))}
                    >
                      <option value="">지역을 선택하세요.</option>
                      <option value="1">서울</option>
                      <option value="2">부산</option>
                      <option value="3">대구</option>
                      <option value="4">인천</option>
                      <option value="5">광주</option>
                      <option value="6">대전</option>
                      <option value="7">울산</option>
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
                disabled={loading}
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
    </div>
  );
};

export default BusinessmanListPage; 