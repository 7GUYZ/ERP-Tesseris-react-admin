import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import AuthorityForm from '../../components/forms/taekjun/AuthorityForm.jsx';
import { permissionApi, adminTypeInsertApi } from '../../api/auth/TaekjunAuth';
import { refreshAuthority } from '../../utils/authorityUtils';
import usePermissionStore from '../../store/taekjun/PermissionStore';
import PermissionGuard from '../../components/common/PermissionGuard';
import '../../styles/taekjun/PermissionManagement.css';

const PermissionManagement = () => {
  const location = useLocation();
  const [adminTypes, setAdminTypes] = useState([]);
  const [menus, setMenus] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [authorities, setAuthorities] = useState([]);
  const [selectedAdminType, setSelectedAdminType] = useState('');
  const [selectedMenus, setSelectedMenus] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingAuthority, setEditingAuthority] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // 비밀번호 확인 모달 상태
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [pendingAction, setPendingAction] = useState(null);

  // userIndex를 localStorage에서 가져오기
  const getUserIndex = () => {
    // user_index 키에서 직접 가져오기
    const userIndexValue = localStorage.getItem('user_index');
    if (userIndexValue) {
      console.log('Found user_index in localStorage:', userIndexValue);
      return parseInt(userIndexValue);
    }
    
    // fallback: user-info에서 가져오기
    try {
      const userInfo = localStorage.getItem('user-info');
      if (userInfo) {
        const parsedUserInfo = JSON.parse(userInfo);
        console.log('user-info from localStorage:', parsedUserInfo);
        return parsedUserInfo.userIndex || parsedUserInfo.user_index || null;
      }
    } catch (error) {
      console.error('Error parsing user-info:', error);
    }
    
    // fallback: 다른 가능한 키들 확인
    const possibleKeys = ['userIndex', 'user', 'userId'];
    for (const key of possibleKeys) {
      const value = localStorage.getItem(key);
      if (value) {
        console.log(`Found userIndex in localStorage with key '${key}':`, value);
        return parseInt(value);
      }
    }
    console.log('No userIndex found in localStorage');
    return null;
  };
  
  const userIndex = getUserIndex();
  
  // 디버깅용 로그
  console.log('localStorage user_index:', localStorage.getItem('user_index'));
  console.log('parsed userIndex:', userIndex);
  
  // 권한 체크 훅 사용
  const { checkPermission, hasPermission } = usePermissionStore();
  
  // 현재 페이지가 권한 관리 페이지인지 확인하고 programIndex 결정
  const programIndex = location.pathname === '/PermissionManagement' ? 8 : null;
  
  // 한 번만 실행되도록 ref 사용
  const hasChecked = React.useRef(false);

  // 컴포넌트 마운트 시 권한 체크 (한 번만 실행)
  useEffect(() => {
    const performPermissionCheck = async () => {
      if (programIndex && !hasChecked.current) {
        hasChecked.current = true;
        try {
          await checkPermission(programIndex);
        } catch (error) {
          console.error('권한 체크 실패:', error);
        }
      }
    };
    
    performPermissionCheck();
  }, [checkPermission, programIndex]);

  // 데이터 조회
  useEffect(() => {
    fetchAdminTypes();
    fetchMenus();
  }, []);

  useEffect(() => {
    if (selectedMenus.length > 0) {
      selectedMenus.forEach(menuIndex => {
        if (!menuPrograms[menuIndex]) {
          fetchPrograms(menuIndex);
        }
      });
    }
  }, [selectedMenus]);

  const fetchAdminTypes = async () => {
    try {
      // adminTypeOrder 순서로 정렬된 관리자 타입 조회
      const response = await adminTypeInsertApi.getAdminTypesList();
      const data = response.data || response;
      if (Array.isArray(data) && data.length > 0) {
        setAdminTypes(data);
      } else {
        setAdminTypes([]);
      }
    } catch (error) {
      console.error("관리자 타입 조회 실패:", error);
      setAdminTypes([]);
    }
  };

  const fetchMenus = async (adminTypeIndex) => {
    try {
      const response = await permissionApi.getMenu();
      const data = response.data || response;
      if (Array.isArray(data) && data.length > 0) {
        setMenus(data);
      } else {
        setMenus([]);
      }
    } catch (error) {
      console.error("메뉴 조회 실패:", error);
      setMenus([]);
    }
  };

  const fetchPrograms = async (menuIndex) => {
    try {
      const response = await permissionApi.getProgram(menuIndex);
      const data = response.data || response;
      if (Array.isArray(data) && data.length > 0) {
        return data; // AuthorityForm에서 사용할 수 있도록 데이터 반환
      } else {
        return [];
      }
    } catch (error) {
      console.error("프로그램 조회 실패:", error);
      return [];
    }
  };

  const fetchAuthorities = useCallback(async (adminTypeIndex) => {
    try {
      const response = await permissionApi.getAuthorityProgramsByAdmin(adminTypeIndex);
      if (response.data) {
        setAuthorities(response.data);
      } else {
        setAuthorities([]);
      }
    } catch (error) {
      console.error('권한 목록 조회 실패:', error);
      setAuthorities([]);
    }
  }, [programs]);

  useEffect(() => {
    if (selectedAdminType) {
      fetchAuthorities(selectedAdminType);
    }
  }, [selectedAdminType, fetchAuthorities]);

  const insertAuthority = async (formData) => {
    setLoading(true);
    try {
      // 모든 권한을 1로 설정
      const authorityData = {
        adminTypeIndex: formData.adminTypeIndex,
        programIndex: formData.programIndex,
        insertAuthority: 1,
        deleteAuthority: 1,
        updateAuthority: 1
      };
      
      const response = await permissionApi.insertAuthority(authorityData);
      
      if (response.status === 200 || response.statusText === 'OK') {
        setSnackbar({ open: true, message: '권한이 성공적으로 추가되었습니다.', severity: 'success' });
        setShowForm(false);
        fetchAuthorities(selectedAdminType);
        
        // 권한 갱신 (현재 사용자와 관련된 경우)
        try {
          await refreshAuthority();
        } catch (error) {
          console.error("권한 갱신 실패:", error);
        }
      } else {
        setSnackbar({ open: true, message: '권한 추가에 실패했습니다.', severity: 'error' });
      }
    } catch (error) {
      console.error("추가 에러:", error);
      setSnackbar({ open: true, message: '권한 추가에 실패했습니다.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // 권한 일괄 추가
  const insertMultipleAuthorities = async (authoritiesList) => {
    setLoading(true);
    try {
      console.log('일괄 추가 시작:', authoritiesList);
      
      // 모든 권한을 1로 설정한 데이터 준비
      const authoritiesData = authoritiesList.map(authority => ({
        adminTypeIndex: authority.adminTypeIndex,
        programIndex: authority.programIndex,
        insertAuthority: 1,
        deleteAuthority: 1,
        updateAuthority: 1
      }));
      
      console.log('서버로 보낼 데이터:', {
        authorities: authoritiesData,
        userIndex: userIndex,
        password: password
      });
      
      // 일괄 추가 API 호출
      await permissionApi.bulkInsertAuthorities({
        authorities: authoritiesData,
        userIndex: userIndex,
        password: password
      });
      
      setSnackbar({ 
        open: true, 
        message: `${authoritiesData.length}개의 권한이 성공적으로 추가되었습니다.`, 
        severity: 'success' 
      });
      setShowForm(false);
      
      // 권한 목록 새로고침
      if (selectedAdminType) {
        await fetchAuthorities(selectedAdminType);
      }
      
      // 권한 갱신 (현재 사용자와 관련된 경우)
      try {
        await refreshAuthority();
      } catch (error) {
        console.error("권한 갱신 실패:", error);
      }
    } catch (error) {
      console.error("일괄 추가 에러:", error);
      console.error("에러 상세:", error.response?.data);
      setSnackbar({ open: true, message: '권한 추가에 실패했습니다.', severity: 'error' });
      
      // 실패 시 폼 상태 초기화
      setShowForm(false);
      
      // 권한 목록 새로고침하여 원래 상태 복원
      if (selectedAdminType) {
        await fetchAuthorities(selectedAdminType);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateAuthority = async (formData) => {
    setLoading(true);
    try {
      const response = await permissionApi.updateAuthority(formData);
      
      if (response.status === 200 || response.statusText === 'OK') {
        setSnackbar({ open: true, message: '권한이 성공적으로 업데이트되었습니다.', severity: 'success' });
        setShowForm(false);
        fetchAuthorities(selectedAdminType);
        
        // 권한 갱신 (현재 사용자와 관련된 경우)
        try {
          await refreshAuthority();
        } catch (error) {
          console.error("권한 갱신 실패:", error);
        }
      } else {
        setSnackbar({ open: true, message: '권한 업데이트에 실패했습니다.', severity: 'error' });
      }
    } catch (error) {
      console.error("수정 에러:", error);
      console.error("수정 에러 상세:", error.response?.data);
      setSnackbar({ open: true, message: '권한 업데이트에 실패했습니다.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const deleteAuthority = async (authorityTypeIndex) => {
    setLoading(true);
    try {
      const response = await permissionApi.deleteAuthority(authorityTypeIndex);
      
      if (response.status === 200 || response.statusText === 'OK') {
        setSnackbar({ open: true, message: '권한이 성공적으로 삭제되었습니다.', severity: 'success' });
        fetchAuthorities(selectedAdminType);
        
        // 권한 갱신 (현재 사용자와 관련된 경우)
        try {
          await refreshAuthority();
        } catch (error) {
          console.error("권한 갱신 실패:", error);
        }
      } else {
        setSnackbar({ open: true, message: '권한 삭제에 실패했습니다.', severity: 'error' });
      }
    } catch (error) {
      console.error("삭제 에러:", error);
      setSnackbar({ open: true, message: '권한 삭제에 실패했습니다.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // 권한 추가
  const handleAddAuthority = async () => {
    // 권한 체크
    if (hasPermission(programIndex, 'insert') !== 1) {
      alert('권한 추가 권한이 없습니다.');
      return;
    }

    // 권한 추가 시 메뉴 로드
    if (selectedAdminType && menus.length === 0) {
      await fetchMenus(selectedAdminType);
    }
    setEditingAuthority(null);
    setOpenDialog(true);
  };

  // 권한 수정 - 개별 권한 수정
  const handleEditAuthority = async (authority) => {
    // 권한 체크
    if (hasPermission(programIndex, 'update') !== 1) {
      alert('권한 수정 권한이 없습니다.');
      return;
    }

    setPendingAction('edit');
    setEditingAuthority(authority);
    setShowPasswordModal(true);
  };

  // 비밀번호 확인 후 권한 수정 처리
  const handlePasswordConfirm = async () => {
    if (!password) {
      alert('비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      if (pendingAction === 'save') {
        // 일괄 수정
        const authoritiesToUpdate = Object.values(authorityChanges).map(change => ({
          authorityTypeIndex: change.authorityTypeIndex,
          insertAuthority: change.insertAuthority,
          deleteAuthority: change.deleteAuthority,
          updateAuthority: change.updateAuthority
        }));

        console.log('보내는 데이터:', {
          authorities: authoritiesToUpdate,
          userIndex: userIndex,
          password: password
        });

        await permissionApi.bulkUpdateAuthorities({
          authorities: authoritiesToUpdate,
          userIndex: userIndex,
          password: password
        });

        setSnackbar({ 
          open: true, 
          message: `${authoritiesToUpdate.length}개의 권한이 성공적으로 수정되었습니다.`, 
          severity: 'success' 
        });

        // 변경사항 초기화
        setAuthorityChanges({});
        
        // 권한 목록 새로고침
        if (selectedAdminType) {
          await fetchAuthorities(selectedAdminType);
        }
      } else if (pendingAction === 'bulkInsert') {
        // 일괄 추가 - AuthorityForm에서 전달받은 데이터 사용
        const formData = window.lastBulkInsertData; // 임시 저장된 데이터 사용
        
        console.log('일괄 추가 데이터:', formData);
        
        await insertMultipleAuthorities(formData.authorities);
      }
    } catch (error) {
      console.error("권한 처리 에러:", error);
      setSnackbar({ open: true, message: '권한 처리에 실패했습니다.', severity: 'error' });
      
      // 실패 시 원래 상태로 되돌리기
      setAuthorityChanges({});
      
      // 권한 목록 새로고침하여 원래 상태 복원
      if (selectedAdminType) {
        await fetchAuthorities(selectedAdminType);
      }
    } finally {
      setLoading(false);
      setShowPasswordModal(false);
      setPassword('');
      setPendingAction(null);
    }
  };

  // 비밀번호 모달 닫기
  const handlePasswordCancel = () => {
    setShowPasswordModal(false);
    setPassword('');
    setPendingAction(null);
    setEditingAuthority(null);
  };

  // 개별 권한 삭제
  const handleDeleteAuthority = (authorityTypeIndex) => {
    // 권한 체크
    if (hasPermission(programIndex, 'delete') !== 1) {
      alert('권한 삭제 권한이 없습니다.');
      return;
    }

    if (window.confirm('이 권한을 삭제하시겠습니까?')) {
      deleteAuthority(authorityTypeIndex);
    }
  };

  // 권한 저장 (추가/수정)
  const handleSubmitAuthority = async (formData) => {
    try {
      setLoading(true);
      
      if (formData.type === 'setAdminType') {
        // 관리자 타입 설정
        setSelectedAdminType(formData.value);
        return;
      }
      
      if (formData.type === 'bulkInsert') {
        // 일괄 권한 추가 - 비밀번호 확인 필요
        if (hasPermission(programIndex, 'insert') !== 1) {
          alert('권한 추가 권한이 없습니다.');
          return;
        }
        
        // 비밀번호 확인 모달 표시
        setPendingAction('bulkInsert');
        setShowPasswordModal(true);
        return;
      }
      
      // 개별 권한 추가 (기존 방식)
      if (hasPermission(programIndex, 'insert') !== 1) {
        alert('권한 추가 권한이 없습니다.');
        return;
      }
      
      await insertAuthority(formData);
      
      setShowForm(false);
      setEditingAuthority(null);
      showSnackbar('권한이 성공적으로 저장되었습니다.', 'success');
      
      // 권한 목록 새로고침
      if (selectedAdminType) {
        await fetchAuthorities(selectedAdminType);
      }
    } catch (error) {
      console.error('권한 저장 실패:', error);
      showSnackbar('권한 저장에 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Snackbar 표시 함수
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // 메뉴별 프로그램 데이터 관리
  const [menuPrograms, setMenuPrograms] = useState({});

  // 메뉴 선택 시 해당 메뉴의 프로그램 목록 조회
  const handleMenuClick = async (menuIndex) => {
    try {
      if (selectedMenus.includes(menuIndex)) {
        // 이미 선택된 메뉴면 제거
        setSelectedMenus(prev => prev.filter(id => id !== menuIndex));
        return;
      }

      // 새로운 메뉴 추가
      setSelectedMenus(prev => [...prev, menuIndex]);
      
      // 해당 메뉴의 프로그램이 아직 로드되지 않았다면 로드
      if (!menuPrograms[menuIndex]) {
        const response = await permissionApi.getProgram(menuIndex);
        const programs = response.data || response;
        setMenuPrograms(prev => ({
          ...prev,
          [menuIndex]: programs
        }));
      }
    } catch (error) {
      console.error('프로그램 목록 조회 실패:', error);
    }
  };

  // 메뉴별 권한 목록 필터링
  const getMenuAuthorities = (menuIndex) => {
    const menuProgs = menuPrograms[menuIndex] || [];
    return authorities.filter(auth => 
      menuProgs.some(prog => prog.programIndex === auth.programIndex)
    );
  };

  // 선택된 권한 관리
  const [selectedAuthorities, setSelectedAuthorities] = useState([]);

  // 메뉴별 선택 상태 관리
  const [menuSelectStates, setMenuSelectStates] = useState({});

  // 권한 변경사항 추적
  const [authorityChanges, setAuthorityChanges] = useState({});

  // 개별 권한 체크박스 핸들러
  const handleAuthorityChange = (authorityTypeIndex, permissionType, checked) => {
    const authority = authorities.find(auth => auth.authorityTypeIndex === parseInt(authorityTypeIndex));
    if (!authority) return;

    const newValue = checked ? 1 : 0;
    const originalValue = authority[permissionType];
    
    setAuthorityChanges(prev => {
      const currentChanges = prev[authorityTypeIndex] || {};
      
      // 원래 값과 같으면 변경사항에서 제거
      if (newValue === originalValue) {
        const updatedChanges = { ...currentChanges };
        delete updatedChanges[permissionType];
        
        // 해당 권한의 모든 변경사항이 제거되면 전체에서도 제거
        if (Object.keys(updatedChanges).length === 0) {
          const newChanges = { ...prev };
          delete newChanges[authorityTypeIndex];
          return newChanges;
        }
        
        return {
          ...prev,
          [authorityTypeIndex]: updatedChanges
        };
      } else {
        // 값이 다르면 변경사항에 추가
        return {
          ...prev,
          [authorityTypeIndex]: {
            ...currentChanges,
            authorityTypeIndex: parseInt(authorityTypeIndex), // authorityTypeIndex 추가
            [permissionType]: newValue
          }
        };
      }
    });
  };

  // 권한 변경사항 저장 (일괄 수정)
  const handleSaveChanges = async () => {
    if (Object.keys(authorityChanges).length === 0) {
      alert('변경사항이 없습니다.');
      return;
    }

    // 권한 체크
    if (hasPermission(programIndex, 'update') !== 1) {
      alert('권한 수정 권한이 없습니다.');
      return;
    }

    setPendingAction('save');
    setShowPasswordModal(true);
  };

  // 메뉴별 전체 선택/해제 처리
  const handleMenuSelectAll = (menuIndex) => {
    const menuProgs = menuPrograms[menuIndex] || [];
    const menuAuths = authorities.filter(auth => 
      menuProgs.some(prog => prog.programIndex === auth.programIndex)
    );
    
    // 현재 메뉴의 모든 권한이 선택되어 있는지 확인
    const allSelected = menuAuths.every(auth => 
      selectedAuthorities.includes(auth.authorityTypeIndex)
    );

    if (allSelected) {
      // 모두 선택되어 있으면 해제
      setSelectedAuthorities(prev => 
        prev.filter(id => !menuAuths.some(auth => auth.authorityTypeIndex === id))
      );
      setMenuSelectStates(prev => ({...prev, [menuIndex]: false}));
    } else {
      // 일부만 선택되어 있거나 모두 해제되어 있으면 전체 선택
      const newAuthIds = menuAuths.map(auth => auth.authorityTypeIndex);
      setSelectedAuthorities(prev => {
        const filtered = prev.filter(id => 
          !menuAuths.some(auth => auth.authorityTypeIndex === id)
        );
        return [...filtered, ...newAuthIds];
      });
      setMenuSelectStates(prev => ({...prev, [menuIndex]: true}));
    }
  };

  // 메뉴의 전체 선택 상태 확인
  const isMenuAllSelected = (menuIndex) => {
    const menuProgs = menuPrograms[menuIndex] || [];
    const menuAuths = authorities.filter(auth => 
      menuProgs.some(prog => prog.programIndex === auth.programIndex)
    );
    
    return menuAuths.length > 0 && menuAuths.every(auth => 
      selectedAuthorities.includes(auth.authorityTypeIndex)
    );
  };

  // 개별 선택/해제 처리
  const handleSelectAuthority = (authorityTypeIndex) => {
    setSelectedAuthorities(prev => {
      if (prev.includes(authorityTypeIndex)) {
        return prev.filter(id => id !== authorityTypeIndex);
      } else {
        return [...prev, authorityTypeIndex];
      }
    });
  };

  // 선택된 권한 일괄 삭제
  const handleDeleteSelected = async () => {
    if (selectedAuthorities.length === 0) {
      alert('삭제할 권한을 선택해주세요.');
      return;
    }

    // 권한 체크
    if (hasPermission(programIndex, 'delete') !== 1) {
      alert('권한 삭제 권한이 없습니다.');
      return;
    }

    if (!window.confirm(`선택한 ${selectedAuthorities.length}개의 권한을 삭제하시겠습니까?`)) {
      return;
    }

    setLoading(true);
    try {
      await permissionApi.bulkDeleteAuthorities({
        authorityTypeIndexes: selectedAuthorities
      });
      
      setSnackbar({ 
        open: true, 
        message: `${selectedAuthorities.length}개의 권한이 성공적으로 삭제되었습니다.`, 
        severity: 'success' 
      });
      
      setSelectedAuthorities([]);
      
      // 권한 목록 새로고침
      if (selectedAdminType) {
        await fetchAuthorities(selectedAdminType);
      }
      
    } catch (error) {
      console.error("일괄 삭제 에러:", error);
      setSnackbar({ open: true, message: '권한 삭제에 실패했습니다.', severity: 'error' });
      
      // 실패 시 선택 상태 초기화
      setSelectedAuthorities([]);
      
      // 권한 목록 새로고침하여 원래 상태 복원
      if (selectedAdminType) {
        await fetchAuthorities(selectedAdminType);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="permission-management">
      <div className="permission-management-header">
        <h1>권한 관리</h1>
      </div>
      <div className="permission-divider"></div>

      {/* 필터 섹션 */}
      <div className="permission-filter-section">
        <div className="permission-filter-grid">
          {/* 관리자 타입 */}
          <div className="permission-filter-item">
            <label htmlFor="adminType">관리자 타입</label>
            <select
              id="adminType"
              value={selectedAdminType}
              onChange={(e) => {
                setSelectedAdminType(e.target.value);
                setSelectedMenus([]); // 메뉴, 프로그램 초기화
              }}
            >
              <option value="">선택하세요</option>
              {adminTypes && Array.isArray(adminTypes) ? adminTypes.map((adminType) => (
                <option key={adminType.adminTypeIndex} value={adminType.adminTypeIndex}>
                  {adminType.adminTypeName}
                </option>
              )) : null}
            </select>
          </div>

          {/* 프로그램 */}
        </div>
      </div>

      {/* 권한 목록 */}
      {selectedAdminType && !loading && (
        <div className="permission-authority-section">
          <div className="permission-section-header">
            <h2>권한 목록</h2>
            <div className="permission-header-actions">
              {Object.keys(authorityChanges).length > 0 && (
                <button 
                  className="permission-btn permission-btn-success"
                  onClick={handleSaveChanges}
                  disabled={loading}
                >
                  {loading ? '저장 중...' : `변경사항 저장 (${Object.keys(authorityChanges).length})`}
                </button>
              )}
              {selectedAuthorities.length > 0 && (
                <button 
                  className="permission-btn permission-btn-danger"
                  onClick={handleDeleteSelected}
                  disabled={loading}
                >
                  {loading ? '삭제 중...' : `선택한 권한 삭제 (${selectedAuthorities.length})`}
                </button>
              )}
              <button 
                className="permission-btn permission-btn-primary" 
                onClick={async () => await handleAddAuthority()}
              >
                권한 추가
              </button>
            </div>
          </div>

          <div className="permission-menu-list">
            {menus.map((menu) => {
              const menuAuthorities = getMenuAuthorities(menu.menuIndex);
              const isSelected = selectedMenus.includes(menu.menuIndex);

              return (
                <div key={menu.menuIndex} className="permission-menu-group">
                  <div className="permission-menu-header">
                    <div className="permission-menu-header-left">
                      <span 
                        className="permission-menu-arrow"
                        onClick={() => handleMenuClick(menu.menuIndex)}
                      >
                        {isSelected ? '▼' : '▶'}
                      </span>
                      <span className="permission-menu-name">{menu.menuName}</span>
                    </div>
                    <div className="permission-menu-header-right">
                      <label className="permission-menu-select-all">
                        <input
                          type="checkbox"
                          checked={isMenuAllSelected(menu.menuIndex)}
                          onChange={() => handleMenuSelectAll(menu.menuIndex)}
                        />
                        <span>전체 선택</span>
                      </label>
                    </div>
                  </div>
                  
                  {isSelected && (
                    <div className="permission-menu-content">
                      {menuAuthorities.length > 0 ? (
                        <table className="permission-authority-table">
                          <thead>
                            <tr>
                              <th className="text-center" style={{width: '40px'}}>
                                선택
                              </th>
                              <th>프로그램명</th>
                              <th>등록 권한</th>
                              <th>삭제 권한</th>
                              <th>수정 권한</th>
                            </tr>
                          </thead>
                          <tbody>
                            {menuAuthorities.map((authority, index) => (
                              <tr key={index}>
                                <td className="text-center">
                                  <input 
                                    type="checkbox"
                                    checked={selectedAuthorities.includes(authority.authorityTypeIndex)}
                                    onChange={() => handleSelectAuthority(authority.authorityTypeIndex)}
                                  />
                                </td>
                                <td>{authority.programName}</td>
                                <td className="text-center">
                                  <input 
                                    type="checkbox" 
                                    checked={authorityChanges[authority.authorityTypeIndex]?.insertAuthority !== undefined 
                                      ? authorityChanges[authority.authorityTypeIndex].insertAuthority === 1
                                      : authority.insertAuthority === 1
                                    } 
                                    onChange={(e) => handleAuthorityChange(authority.authorityTypeIndex, 'insertAuthority', e.target.checked)}
                                  />
                                </td>
                                <td className="text-center">
                                  <input 
                                    type="checkbox" 
                                    checked={authorityChanges[authority.authorityTypeIndex]?.deleteAuthority !== undefined 
                                      ? authorityChanges[authority.authorityTypeIndex].deleteAuthority === 1
                                      : authority.deleteAuthority === 1
                                    } 
                                    onChange={(e) => handleAuthorityChange(authority.authorityTypeIndex, 'deleteAuthority', e.target.checked)}
                                  />
                                </td>
                                <td className="text-center">
                                  <input 
                                    type="checkbox" 
                                    checked={authorityChanges[authority.authorityTypeIndex]?.updateAuthority !== undefined 
                                      ? authorityChanges[authority.authorityTypeIndex].updateAuthority === 1
                                      : authority.updateAuthority === 1
                                    } 
                                    onChange={(e) => handleAuthorityChange(authority.authorityTypeIndex, 'updateAuthority', e.target.checked)}
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="permission-no-data">
                          이 메뉴에 설정된 권한이 없습니다.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 권한 추가/수정 다이얼로그 */}
      {openDialog && (
        <div className="permission-modal-overlay">
          <div className="permission-modal">
            <div className="permission-modal-header">
              <h3>{editingAuthority ? '권한 수정' : '권한 추가'}</h3>
              <button className="permission-modal-close" onClick={() => setOpenDialog(false)}>×</button>
            </div>
            <div className="permission-admin-contents">
              <AuthorityForm
                adminTypes={adminTypes}
                selectedAdminType={selectedAdminType}
                onSubmit={handleSubmitAuthority}
                onCancel={() => setOpenDialog(false)}
                loading={loading}
              />
            </div>
          </div>
        </div>
      )}

      {/* 비밀번호 확인 모달 */}
      {showPasswordModal && (
        <div className="permission-modal-overlay">
          <div className="permission-modal permission-modal-small">
            <div className="permission-modal-header">
              <h3>비밀번호 확인</h3>
              <button className="permission-modal-close" onClick={handlePasswordCancel}>×</button>
            </div>
            <div className="permission-modal-content">
              <p>
                {pendingAction === 'edit' 
                  ? '권한을 수정하기 위해 비밀번호를 입력해주세요.'
                  : '변경사항을 저장하기 위해 비밀번호를 입력해주세요.'
                }
              </p>
              <div className="permission-form-group">
                <label htmlFor="password">비밀번호</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handlePasswordConfirm();
                    }
                  }}
                />
              </div>
              <div className="permission-modal-actions">
                <button 
                  className="permission-btn permission-btn-secondary" 
                  onClick={handlePasswordCancel}
                >
                  취소
                </button>
                <button 
                  className="permission-btn permission-btn-primary" 
                  onClick={handlePasswordConfirm}
                  disabled={loading}
                >
                  {loading ? '확인 중...' : '확인'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 알림 */}
      {snackbar.open && (
        <div className={`permission-snackbar permission-snackbar-${snackbar.severity}`}>
          <span>{snackbar.message}</span>
          <button className="permission-snackbar-close" onClick={closeSnackbar}>×</button>
        </div>
      )}
    </div>
  );
};

export default PermissionManagement; 