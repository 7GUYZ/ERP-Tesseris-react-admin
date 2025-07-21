import React, { useState, useEffect } from 'react';
import { adminMyPageApi } from '../../api/auth/TaekjunAuth';
import '../../styles/taekjun/AdminMyPage.css';

// 카카오 주소 API 스크립트 추가
const loadKakaoAddressAPI = () => {
  const script = document.createElement('script');
  script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
  script.async = true;
  document.head.appendChild(script);
  return script;
};

const AdminMyPage = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 임시 사용자 인덱스 (실제로는 로그인된 사용자 정보에서 가져와야 함)
  const userIndex = "1"; // 실제 구현시 로그인된 사용자의 userIndex로 변경

  useEffect(() => {
    fetchUserInfo();
    // 카카오 주소 API 로드
    loadKakaoAddressAPI();
  }, []);

  const fetchUserInfo = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminMyPageApi.getMyPageInfo(userIndex);
      setUserInfo(response.data);
    } catch (err) {
      console.error('사용자 정보 조회 실패:', err);
      setError('사용자 정보를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // 원래 데이터로 복원
    fetchUserInfo();
  };

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      await adminMyPageApi.updateMyPageInfo(userIndex, userInfo);
      alert('정보가 성공적으로 수정되었습니다.');
      setIsEditing(false);
    } catch (err) {
      console.error('정보 수정 실패:', err);
      alert('정보 수정에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setUserInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

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

    if (!passwordData.currentPassword) {
      errors.currentPassword = '현재 비밀번호를 입력해주세요.';
    }

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
      await adminMyPageApi.changePassword(userIndex, passwordData);
      alert('비밀번호가 성공적으로 변경되었습니다.');
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordErrors({});
    } catch (err) {
      console.error('비밀번호 변경 실패:', err);
      alert('비밀번호 변경에 실패했습니다. 현재 비밀번호를 확인해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR');
  };

  // eslint-disable-next-line no-unused-vars
  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    return date.toLocaleString('ko-KR');
  };

  const formatDateFromArray = (dateArray) => {
    if (!dateArray || !Array.isArray(dateArray) || dateArray.length < 3) return '';
    
    const [year, month, day, hour = 0, minute = 0] = dateArray;
    const date = new Date(year, month - 1, day, hour, minute); // month는 0부터 시작하므로 -1
    return date.toLocaleString('ko-KR');
  };

  const getGenderText = (genderIndex) => {
    switch (genderIndex) {
      case '1': return '남자';
      case '2': return '여자';
      default: return '';
    }
  };

  // 카카오 주소 검색 함수
  const openAddressSearch = () => {
    if (window.daum && window.daum.Postcode) {
      new window.daum.Postcode({
        oncomplete: function(data) {
          // 주소 정보 처리
          handleInputChange('userAddress', data.address);
          // 상세주소 입력창에 포커스
          const addressDetailInput = document.querySelector('input[name="addressDetail"]');
          if (addressDetailInput) {
            addressDetailInput.focus();
          }
        },
        onclose: function(state) {
          // 팝업이 닫힐 때 실행할 코드
          if (state === 'FORCE_CLOSE') {
            // 사용자가 검색 결과를 선택하지 않고 팝업을 닫은 경우
          } else if (state === 'COMPLETE_CLOSE') {
            // 사용자가 검색 결과를 선택한 경우
          }
        }
      }).open();
    } else {
      alert('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
    }
  };

  if (isLoading) {
    return (
      <div className="admin-mypage">
        <div className="admin-mypage-container">
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <div>로딩 중...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-mypage">
        <div className="admin-mypage-container">
          <div style={{ textAlign: 'center', padding: '50px', color: '#ef4444' }}>
            <div>{error}</div>
            <button 
              onClick={fetchUserInfo}
              style={{ 
                marginTop: '16px', 
                padding: '8px 16px', 
                background: '#3b7ddd', 
                color: '#fff', 
                border: 'none', 
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-mypage">
      <div className="admin-mypage-container">
        <div className="page-header">
          <h1 className="page-title">내정보</h1>
          <div style={{ display: 'flex', gap: '12px' }}>
            {!isEditing ? (
              <>
                <button 
                  className="modify-button"
                  onClick={handleEdit}
                >
                  수정
                </button>
                <button 
                  className="modify-button"
                  onClick={() => setShowPasswordModal(true)}
                  style={{ background: '#3B7DDD' }}
                >
                  비밀번호 변경
                </button>
              </>
            ) : (
              <>
                <button 
                  className="modify-button"
                  onClick={handleSave}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '저장 중...' : '저장'}
                </button>
                <button 
                  className="modify-button"
                  onClick={handleCancel}
                  style={{ background: '#6b7280' }}
                >
                  취소
                </button>
              </>
            )}
          </div>
        </div>

        {userInfo && (
          <>
            {/* 기본 정보 */}
            <div className="info-card">
              <h2 className="section-title">기본 정보</h2>
              <div className="info-grid">
                <div className="info-item">
                  <label className="info-label">아이디</label>
                  <div className="info-value">
                    {userInfo.userEmail || '-'}
                  </div>
                </div>
                <div className="info-item">
                  <label className="info-label">이름</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="info-value editable"
                      value={userInfo.userName || ''}
                      onChange={(e) => handleInputChange('userName', e.target.value)}
                    />
                  ) : (
                    <div className="info-value">
                      {userInfo.userName || '-'}
                    </div>
                  )}
                </div>
                <div className="info-item">
                  <label className="info-label">성별</label>
                  {isEditing ? (
                    <select
                      className="gender-select"
                      value={userInfo.userGender || ''}
                      onChange={(e) => handleInputChange('userGender', e.target.value)}
                    >
                      <option value="">선택하세요</option>
                      <option value="1">남자</option>
                      <option value="2">여자</option>
                    </select>
                  ) : (
                    <div className="info-value">
                      {getGenderText(userInfo.userGender) || '-'}
                    </div>
                  )}
                </div>
                <div className="info-item">
                  <label className="info-label">휴대폰번호</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="info-value editable"
                      value={userInfo.userPhone || ''}
                      onChange={(e) => handleInputChange('userPhone', e.target.value)}
                    />
                  ) : (
                    <div className="info-value">
                      {userInfo.userPhone || '-'}
                    </div>
                  )}
                </div>
                <div className="info-item">
                  <label className="info-label">생년월일</label>
                  <div className="info-value">
                    {formatDate(userInfo.userBirthday) || '-'}
                  </div>
                </div>
              </div>
            </div>

            {/* 상세 정보 */}
            <div className="info-card">
              <h2 className="section-title">상세 정보</h2>
              <div className="info-grid">
                <div className="info-item">
                  <label className="info-label">계정 등록일</label>
                  <div className="info-value">
                    {formatDateFromArray(userInfo.adminRegistrationDate) || '-'}
                  </div>
                </div>
                <div className="info-item">
                  <label className="info-label">직위</label>
                  <div className="info-value">
                    {userInfo.adminTypeName || '-'}
                  </div>
                </div>
                <div className="info-item">
                  <label className="info-label">주소</label>
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        className="info-value editable"
                        value={userInfo.userAddress || ''}
                        onChange={(e) => handleInputChange('userAddress', e.target.value)}
                        placeholder="주소를 검색하세요"
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        onClick={openAddressSearch}
                        style={{
                          padding: '8px 16px',
                          background: '#3B7DDD',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.9rem'
                        }}
                      >
                        주소 검색
                      </button>
                    </div>
                  ) : (
                    <div className="info-value">
                      {userInfo.userAddress || '-'}
                    </div>
                  )}
                </div>
                <div className="info-item">
                  <label className="info-label">상세주소</label>
                  {isEditing ? (
                                         <input
                       type="text"
                       name="addressDetail"
                       className="info-value editable"
                       value={userInfo.userDetailAddress || ''}
                       onChange={(e) => handleInputChange('userDetailAddress', e.target.value)}
                       placeholder="상세주소를 입력하세요 (동, 호수 등)"
                     />
                                     ) : (
                     <div className="info-value">
                       {userInfo.userDetailAddress || '-'}
                     </div>
                   )}
                </div>

              </div>
            </div>
          </>
        )}

        {/* 비밀번호 변경 모달 */}
        {showPasswordModal && (
          <div className="password-modal">
            <div className="password-modal-content">
              <div className="modal-header">
                <h3 className="modal-title">비밀번호 변경</h3>
                <button 
                  className="modal-close"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                    setPasswordErrors({});
                  }}
                >
                  ×
                </button>
              </div>
              <div className="password-form">
                <div className="password-input">
                  <label>현재 비밀번호</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                    className={passwordErrors.currentPassword ? 'error' : ''}
                  />
                  {passwordErrors.currentPassword && (
                    <div className="error-message">{passwordErrors.currentPassword}</div>
                  )}
                </div>
                <div className="password-input">
                  <label>새 비밀번호</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                    className={passwordErrors.newPassword ? 'error' : ''}
                  />
                  {passwordErrors.newPassword && (
                    <div className="error-message">{passwordErrors.newPassword}</div>
                  )}
                </div>
                <div className="password-input">
                  <label>새 비밀번호 확인</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    className={passwordErrors.confirmPassword ? 'error' : ''}
                  />
                  {passwordErrors.confirmPassword && (
                    <div className="error-message">{passwordErrors.confirmPassword}</div>
                  )}
                </div>
              </div>
              <div className="modal-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                    setPasswordErrors({});
                  }}
                >
                  취소
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={handlePasswordSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '변경 중...' : '변경'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMyPage;
