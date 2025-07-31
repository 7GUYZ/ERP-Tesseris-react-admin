import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import AuthorityForm from '../../components/forms/taekjun/AuthorityForm.jsx';
import { permissionApi, permissionCheckApi } from '../../api/auth/TaekjunAuth';
import { refreshAuthority } from '../../utils/authorityUtils';


import '../../styles/taekjun/PermissionManagement.css';

const PermissionManagement = () => {
  const location = useLocation();
  

  
  const [adminTypes, setAdminTypes] = useState([]);
  const [menus, setMenus] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [authorities, setAuthorities] = useState([]);
  const [selectedAdminType, setSelectedAdminType] = useState('');
  const [selectedMenu, setSelectedMenu] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingAuthority, setEditingAuthority] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [buttonPermissions, setButtonPermissions] = useState({
    canInsert: false,
    canUpdate: false,
    canDelete: false
  });



  // 데이터 조회
  useEffect(() => {
    fetchAdminTypes();
    fetchMenus();
  }, []);

  // 페이지 로드 시 권한 체크 - 한 번의 API 호출로 모든 권한 체크
  useEffect(() => {
    const initializePermissions = async () => {
      try {
        const response = await permissionCheckApi.checkPermission(8); // programIndex: 8 (권한 관리)
        
        if (response.data) {
          setButtonPermissions({
            canInsert: response.data.hasInsertAuthority === 1,
            canUpdate: response.data.hasUpdateAuthority === 1,
            canDelete: response.data.hasDeleteAuthority === 1
          });
          
          console.log('권한 관리 버튼 권한 체크 결과:', response.data);
        }
      } catch (error) {
        console.error('권한 체크 실패:', error);
        setButtonPermissions({
          canInsert: false,
          canUpdate: false,
          canDelete: false
        });
      }
    };
    
    initializePermissions();
  }, []);

  useEffect(() => {
    if (selectedMenu) {
      fetchPrograms(selectedMenu);
    }
  }, [selectedMenu]);

  const fetchAdminTypes = async () => {
    try {
      const response = await permissionApi.getAdminType();
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
      console.log("메뉴 조회 시작, adminTypeIndex:", adminTypeIndex);
      const response = await permissionApi.getMenu();
      const data = response.data || response;
      console.log("메뉴 데이터:", data);
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
      console.log("프로그램 조회 시작, menuIndex:", menuIndex);
      const response = await permissionApi.getProgram(menuIndex);
      console.log("프로그램 API 응답:", response);
      const data = response.data || response;
      console.log("프로그램 데이터:", data);
      if (Array.isArray(data) && data.length > 0) {
        setPrograms(data);
        console.log("프로그램 설정 완료:", data);
      } else {
        console.log("프로그램 데이터가 비어있음");
        setPrograms([]);
      }
    } catch (error) {
      console.error("프로그램 조회 실패:", error);
      setPrograms([]);
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
      const response = await permissionApi.insertAuthority(formData);
      console.log("추가 응답:", response);
      
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

  const updateAuthority = async (formData) => {
    setLoading(true);
    try {
      const response = await permissionApi.updateAuthority(formData);
      console.log("수정 응답:", response);
      
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
      setSnackbar({ open: true, message: '권한 업데이트에 실패했습니다.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const deleteAuthority = async (authorityTypeIndex) => {
    setLoading(true);
    try {
      const response = await permissionApi.deleteAuthority(authorityTypeIndex);
      console.log("삭제 응답:", response);
      
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
  const handleAddAuthority = () => {
    setEditingAuthority(null);
    setOpenDialog(true);
  };

  // 권한 수정
  const handleEditAuthority = async (authority) => {
    let menuIndex = authority.menuIndex;
    // programs가 비어 있거나 menuIndex가 없으면 추정해서 fetch
    if (!menuIndex) {
      if (selectedMenu) {
        menuIndex = selectedMenu;
      } else if (menus.length > 0) {
        menuIndex = menus[0].menuIndex;
      }
      if (menuIndex) {
        await fetchPrograms(menuIndex);
        authority.menuIndex = menuIndex;
      }
    } else if (!programs || programs.length === 0 || !programs.find(p => String(p.programIndex) === String(authority.programIndex))) {
      await fetchPrograms(menuIndex);
    }
    setEditingAuthority(authority);
    setOpenDialog(true);
  };

  // 권한 삭제
  const handleDeleteAuthority = (authorityTypeIndex) => {
    // 권한 체크
    if (!buttonPermissions.canDelete) {
      alert('권한 삭제 권한이 없습니다.');
      return;
    }

    if (window.confirm('정말로 이 권한을 삭제하시겠습니까?')) {
      deleteAuthority(authorityTypeIndex);
    }
  };

  // 권한 저장 (추가/수정)
  const handleSubmitAuthority = async (formData) => {
    try {
      setLoading(true);
      
      if (editingAuthority) {
        // 수정
        if (!buttonPermissions.canUpdate) {
          alert('권한 수정 권한이 없습니다.');
          return;
        }
        await updateAuthority(formData);
      } else {
        // 추가
        if (!buttonPermissions.canInsert) {
          alert('권한 추가 권한이 없습니다.');
          return;
        }
        await insertAuthority(formData);
      }
      
      setOpenDialog(false);
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
                setSelectedMenu(''); // 메뉴, 프로그램 초기화
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
      {selectedAdminType && (
        <div className="permission-authority-section">
          <div className="permission-section-header">
            <h2>권한 목록</h2>
            <button 
              className="permission-btn permission-btn-primary" 
              onClick={() => {
                if (!buttonPermissions.canInsert) {
                  alert('권한이 없습니다.');
                  return;
                }
                handleAddAuthority();
              }}
            >
              권한 추가
            </button>
          </div>

          <div className="permission-table-container">
            <table className="permission-authority-table">
              <thead>
                <tr>
                  <th>프로그램명</th>
                  <th>추가 권한</th>
                  <th>삭제 권한</th>
                  <th>수정 권한</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {authorities.map((authority, index) => (
                  <tr key={index}>
                    <td>{authority.programName}</td>
                    <td className="text-center">
                      <input type="checkbox" checked={authority.insertAuthority === 1} disabled />
                    </td>
                    <td className="text-center">
                      <input type="checkbox" checked={authority.deleteAuthority === 1} disabled />
                    </td>
                    <td className="text-center">
                      <input type="checkbox" checked={authority.updateAuthority} disabled />
                    </td>
                    <td className="text-center">
                      <button 
                        className="permission-btn permission-btn-small permission-btn-secondary"
                        onClick={() => {
                          if (!buttonPermissions.canUpdate) {
                            alert('권한이 없습니다.');
                            return;
                          }
                          handleEditAuthority(authority);
                        }}
                      >
                        수정
                      </button>
                      <button 
                        className="permission-btn permission-btn-small permission-btn-danger"                
                        onClick={() => {
                          if (!buttonPermissions.canDelete) {
                            alert('권한이 없습니다.');
                            return;
                          }
                          handleDeleteAuthority(authority.authorityTypeIndex);
                        }}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                menus={menus}
                programs={programs}
                editingAuthority={editingAuthority}
                onSubmit={handleSubmitAuthority}
                onCancel={() => setOpenDialog(false)}
                loading={loading}
                fetchMenus={fetchMenus}
                fetchPrograms={fetchPrograms}
                selectedAdminType={selectedAdminType}
                setSelectedAdminType={setSelectedAdminType}
                selectedMenu={selectedMenu}
                setSelectedMenu={setSelectedMenu}
                authorities={authorities}
              />
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