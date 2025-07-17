import React, { useState, useEffect, useCallback } from 'react';
import AuthorityForm from '../../components/forms/taekjun/AuthorityForm.jsx';
import { permissionApi } from '../../services/api';
import '../../css/PermissionManagement.css';

const PermissionManagement = () => {
  const [selectedAdminType, setSelectedAdminType] = useState('');
  const [selectedMenu, setSelectedMenu] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAuthority, setEditingAuthority] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  const [adminTypes, setAdminTypes] = useState([]);
  const [menus, setMenus] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [authorities, setAuthorities] = useState([]);
  const [loading, setLoading] = useState(false);

  // API 연결 테스트
  const testApiConnection = async () => {
    try {
      await fetch('http://192.168.0.23:8080/admin/permissionsettings/getadmintype');
      // 사용하지 않는 data, errorText 삭제
    } catch (error) {
    }
  };

  // 컴포넌트 마운트 시 API 테스트
  useEffect(() => {
    testApiConnection();
  }, []);

  // 데이터 조회
  useEffect(() => {
    fetchAdminTypes();
    fetchMenus();
  }, []);

  useEffect(() => {
    if (selectedMenu) {
      fetchPrograms(selectedMenu);
    }
  }, [selectedMenu]);

  const fetchAdminTypes = async () => {
    try {
      const data = await permissionApi.getAdminType();
      if (data.length > 0) {
      }
      setAdminTypes(data);
    } catch (error) {
    }
  };

  const fetchMenus = async () => {
    try {
      const data = await permissionApi.getMenu();
      if (data.length > 0) {
      }
      setMenus(data);
    } catch (error) {
    }
  };

  const fetchPrograms = async (menuIndex) => {
    try {
      const data = await permissionApi.getProgram(menuIndex);
      if (data.length > 0) {
      }
      setPrograms(data);
    } catch (error) {
    }
  };

  const fetchAuthorities = useCallback(async (adminTypeIndex) => {
    try {
      const data = await permissionApi.getAuthorityProgramsByAdmin(adminTypeIndex);
      // programIndex로만 menuIndex를 programs에서 찾아서 추가
      const authoritiesWithMenuIndex = data.map(auth => {
        const matchedProgram = programs.find(p => String(p.programIndex) === String(auth.programIndex));
        return {
          ...auth,
          menuIndex: matchedProgram ? matchedProgram.menuIndex : undefined,
        };
      });
      setAuthorities(authoritiesWithMenuIndex);
    } catch (error) {
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
      
      if (response.ok) {
        await response.text(); // 응답만 소비
        setSnackbar({ open: true, message: '권한이 성공적으로 추가되었습니다.', severity: 'success' });
        setOpenDialog(false);
        fetchAuthorities(selectedAdminType);
      } else {
        await response.text(); // 응답만 소비
        setSnackbar({ open: true, message: '권한 추가에 실패했습니다.', severity: 'error' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: '권한 추가에 실패했습니다.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const updateAuthority = async (formData) => {
    setLoading(true);
    try {
      const response = await permissionApi.updateAuthority(formData);
      
      if (response.ok) {
        await response.text();
        setSnackbar({ open: true, message: '권한이 성공적으로 업데이트되었습니다.', severity: 'success' });
        setOpenDialog(false);
        fetchAuthorities(selectedAdminType);
      } else {
        await response.text();
        setSnackbar({ open: true, message: '권한 업데이트에 실패했습니다.', severity: 'error' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: '권한 업데이트에 실패했습니다.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const deleteAuthority = async (authorityTypeIndex) => {
    setLoading(true);
    try {
      const response = await permissionApi.deleteAuthority(authorityTypeIndex);
      
      if (response.ok) {
        await response.text();
        setSnackbar({ open: true, message: '권한이 성공적으로 삭제되었습니다.', severity: 'success' });
        fetchAuthorities(selectedAdminType);
      } else {
        await response.text();
        setSnackbar({ open: true, message: '권한 삭제에 실패했습니다.', severity: 'error' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: '권한 삭제에 실패했습니다.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAuthority = () => {
    setEditingAuthority(null);
    setOpenDialog(true);
  };

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

  const handleDeleteAuthority = (authorityTypeIndex) => {
    if (window.confirm('정말로 이 권한을 삭제하시겠습니까?')) {
      deleteAuthority(authorityTypeIndex);
    }
  };

  const handleSubmitAuthority = (formData) => {
    if (editingAuthority) {
      // 수정: 모든 필드 전송
      updateAuthority(formData);
    } else {
      // 추가: userIndex, password 제외하고 전송
      const { userIndex, password, ...insertData } = formData;
      insertAuthority(insertData);
    }
  };

  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <div className="permission-management">
      <h1 className="page-title">권한 관리</h1>

      {/* 필터 섹션 */}
      <div className="filter-section">
        <div className="filter-grid">
          {/* 관리자 타입 */}
          <div className="filter-item">
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
              {adminTypes.map((adminType) => (
                <option key={adminType.adminTypeIndex} value={adminType.adminTypeIndex}>
                  {adminType.adminTypeName}
                </option>
              ))}
            </select>
          </div>

          {/* 프로그램 */}
        </div>
      </div>

      {/* 권한 목록 */}
      {selectedAdminType && (
        <div className="authority-section">
          <div className="section-header">
            <h2>권한 목록</h2>
            <button className="btn btn-primary" onClick={handleAddAuthority}>
              권한 추가
            </button>
          </div>

          <div className="table-container">
            <table className="authority-table">
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
                        className="btn btn-small btn-secondary"
                        onClick={() => handleEditAuthority(authority)}
                      >
                        수정
                      </button>
                      <button 
                        className="btn btn-small btn-danger"                
                        onClick={() => handleDeleteAuthority(authority.authorityTypeIndex)}
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
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingAuthority ? '권한 수정' : '권한 추가'}</h3>
              <button className="modal-close" onClick={() => setOpenDialog(false)}>×</button>
            </div>
            <div className="modal-content">
              <AuthorityForm
                adminTypes={adminTypes}
                menus={menus}
                programs={programs}
                editingAuthority={editingAuthority}
                onSubmit={handleSubmitAuthority}
                onCancel={() => setOpenDialog(false)}
                loading={loading}
                selectedAdminType={selectedAdminType}
                selectedMenu={selectedMenu}
                setSelectedMenu={setSelectedMenu}
                fetchPrograms={fetchPrograms}
                isAddMode={!editingAuthority}
                authorities={authorities}
              />
            </div>
          </div>
        </div>
      )}

      {/* 알림 */}
      {snackbar.open && (
        <div className={`snackbar snackbar-${snackbar.severity}`}>
          <span>{snackbar.message}</span>
          <button className="snackbar-close" onClick={closeSnackbar}>×</button>
        </div>
      )}
    </div>
  );
};

export default PermissionManagement; 