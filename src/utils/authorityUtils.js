import { menuAuthority } from "../api/auth/JungeunAuth";

/**
 * 권한 정보를 새로고침하는 함수
 * 권한 관리자가 권한을 변경했을 때 호출
 */
export const refreshAuthority = async () => {
  const userInfo = JSON.parse(localStorage.getItem("user-info"));
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