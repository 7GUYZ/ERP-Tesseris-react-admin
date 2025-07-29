import React, { useState, useEffect, useCallback } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box } from '@mui/material';
import { userListApi } from '../../api/auth/TaekjunAuth';
import '../../styles/taekjun/UserListPage.css';

// DataGrid 컬럼 정의
const columns = [
  { field: 'email', headerName: '아이디', width: 150, sortable: true },
  { field: 'name', headerName: '이름', width: 120, sortable: true },
  { field: 'phone', headerName: '핸드폰 번호', width: 140, sortable: true },
  { field: 'userRole', headerName: '등급', width: 100, sortable: true },
  { field: 'cmBalance', headerName: '보유 CM', width: 120, sortable: true, type: 'number' },
  { field: 'registrationDate', headerName: '등록일', width: 120, sortable: true },
  { field: 'recommenderEmail', headerName: '추천인 아이디', width: 150, sortable: true },
  { field: 'recommenderName', headerName: '추천인 이름', width: 120, sortable: true },
  { field: 'bankName', headerName: '은행', width: 120, sortable: true },
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

const UserListPage = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [searchFilters, setSearchFilters] = useState({
    id: '',
    name: '',
    phone: '',
    userRole: '',
    startDate: '',
    endDate: ''
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 사용자 등급 옵션
  const userRoleOptions = [
    { value: '', label: '등급을 선택하세요' },
    { value: '일반', label: '일반' },
    { value: '가맹점', label: '가맹점' },
    { value: '사업자', label: '사업자' }
   
  ];

  // 데이터 조회
  const fetchUserList = useCallback(async (filters = searchFilters) => {
    try {
      setLoading(true);
      setError(null);
      console.log('API 호출 시작...');
      
      // 검색 필터가 있으면 필터링된 데이터 조회
      let response;
      if (filters && Object.values(filters).some(value => value !== '')) {
        console.log('검색 필터:', filters);
        // 검색 API 사용
        response = await userListApi.searchUserList(filters);
      } else {
        response = await userListApi.getUserList();
      }
      
      console.log('API 응답:', response);
      
      const data = response.data.map((item, index) => ({
        id: index + 1,
        ...item,
      }));
      
      setRows(data);
    } catch (err) {
      console.error('회원 목록 조회 실패:', err);
      console.error('에러 상세:', err.response || err.message);
      setError(`회원 목록을 불러오는데 실패했습니다. (${err.message})`);
    } finally {
      setLoading(false);
    }
  }, []); // 의존성 배열을 빈 배열로 변경

  // 초기 로딩 시에만 데이터 가져오기 (조회 버튼을 눌렀을 때만 검색)
  useEffect(() => {
    fetchUserList();
  }, []); // 빈 의존성 배열로 초기 로딩만 실행

  // 검색 필터 변경 시 자동 검색 (선택사항)
  // useEffect(() => {
  //   if (Object.values(searchFilters).some(value => value !== '')) {
  //     handleSearch();
  //   }
  // }, [searchFilters]);

  // 초기 로딩 시 모든 데이터 표시






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
      console.log('=== 검색 실행 ===');
      console.log('검색 필터:', searchFilters);
      console.log('================');
      // 검색 필터를 사용하여 데이터 다시 조회
      await fetchUserList(searchFilters);
    } catch (err) {
      console.error('검색 실패:', err);
      setError('검색에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };



  // CSV 다운로드
  const handleExcelDownload = async () => {
    try {
      setLoading(true);
      console.log('CSV 다운로드 시작...');
      
      // 현재 검색 필터를 사용하여 CSV 다운로드 요청
      const response = await userListApi.downloadUserList(searchFilters);
      
      // Blob 생성 및 다운로드
      const blob = new Blob([response.data], { 
        type: 'text/csv; charset=utf-8' 
      });
      
      // 파일명 생성 (현재 날짜 포함)
      const now = new Date();
      const dateStr = now.getFullYear() + 
        String(now.getMonth() + 1).padStart(2, '0') + 
        String(now.getDate()).padStart(2, '0');
      const fileName = `회원목록_${dateStr}.csv`;
      
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

  // 회원 수정
  const handleEditUser = (user) => {
    console.log('수정할 회원 데이터:', user);
    setEditingUser(user);
    setEditForm({
      name: user.name || '',
      birthday: user.birthday || '',
      gender: user.gender || '',
      phone: user.phone || '',
      address: user.address || '',
      detailAddress: user.detailAddress || '',
      bankName: user.bankName || '',
      bankNumber: user.bankNumber || '',
      bankHolder: user.bankHolder || ''
    });
    console.log('설정된 editForm:', {
      gender: user.gender,
      address: user.address,
      detailAddress: user.detailAddress
    });
    setShowEditModal(true);
  };

  // 회원 정보 저장
  const handleSaveUser = async () => {
    try {
      setLoading(true);
      const adminUserIndex = getAdminUserIndex();
      await userListApi.updateUser(editingUser.userIndex, editForm, adminUserIndex);
      alert('회원 정보가 성공적으로 수정되었습니다.');
      setShowEditModal(false);
      fetchUserList();
    } catch (err) {
      console.error('회원 수정 실패:', err);
      alert('회원 정보 수정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };





  // 카카오 주소 검색 함수
  const handleAddressSearch = async () => {
    try {
      const Postcode = await loadKakaoAddressScript();
      
      new Postcode({
        oncomplete: function(data) {
          // 주소 정보를 해당 필드에 넣는다.
          setEditForm(prev => ({
            ...prev,
            address: data.address,
            detailAddress: '' // 상세주소는 초기화
          }));
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
      await userListApi.updateUser(editingUser.userIndex, {
        password: passwordData.newPassword
      }, adminUserIndex);
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





  if (loading && rows.length === 0) {
    return (
      <div className="user-list-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-list-page">
      {/* 페이지 헤더 */}
      <div className="user-list-page-header">
        <h1 className="user-list-page-title">회원 리스트</h1>
        <div className="user-list-header-actions">
          <button className="user-list-action-btn user-list-excel-btn" onClick={handleExcelDownload}>
            엑셀
          </button>
          <button className="user-list-action-btn" onClick={handleSearch}>
            조회
          </button>
                     <button 
             className="user-list-action-btn" 
             onClick={() => selectedRows.size > 0 && handleEditUser(rows.find(u => u.id === Array.from(selectedRows)[0]))}
           >
             수정
           </button>
        </div>
      </div>

      {/* 검색 필터 */}
      <div className="user-list-search-section">
        <div className="user-list-search-grid">
          <div className="user-list-search-row">
            <div className="user-list-search-item">
              <label>아이디</label>
              <input
                type="text"
                placeholder="검색명을 입력하세요."
                value={searchFilters.id}
                onChange={(e) => handleFilterChange('id', e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>
            <div className="user-list-search-item">
              <label>이름</label>
              <input
                type="text"
                placeholder="검색명을 입력하세요."
                value={searchFilters.name}
                onChange={(e) => handleFilterChange('name', e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>
            <div className="user-list-search-item">
              <label>핸드폰 번호</label>
              <input
                type="text"
                placeholder="검색명을 입력하세요."
                value={searchFilters.phone}
                onChange={(e) => handleFilterChange('phone', e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>
          </div>
          <div className="user-list-search-row">
            <div className="user-list-search-item">
              <label>등록일</label>
              <div className="user-list-date-inputs">
                <input
                  type="date"
                  value={searchFilters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <span>~</span>
                <input
                  type="date"
                  value={searchFilters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  onKeyPress={handleKeyPress}
                />
              </div>
            </div>
            <div className="user-list-search-item">
              <label>등급</label>
              <select
                value={searchFilters.userRole}
                onChange={(e) => handleFilterChange('userRole', e.target.value)}
              >
                {userRoleOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

            {/* 회원 목록 DataGrid */}
      <div className="user-list-data-grid">
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

      {/* 회원 수정 모달 */}
      {showEditModal && (
        <div className="user-list-modal-overlay">
          <div className="user-list-modal">
            <div className="user-list-modal-header">
              <h3>일반/정 회원 정보 수정</h3>
              <button 
                className="user-list-modal-close"
                onClick={() => setShowEditModal(false)}
              >
                ×
              </button>
            </div>
            <div className="user-list-modal-content">
              {/* 기본 정보 섹션 */}
              <div className="user-list-form-section">
                <h4 className="user-list-section-title">기본 정보</h4>
                <div className="user-list-form-grid">
                  <div className="user-list-form-item">
                    <label>아이디</label>
                    <input
                      type="text"
                      value={editingUser?.email || ''}
                      disabled
                      className="user-list-readonly-input"
                    />
                  </div>
                  <div className="user-list-form-item">
                    <label>이름</label>
                    <input
                      type="text"
                      placeholder="이름을 입력하세요."
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="user-list-form-item">
                    <label>생년월일</label>
                    <input
                      type="date"
                      placeholder="연도-월-일"
                      value={editForm.birthday}
                      onChange={(e) => setEditForm(prev => ({ ...prev, birthday: e.target.value }))}
                    />
                  </div>
                  <div className="user-list-form-item">
                    <label>성별</label>
                    <select
                      value={editForm.gender}
                      onChange={(e) => setEditForm(prev => ({ ...prev, gender: e.target.value }))}
                    >
                      <option value="">성별을 선택하세요.</option>
                      <option value="남자">남자</option>
                      <option value="여자">여자</option>
                    </select>
                  </div>
                  <div className="user-list-form-item">
                    <label>휴대폰 번호</label>
                    <input
                      type="text"
                      placeholder="휴대폰 번호를 입력하세요"
                      value={editForm.phone}
                      onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div className="user-list-form-item">
                    <label>비밀번호 변경</label>
                    <button 
                      type="button" 
                      className="user-list-btn user-list-btn-secondary"
                      onClick={() => setShowPasswordModal(true)}
                    >
                      비밀번호 변경
                    </button>
                  </div>

                </div>
              </div>

              {/* 주소 섹션 */}
              <div className="user-list-form-section">
                <h4 className="user-list-section-title">주소</h4>
                <div className="user-list-form-grid">
                  <div className="user-list-form-item user-list-address-search">
                    <label>전체주소</label>
                    <div className="user-list-address-input-group">
                      <input
                        type="text"
                        value={editForm.address}
                        disabled
                        className="user-list-readonly-input"
                      />
                      <button type="button" className="user-list-btn user-list-btn-secondary" onClick={handleAddressSearch}>
                        검색
                      </button>
                    </div>
                  </div>
                  <div className="user-list-form-item user-list-full-width">
                    <label>상세주소</label>
                    <input
                      type="text"
                      placeholder="상세주소를 입력하세요"
                      value={editForm.detailAddress}
                      onChange={(e) => setEditForm(prev => ({ ...prev, detailAddress: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* 출금계좌 섹션 */}
              <div className="user-list-form-section">
                <h4 className="user-list-section-title">출금계좌</h4>
                <div className="user-list-form-grid">
                  <div className="user-list-form-item">
                    <label>은행명</label>
                    <select
                      value={editForm.bankName}
                      onChange={(e) => setEditForm(prev => ({ ...prev, bankName: e.target.value }))}
                    >
                      <option value="">은행명을 선택하세요.</option>
                      <option value="신한은행">신한은행</option>
                      <option value="국민은행">국민은행</option>
                      <option value="우리은행">우리은행</option>
                      <option value="하나은행">하나은행</option>
                      <option value="기업은행">기업은행</option>
                      <option value="농협은행">농협은행</option>
                      <option value="새마을금고">새마을금고</option>
                      <option value="신협">신협</option>
                    </select>
                  </div>
                  <div className="user-list-form-item">
                    <label>계좌번호</label>
                    <input
                      type="text"
                      placeholder="계좌번호를 입력하세요(-제외)"
                      value={editForm.bankNumber}
                      onChange={(e) => setEditForm(prev => ({ ...prev, bankNumber: e.target.value }))}
                    />
                  </div>
                  <div className="user-list-form-item">
                    <label>예금주</label>
                    <input
                      type="text"
                      placeholder="예금주"
                      value={editForm.bankHolder}
                      onChange={(e) => setEditForm(prev => ({ ...prev, bankHolder: e.target.value }))}
                    />
                  </div>
                </div>
              </div>


            </div>
            <div className="user-list-modal-actions">
              <button 
                className="user-list-btn user-list-btn-primary"
                onClick={handleSaveUser}
                disabled={loading}
              >
                {loading ? '저장 중...' : '저장'}
              </button>
              <button 
                className="user-list-btn user-list-btn-secondary"
                onClick={() => setShowEditModal(false)}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="user-list-error-message">
          {error}
          <button onClick={fetchUserList}>다시 시도</button>
        </div>
      )}

      {/* 비밀번호 변경 모달 */}
      {showPasswordModal && (
        <div className="user-list-modal-overlay">
          <div className="user-list-password-modal">
            <div className="user-list-modal-header">
              <h3>비밀번호 변경</h3>
              <button 
                className="user-list-modal-close"
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
            <div className="user-list-modal-content">
              <div className="user-list-password-form">
                <div className="user-list-password-input">
                  <label>새 비밀번호</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                    className={passwordErrors.newPassword ? 'user-list-input-error' : ''}
                    placeholder="새 비밀번호를 입력하세요"
                  />
                  {passwordErrors.newPassword && (
                    <div className="user-list-error-message">{passwordErrors.newPassword}</div>
                  )}
                </div>
                <div className="user-list-password-input">
                  <label>새 비밀번호 확인</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    className={passwordErrors.confirmPassword ? 'user-list-input-error' : ''}
                    placeholder="새 비밀번호를 다시 입력하세요"
                  />
                  {passwordErrors.confirmPassword && (
                    <div className="user-list-error-message">{passwordErrors.confirmPassword}</div>
                  )}
                </div>
              </div>
            </div>
            <div className="user-list-modal-actions">
              <button 
                className="btn btn-primary"
                onClick={handlePasswordSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? '변경 중...' : '변경'}
              </button>
              <button 
                className="btn btn-secondary"
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

export default UserListPage; 