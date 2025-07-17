import React, { useState, useEffect } from 'react';
import '../../../styles/taekjun/AuthorityForm.css';

const AuthorityForm = ({
  adminTypes,
  menus = [],
  programs = [],
  editingAuthority,
  onSubmit,
  onCancel,
  loading,
  fetchMenus = () => {},
  fetchPrograms = () => {},
  selectedAdminType = '',
  setSelectedAdminType = () => {},
  selectedMenu = '',
  setSelectedMenu = () => {},
  authorities = [],
}) => {
  const [formData, setFormData] = useState({
    adminTypeIndex: '',
    programIndex: '',
    insertAuthority: 0,
    deleteAuthority: 0,
    updateAuthority: 0,
    userIndex: '',
    password: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editingAuthority) {
      // 로컬스토리지에서 user_index 가져오기
      const userInfo = localStorage.getItem('user-info');
      let userIndex = '';
      if (userInfo) {
        try {
          const parsedUserInfo = JSON.parse(userInfo);
          userIndex = parsedUserInfo.user_index || '';
        } catch (error) {
          console.error('사용자 정보 파싱 실패:', error);
        }
      }

      setFormData({
        adminTypeIndex: editingAuthority.adminTypeIndex || '',
        programIndex: editingAuthority.programIndex ? String(editingAuthority.programIndex) : '',
        insertAuthority: editingAuthority.insertAuthority || 0,
        deleteAuthority: editingAuthority.deleteAuthority || 0,
        updateAuthority: editingAuthority.updateAuthority ? 1 : 0,
        userIndex: userIndex,
        password: '',
      });
    } else {
      setFormData({
        adminTypeIndex: '',
        programIndex: '',
        insertAuthority: 0,
        deleteAuthority: 0,
        updateAuthority: 0,
        userIndex: '',
        password: '',
      });
    }
    setErrors({});
  }, [editingAuthority]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.adminTypeIndex) newErrors.adminTypeIndex = '관리자 타입을 선택해주세요';
    if (!formData.programIndex) newErrors.programIndex = '프로그램을 선택해주세요';
    
    // 수정 모드일 때만 비밀번호 검증
    if (editingAuthority) {
      if (!formData.password) newErrors.password = '비밀번호를 입력해주세요';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let submitData = { ...formData };
    // 수정 모드라면 programIndex를 editingAuthority에서 강제 세팅
    if (editingAuthority) {
      submitData.programIndex = editingAuthority.programIndex;
    }
    console.log('폼 제출됨!', submitData); // 디버깅용
    if (validateForm()) {
      onSubmit(submitData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="authority-form">
      <div className="form-grid">
        <div className="form-item">
          <label htmlFor="adminTypeIndex">관리자 타입 *</label>
          {!editingAuthority ? (
          <select
            id="adminTypeIndex"
            name="adminTypeIndex"
            value={formData.adminTypeIndex}
              onChange={e => {
                setFormData(prev => ({ ...prev, adminTypeIndex: e.target.value, programIndex: '' }));
                setSelectedAdminType(e.target.value);
                setSelectedMenu('');
                fetchMenus(e.target.value);
              }}
            className={errors.adminTypeIndex ? 'error' : ''}
          >
            <option value="">선택하세요</option>
            {adminTypes.map((adminType) => (
              <option key={adminType.adminTypeIndex} value={adminType.adminTypeIndex}>
                {adminType.adminTypeName}
              </option>
            ))}
          </select>
          ) : (
            <div style={{ marginBottom: '8px', color: '#7b5cff', fontWeight: 600 }}>
              {adminTypes.find(a => String(a.adminTypeIndex) === String(formData.adminTypeIndex))?.adminTypeName || '관리자 타입'}
            </div>
          )}
          {errors.adminTypeIndex && (
            <span className="error-message">{errors.adminTypeIndex}</span>
          )}
        </div>

        {!editingAuthority && (
          <div className="form-item">
            <label htmlFor="menuIndex">메뉴 *</label>
            <select
              id="menuIndex"
              name="menuIndex"
              value={selectedMenu}
              onChange={e => {
                console.log("메뉴 선택됨:", e.target.value);
                setSelectedMenu(e.target.value);
                setFormData(prev => ({ ...prev, programIndex: '' }));
                if (e.target.value) {
                  fetchPrograms(e.target.value);
                }
              }}
              className={errors.menuIndex ? 'error' : ''}
              disabled={!formData.adminTypeIndex}
            >
              <option value="">선택하세요</option>
              {Array.isArray(menus) && menus.map(menu => (
                <option key={menu.menuIndex} value={menu.menuIndex}>
                  {menu.menuName}
                </option>
              ))}
            </select>
            {errors.menuIndex && (
              <span className="error-message">{errors.menuIndex}</span>
            )}
          </div>
        )}

        {!editingAuthority ? (
        <div className="form-item">
          <label htmlFor="programIndex">프로그램 *</label>
          <select
            id="programIndex"
            name="programIndex"
              value={String(formData.programIndex)}
            onChange={handleChange}
            className={errors.programIndex ? 'error' : ''}
              disabled={!selectedMenu}
          >
            <option value="">선택하세요</option>
            {Array.isArray(programs) && programs
              .filter(program => {
                // 이미 권한이 있는 프로그램은 제외
                const hasAuthority = authorities.some(auth => 
                  String(auth.programIndex) === String(program.programIndex)
                );
                return !hasAuthority;
              })
              .map((program) => (
                <option key={program.programIndex} value={String(program.programIndex)}>
                  {program.programName}
                </option>
              ))}
          </select>
          {errors.programIndex && (
            <span className="error-message">{errors.programIndex}</span>
          )}
        </div>
        ) : (
          <div className="form-item">
            <label htmlFor="programIndex">프로그램 *</label>
            <div style={{ marginBottom: '8px', color: '#7b5cff', fontWeight: 600 }}>
              현재 프로그램: {editingAuthority.programName}
            </div>
          </div>
        )}
      </div>

      <div className="form-section">
        <h4>권한 설정</h4>
        <div className="permission-grid">
          <div className="permission-item">
            <label>
              <input
                type="checkbox"
                name="insertAuthority"
                checked={formData.insertAuthority === 1}
                onChange={handleChange}
              />
              추가 권한
            </label>
          </div>
          <div className="permission-item">
            <label>
              <input
                type="checkbox"
                name="deleteAuthority"
                checked={formData.deleteAuthority === 1}
                onChange={handleChange}
              />
              삭제 권한
            </label>
          </div>
          <div className="permission-item">
            <label>
              <input
                type="checkbox"
                name="updateAuthority"
                checked={formData.updateAuthority === 1}
                onChange={handleChange}
              />
              수정 권한
            </label>
          </div>
        </div>
      </div>

      {/* 수정 모드일 때만 사용자 정보 섹션 표시 */}
      {editingAuthority && (
        <div className="form-section">
          <h4>사용자 정보</h4>
          <div className="form-item">
            <label htmlFor="password">비밀번호 *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? 'error' : ''}
            />
            {errors.password && (
              <span className="error-message">{errors.password}</span>
            )}
          </div>
        </div>
      )}

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          취소
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? '처리중...' : (editingAuthority ? '수정' : '추가')}
        </button>
      </div>
    </form>
  );
};

export default AuthorityForm; 