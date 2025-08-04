import { create } from 'zustand';
import { permissionCheckApi } from '../../api/auth/TaekjunAuth';

const usePermissionStore = create((set, get) => ({
  permissions: [],
  currentPermission: null,
  
  setPermissions: (permissions) => set({ permissions }),
  
  setCurrentPermission: (permission) => set({ currentPermission: permission }),
  
  // 권한 체크 함수
  checkPermission: async (programIndex, action = null) => {
    try {
      const response = await permissionCheckApi.checkPermission(programIndex, action);
      if (response.data) {
        const permission = response.data;
        set({ currentPermission: permission });
        return permission;
      }
      return null;
    } catch (error) {
      console.error('권한 체크 실패:', error);
      return null;
    }
  },

  hasPermission: (programIndex, permissionType) => {
    const { currentPermission, permissions } = get();
    
    // currentPermission이 있으면 사용
    if (currentPermission) {
      switch (permissionType) {
        case 'insert':
          return currentPermission.hasInsertAuthority;
        case 'update':
          return currentPermission.hasUpdateAuthority;
        case 'delete':
          return currentPermission.hasDeleteAuthority;
        default:
          return 1; // 기본적으로 조회 권한은 있다고 가정
      }
    }
    
    // 기존 로직 유지 (하위 호환성)
    return permissions.some(
      (perm) => perm.programIndex === programIndex
    );
  },
  
  getPermissionByPath: (path) => {
    const { permissions } = get();
    // 경로에 따른 권한 매핑 로직
    return permissions.find(perm => perm.path === path);
  },
  
  clearPermissions: () => set({ permissions: [], currentPermission: null }),
}));

export default usePermissionStore; 