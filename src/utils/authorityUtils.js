import { menuAuthority } from "../api/auth/JungeunAuth";
import { permissionCheckApi } from "../api/auth/TaekjunAuth";

/**
 * 권한 정보를 새로고침하는 함수
 * 권한 관리자가 권한을 변경했을 때 호출
 */
export const refreshAuthority = async () => {
  const userInfo = JSON.parse(localStorage.getItem("admin-info"));
  if (userInfo?.admin_type_index) {
    try {
      const response = await menuAuthority(userInfo.admin_type_index);
      if (response.data.resultCode === 200) {
        localStorage.setItem("user-authority", JSON.stringify(response.data.data));
        console.log("권한 갱신 성공:", response.data.data);
        
        // 전역 이벤트 발생으로 다른 컴포넌트에 알림
        window.dispatchEvent(new CustomEvent("authority-updated", {
          detail: { authorityList: response.data.data }
        }));
        
        return response.data.data;
      }
    } catch (error) {
      console.error("권한 갱신 실패:", error);
      throw error;
    }
  }
  return null;
};

/**
 * 현재 사용자의 권한 정보를 가져오는 함수
 */
export const getCurrentAuthority = () => {
  const storedAuthority = localStorage.getItem("user-authority");
  return storedAuthority ? JSON.parse(storedAuthority) : null;
};

/**
 * 특정 메뉴/프로그램에 대한 권한을 확인하는 함수
 */
export const hasPermission = (menuIndex, programIndex) => {
  const authorityList = getCurrentAuthority();
  if (!authorityList) return false;
  
  return authorityList.some(auth => 
    auth.menuIndex === menuIndex && auth.programIndex === programIndex
  );
};

/**
 * 권한 캐시를 클리어하는 함수
 */
export const clearAuthorityCache = () => {
  localStorage.removeItem("user-authority");
  console.log("권한 캐시 클리어됨");
};

// ===== 새로운 권한 컨텍스트 관리 기능 =====

/**
 * 현재 권한 컨텍스트 설정 (메뉴 클릭 시 호출)
 */
export const setCurrentPermissionContext = (menuIndex, programIndex, pathname) => {
  const context = {
    menuIndex,
    programIndex,
    pathname,
    timestamp: Date.now()
  };
  sessionStorage.setItem('current-permission-context', JSON.stringify(context));
  console.log('권한 컨텍스트 설정:', context);
};

/**
 * 현재 권한 컨텍스트 가져오기
 */
export const getCurrentPermissionContext = () => {
  const context = sessionStorage.getItem('current-permission-context');
  return context ? JSON.parse(context) : null;
};

/**
 * checkpermission API를 사용한 상세 권한 체크
 */
export const checkDetailedPermission = async (programIndex) => {
  try {
    const response = await permissionCheckApi.checkPermission(programIndex);
    if (response.data) {
      return {
        hasInsert: response.data.hasInsertAuthority === 1,
        hasUpdate: response.data.hasUpdateAuthority === 1,
        hasDelete: response.data.hasDeleteAuthority === 1
      };
    }
    return { hasInsert: false, hasUpdate: false, hasDelete: false };
  } catch (error) {
    console.error('상세 권한 체크 실패:', error);
    return { hasInsert: false, hasUpdate: false, hasDelete: false };
  }
};

/**
 * 현재 컨텍스트 기반으로 버튼 권한 체크
 */
export const checkButtonPermission = async (action) => {
  const context = getCurrentPermissionContext();
  if (!context) return false;
  
  const permissions = await checkDetailedPermission(context.programIndex);
  
  switch (action) {
    case 'add':
    case 'insert':
      return permissions.hasInsert;
    case 'edit':
    case 'update':
      return permissions.hasUpdate;
    case 'delete':
      return permissions.hasDelete;
    default:
      return false;
  }
};

/**
 * 권한 컨텍스트 유효성 검사 (디테일 페이지에서 사용)
 */
export const validatePermissionContext = async () => {
  const context = getCurrentPermissionContext();
  if (!context) return false;
  
  // 컨텍스트가 30분 이상 지났으면 무효화
  const now = Date.now();
  const contextAge = now - context.timestamp;
  const maxAge = 30 * 60 * 1000; // 30분
  
  if (contextAge > maxAge) {
    console.log('권한 컨텍스트 만료됨');
    sessionStorage.removeItem('current-permission-context');
    return false;
  }
  
  // 현재 권한이 유효한지 확인
  const permissions = await checkDetailedPermission(context.programIndex);
  return permissions.hasInsert || permissions.hasUpdate || permissions.hasDelete;
}; 