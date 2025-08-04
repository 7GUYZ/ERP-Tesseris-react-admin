import React, { useState, useEffect } from 'react';
import { permissionApi } from '../../../api/auth/TaekjunAuth';
import '../../../styles/taekjun/AuthorityForm.css';

const AuthorityForm = ({ adminTypes, selectedAdminType, onSubmit, onCancel, loading }) => {
  const [menus, setMenus] = useState([]);
  const [menuPrograms, setMenuPrograms] = useState({});
  const [expandedMenus, setExpandedMenus] = useState({});
  const [selectedPrograms, setSelectedPrograms] = useState({});
  const [menuSelectStates, setMenuSelectStates] = useState({});
  const [existingAuthorities, setExistingAuthorities] = useState([]);

  // 메뉴 데이터 로드
  useEffect(() => {
    fetchMenus();
  }, []);

  // 관리자 타입이 변경될 때 기존 권한 조회
  useEffect(() => {
    if (selectedAdminType) {
      fetchExistingAuthorities(selectedAdminType);
    }
  }, [selectedAdminType]);

  // 권한 추가 후 기존 권한 목록 새로고침
  useEffect(() => {
    if (selectedAdminType) {
      fetchExistingAuthorities(selectedAdminType);
    }
  }, [selectedAdminType]);

  const fetchMenus = async () => {
    try {
      const response = await permissionApi.getMenu();
      const data = response.data || response;
      if (Array.isArray(data) && data.length > 0) {
        setMenus(data);
        // 처음에는 모든 메뉴가 접혀있음
        const collapsedState = {};
        data.forEach(menu => {
          collapsedState[menu.menuIndex] = false;
        });
        setExpandedMenus(collapsedState);
      }
        } catch (error) {
      console.error("메뉴 조회 실패:", error);
        }
  };

  // 기존 권한 조회
  const fetchExistingAuthorities = async (adminTypeIndex) => {
    try {
      const response = await permissionApi.getAuthorityProgramsByAdmin(adminTypeIndex);
      if (response.data) {
        setExistingAuthorities(response.data);
    } else {
        setExistingAuthorities([]);
      }
    } catch (error) {
      console.error('기존 권한 조회 실패:', error);
      setExistingAuthorities([]);
    }
  };

  // 메뉴 토글
  const handleMenuToggle = (menuIndex) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuIndex]: !prev[menuIndex]
    }));
  };

  // 메뉴별 프로그램 로드
  const fetchMenuPrograms = async (menuIndex) => {
    try {
      const response = await permissionApi.getProgram(menuIndex);
      const data = response.data || response;
      if (Array.isArray(data) && data.length > 0) {
        setMenuPrograms(prev => ({
          ...prev,
          [menuIndex]: data
        }));
      }
    } catch (error) {
      console.error("프로그램 조회 실패:", error);
    }
  };

  // 메뉴 클릭 시 프로그램 로드
  const handleMenuClick = async (menuIndex) => {
    if (!menuPrograms[menuIndex]) {
      await fetchMenuPrograms(menuIndex);
    }
    handleMenuToggle(menuIndex);
  };

  // 기존 권한이 없는 프로그램들만 필터링
  const getAvailablePrograms = (menuIndex) => {
    const programs = menuPrograms[menuIndex] || [];
    const existingProgramIds = existingAuthorities.map(auth => auth.programIndex);
    return programs.filter(program => !existingProgramIds.includes(program.programIndex));
  };

  // 메뉴별 전체 선택/해제
  const handleMenuSelectAll = (menuIndex, e) => {
    e.stopPropagation();
    const availablePrograms = getAvailablePrograms(menuIndex);
    const currentSelected = selectedPrograms[menuIndex] || [];
    
    if (currentSelected.length === availablePrograms.length) {
      // 모두 선택되어 있으면 해제
      setSelectedPrograms(prev => ({
        ...prev,
        [menuIndex]: []
      }));
      setMenuSelectStates(prev => ({
        ...prev,
        [menuIndex]: false
      }));
    } else {
      // 일부만 선택되어 있거나 모두 해제되어 있으면 전체 선택
      const allProgramIds = availablePrograms.map(prog => prog.programIndex);
      setSelectedPrograms(prev => ({
        ...prev,
        [menuIndex]: allProgramIds
      }));
      setMenuSelectStates(prev => ({
        ...prev,
        [menuIndex]: true
      }));
    }
  };

  // 개별 프로그램 선택/해제
  const handleProgramSelect = (menuIndex, programIndex, e) => {
    e.stopPropagation();
    const currentSelected = selectedPrograms[menuIndex] || [];
    
    if (currentSelected.includes(programIndex)) {
      // 선택 해제
      setSelectedPrograms(prev => ({
        ...prev,
        [menuIndex]: currentSelected.filter(id => id !== programIndex)
      }));
    } else {
      // 선택
      setSelectedPrograms(prev => ({
        ...prev,
        [menuIndex]: [...currentSelected, programIndex]
      }));
    }
  };
    
  // 메뉴의 전체 선택 상태 확인
  const isMenuAllSelected = (menuIndex) => {
    const availablePrograms = getAvailablePrograms(menuIndex);
    const currentSelected = selectedPrograms[menuIndex] || [];
    return availablePrograms.length > 0 && currentSelected.length === availablePrograms.length;
  };

  // 메뉴에 사용 가능한 프로그램이 있는지 확인
  const hasAvailablePrograms = (menuIndex) => {
    const availablePrograms = getAvailablePrograms(menuIndex);
    return availablePrograms.length > 0;
  };

  // 폼 제출
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedAdminType) {
      alert('관리자 타입을 선택해주세요.');
      return;
    }

    // 선택된 모든 프로그램 수집
    const allSelectedPrograms = [];
    Object.entries(selectedPrograms).forEach(([menuIndex, programIds]) => {
      programIds.forEach(programIndex => {
        allSelectedPrograms.push({
          adminTypeIndex: selectedAdminType,
          programIndex: programIndex
        });
      });
    });

    if (allSelectedPrograms.length === 0) {
      alert('추가할 권한을 선택해주세요.');
      return;
    }

    try {
      // 데이터를 임시 저장 (비밀번호 확인 모달에서 사용)
      window.lastBulkInsertData = { type: 'bulkInsert', authorities: allSelectedPrograms };
      
      // 모든 권한을 한 번에 추가
      await onSubmit({ type: 'bulkInsert', authorities: allSelectedPrograms });
      
      // 폼 초기화
      setSelectedPrograms({});
      setMenuSelectStates({});
      
      // 권한 추가 완료 후 기존 권한 목록 새로고침
      if (selectedAdminType) {
        await fetchExistingAuthorities(selectedAdminType);
      }
      
    } catch (error) {
      console.error('권한 추가 실패:', error);
    }
  };

  return (
    <div className="jtj-authority-form">
      <form onSubmit={handleSubmit}>
        <div className="jtj-authority-form-header">
          <h3>권한 추가</h3>
        </div>

        <div className="jtj-authority-form-content">
          <div className="jtj-authority-form-section">
            <label className="jtj-authority-form-label">관리자 타입</label>
            <select
              className="jtj-authority-form-select"
              value={selectedAdminType || ''}
              onChange={(e) => onSubmit({ type: 'setAdminType', value: e.target.value })}
              disabled={loading}
            >
              <option value="">관리자 타입을 선택하세요</option>
              {adminTypes && adminTypes.map((adminType) => (
                <option key={adminType.adminTypeIndex} value={adminType.adminTypeIndex}>
                  {adminType.adminTypeName}
                </option>
              ))}
            </select>
          </div>

          <div className="jtj-authority-form-section">
            <label className="jtj-authority-form-label">권한 선택</label>
            <div className="jtj-authority-menu-list">
              {menus.map((menu) => {
                // 해당 메뉴에 사용 가능한 프로그램이 있는지 확인
                const hasPrograms = hasAvailablePrograms(menu.menuIndex);
                
                return (
                  <div key={menu.menuIndex} className="jtj-authority-menu-group">
                    <div className="jtj-authority-menu-header">
                      <div className="jtj-authority-menu-header-left">
                        <span 
                          className="jtj-authority-menu-arrow"
                          onClick={() => handleMenuClick(menu.menuIndex)}
                        >
                          {expandedMenus[menu.menuIndex] ? '▼' : '▶'}
                        </span>
                        <span className="jtj-authority-menu-name">{menu.menuName}</span>
        </div>
                      <div className="jtj-authority-menu-header-right">
                        <label className="jtj-authority-menu-select-all">
              <input
                type="checkbox"
                            checked={isMenuAllSelected(menu.menuIndex)}
                            onChange={(e) => handleMenuSelectAll(menu.menuIndex, e)}
              />
                          <span>전체 선택</span>
            </label>
          </div>
                    </div>
                    
                    {expandedMenus[menu.menuIndex] && (
                      <div className="jtj-authority-menu-content">
                        <div className="jtj-authority-program-grid">
                          {getAvailablePrograms(menu.menuIndex).map((program) => (
                            <div key={program.programIndex} className="jtj-authority-program-item">
                              <label className="jtj-authority-program-checkbox">
              <input
                type="checkbox"
                                  checked={(selectedPrograms[menu.menuIndex] || []).includes(program.programIndex)}
                                  onChange={(e) => handleProgramSelect(menu.menuIndex, program.programIndex, e)}
              />
                                <span>{program.programName}</span>
            </label>
          </div>
                          ))}
                          {getAvailablePrograms(menu.menuIndex).length === 0 && (
                            <div className="jtj-authority-no-programs">
                              추가할 수 있는 권한이 없습니다.
          </div>
                          )}
        </div>
      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="jtj-authority-form-actions">
          <button 
            type="button" 
            className="jtj-authority-btn jtj-authority-btn-secondary"
            onClick={onCancel}
            disabled={loading}
          >
          취소
        </button>
          <button 
            type="submit" 
            className="jtj-authority-btn jtj-authority-btn-primary"
            disabled={loading}
          >
            {loading ? '추가 중...' : '권한 추가'}
        </button>
      </div>
    </form>
    </div>
  );
};

export default AuthorityForm; 