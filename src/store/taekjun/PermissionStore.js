import { create } from 'zustand';

const usePermissionStore = create((set, get) => ({
  permissions: [],
  currentPermission: null,
  
  setPermissions: (permissions) => set({ permissions }),
  
  setCurrentPermission: (permission) => set({ currentPermission: permission }),
  
  hasPermission: (menuIndex, programIndex) => {
    const { permissions } = get();
    return permissions.some(
      (perm) => perm.menuIndex === menuIndex && perm.programIndex === programIndex
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