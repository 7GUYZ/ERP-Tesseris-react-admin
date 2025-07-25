import React, { useState, useEffect, useCallback } from 'react';
import { userListApi } from '../../api/auth/TaekjunAuth';
import '../../styles/taekjun/UserListPage.css';

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
  const [userList, setUserList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
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
    { value: '사업자', label: '사업자' },
    { value: '정회원', label: '정회원' }
  ];

  // 데이터 조회
  const fetchUserList = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('API 호출 시작...');
      const response = await userListApi.getUserList();
      console.log('API 응답:', response);
      setUserList(response.data || []);
      setFilteredList(response.data || []);
    } catch (err) {
      console.error('회원 목록 조회 실패:', err);
      console.error('에러 상세:', err.response || err.message);
      setError(`회원 목록을 불러오는데 실패했습니다. (${err.message})`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserList();
  }, [fetchUserList]);

  // 초기 로딩 시 모든 데이터 표시
  useEffect(() => {
    setFilteredList(userList);
  }, [userList]);



  // 검색 필터 적용 (조회 버튼 클릭 시에만 실행)
  const applyFilters = useCallback(() => {
    let filtered = [...userList];

    if (searchFilters.id) {
      filtered = filtered.filter(user => 
        user.email && user.email.toLowerCase().includes(searchFilters.id.toLowerCase())
      );
    }

    if (searchFilters.name) {
      filtered = filtered.filter(user => 
        user.name && user.name.toLowerCase().includes(searchFilters.name.toLowerCase())
      );
    }

    if (searchFilters.phone) {
      filtered = filtered.filter(user => 
        user.phone && user.phone.includes(searchFilters.phone)
      );
    }

    if (searchFilters.userRole) {
      filtered = filtered.filter(user => 
        user.userRole === searchFilters.userRole
      );
    }

    if (searchFilters.startDate) {
      filtered = filtered.filter(user => 
        user.registrationDate && user.registrationDate >= searchFilters.startDate
      );
    }

    if (searchFilters.endDate) {
      filtered = filtered.filter(user => 
        user.registrationDate && user.registrationDate <= searchFilters.endDate
      );
    }

    setFilteredList(filtered);
  }, [userList, searchFilters]);

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
      // 서버 검색이 아닌 클라이언트 필터링 사용
      applyFilters();
    } catch (err) {
      console.error('검색 실패:', err);
      setError('검색에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 전체 선택/해제 (단일 선택 모드에서는 비활성화)
  // eslint-disable-next-line no-unused-vars
  const handleSelectAll = (checked) => {
    // 단일 선택 모드에서는 전체 선택 비활성화
    setSelectedUsers([]);
  };

  // 개별 선택/해제 (단일 선택만 가능)
  const handleSelectUser = (userIndex, checked) => {
    if (checked) {
      // 다른 모든 선택 해제하고 현재 항목만 선택
      setSelectedUsers([userIndex]);
    } else {
      setSelectedUsers([]);
    }
  };

  // 엑셀 다운로드
  const handleExcelDownload = () => {
    // 엑셀 다운로드 로직 구현
    alert('엑셀 다운로드 기능은 추후 구현 예정입니다.');
  };

  // 회원 수정
  const handleEditUser = (user) => {
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



  if (loading && userList.length === 0) {
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
          <button className="user-list-action-btn" onClick={handleExcelDownload}>
            엑셀
          </button>
          <button className="user-list-action-btn" onClick={handleSearch}>
            조회
          </button>
                     <button 
             className="user-list-action-btn" 
             onClick={() => selectedUsers.length > 0 && handleEditUser(filteredList.find(u => u.userIndex === selectedUsers[0]))}
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

            {/* 회원 목록 테이블 */}
      <div className="user-list-table-container">
        <div className="user-list-table-header-fixed">
          <table className="user-list-table">
            <thead>
              <tr>
                <th className="user-list-checkbox-col">
                  <input
                    type="checkbox"
                    checked={false}
                    disabled={true}
                    title="단일 선택 모드"
                  />
                </th>
                <th>No</th>
                <th>아이디</th>
                <th>이름</th>
                <th>핸드폰 번호</th>
                <th>등급</th>
                <th>보유 CM</th>
                <th>결제금액</th>
                <th>등록일</th>
                <th>추천인 아이디</th>
                <th>추천인 이름</th>
                <th>은행</th>
              </tr>
            </thead>
          </table>
        </div>
        
        <div className="user-list-table-body-scrollable">
          <table className="user-list-table">
            <tbody>
              {filteredList.map((user, index) => (
                <tr key={user.userIndex}>
                  <td className="user-list-checkbox-col">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.userIndex)}
                      onChange={(e) => handleSelectUser(user.userIndex, e.target.checked)}
                    />
                  </td>
                  <td>{userList.length - index}</td>
                  <td>{user.email || '-'}</td>
                  <td>{user.name || '-'}</td>
                  <td>{user.phone || '-'}</td>
                  <td>{user.userRole || '-'}</td>
                  <td className="user-list-number-cell">{formatNumber(user.cmBalance || 0)}</td>
                  <td className="user-list-number-cell">0</td>
                  <td>{formatDate(user.registrationDate)}</td>
                  <td>{user.recommenderEmail || '-'}</td>
                  <td>{user.recommenderName || '-'}</td>
                  <td>{user.bankName || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="user-list-table-footer-fixed">
          <table className="user-list-table">
            <tfoot>
              <tr className="user-list-summary-row">
                <td colSpan="5">합계</td>
                <td></td>
                <td className="user-list-number-cell">
                  {formatNumber(filteredList.reduce((sum, user) => sum + (user.cmBalance || 0), 0))}
                </td>
                <td className="user-list-number-cell">0</td>
                <td colSpan="4"></td>
              </tr>
            </tfoot>
          </table>
        </div>
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
                      value={editForm.phone}
                      disabled
                      className="user-list-readonly-input"
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
                    <label>주소</label>
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