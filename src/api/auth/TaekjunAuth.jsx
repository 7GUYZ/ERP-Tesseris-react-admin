import { api } from "../Http";

// 권한 관리 API
export const permissionApi = {
  // 관리자 타입 조회
  getAdminType: () => api.get("admin/permissionsettings/getadmintype"),

  // 메뉴 조회
  getMenu: () => api.get("admin/permissionsettings/getmenu"),

  // 프로그램 조회
  getProgram: (menuIndex) => api.get(`admin/permissionsettings/getprogram`, { params: { menuIndex } }),

  // 관리자별 권한 프로그램 조회
  getAuthorityProgramsByAdmin: (adminTypeIndex) => api.get(`admin/permissionsettings/authorityprogramsbyadmin`,{params: {adminTypeIndex}}),

  // 권한 추가
  insertAuthority: (data) => api.post("admin/permissionsettings/insertauthority", data),

  // 권한 수정
  updateAuthority: (data) => api.put("/admin/permissionsettings/updateauthority", data),

  // 권한 삭제
  deleteAuthority: (authorityTypeIndex) => api.post(`/admin/permissionsettings/deleteauthority`, { authorityTypeIndex })
}; 