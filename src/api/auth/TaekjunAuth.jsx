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

// 어드민 마이페이지 API
export const adminMyPageApi = {
  // 마이페이지 정보 조회
  getMyPageInfo: (userIndex) => api.get(`admin/mypage/getmypage`, { params: { userIndex } }),

  // 마이페이지 정보 수정
  updateMyPageInfo: (userIndex, data) => api.post(`admin/mypage/changemyinpo`, data, { params: { userIndex } }),

  // 비밀번호 변경
  changePassword: (userIndex, passwordData) => api.post(`admin/mypage/changepassword`, passwordData, { params: { userIndex } })
}; 

// 대시보드 통계 조회
export const dashboardApi = {
  getStatistics: () => api.get('dashboard/statistics'),
  getCmStatistics: () => api.get('dashboard/cm-statistics'),
  getCommissionStatistics: () => api.get('dashboard/commission-statistics'),
  getStoreStatistics: () => api.get('dashboard/store-statistics'),
};

// 회원 리스트 API
export const userListApi = {
  getUserList: () => api.get('user-admin-list'),
  searchUserList: (searchData) => api.post('user-admin-list/search', searchData),
  updateUser: (userIndex, updateData, adminUserIndex) => api.put(`user-admin-list/update/${userIndex}?adminUserIndex=${adminUserIndex}`, updateData),
  
  // 회원 목록 엑셀 다운로드
  downloadUserList: (searchData) => api.post('user-admin-list/download', searchData, { responseType: 'blob' })
}; 

// 권한 체크 API
export const permissionCheckApi = {
  // 특정 권한 체크 (로컬스토리지의 user-info에서 admin_type_index 사용)
  checkPermission: async (programIndex, permissionType) => {
    const userInfo = localStorage.getItem('user-info');
    const userData = userInfo ? JSON.parse(userInfo) : null;
    const adminTypeIndex = userData?.admin_type_index;
    
    console.log('API 호출 - user-info:', userInfo);
    console.log('API 호출 - admin_type_index:', adminTypeIndex);
    console.log('API 호출 - programIndex:', programIndex);
    console.log('API 호출 - permissionType:', permissionType);
    
    return await api.post(`checkpermission`, {
      adminTypeIndex: parseInt(adminTypeIndex),
      programIndex: parseInt(programIndex)
    });
  },

  // 현재 사용자의 모든 권한 조회 (로컬스토리지의 user-info에서 admin_type_index 사용)
  getUserPermissions: async () => {
    const userInfo = localStorage.getItem('user-info');
    const userData = userInfo ? JSON.parse(userInfo) : null;
    const adminTypeIndex = userData?.admin_type_index;
    
    console.log('getUserPermissions API 호출 - user-info:', userInfo);
    console.log('getUserPermissions API 호출 - admin_type_index:', adminTypeIndex);
    
    return await api.post(`checkpermission`, {
      adminTypeIndex: parseInt(adminTypeIndex),
      programIndex: 1 // 기본값, 필요시 수정
    });
  }
}; 

// 사업자 목록 API
export const businessmanListApi = {
  // 사업자 목록 검색
  searchBusinessmanList: (searchData) => api.post('businessmanlist/search', searchData),
  
  // 전체 활성 사업자 목록 조회
  getAllActiveBusinessmen: () => api.get('businessmanlist/all'),
  
  // 전체 사업자 목록 조회 (모든 조건 제거)
  getAllBusinessmen: () => api.get('businessmanlist/all-businessmen'),
  
  // 사업자 등급 목록 조회
  getBusinessGrades: () => api.get('businessmanlist/business-grades'),
  
  // 사업자 지역 목록 조회
  getBusinessAreas: () => api.get('businessmanlist/business-areas'),
  
  // 사업자 등록
  createBusinessman: (createData) => api.post('businessmanlist/create', createData),
  
  // 사업자 정보 수정
  updateBusinessman: (updateData) => api.put('businessmanlist/update', updateData),
  
  // 사업자 삭제
  deleteBusinessman: (deleteData) => api.delete('businessmanlist/delete', { data: deleteData }),
  
  // 사업자 비활성화
  deactivateBusinessman: (userIndex) => api.put(`businessmanlist/deactivate/${userIndex}`),
  
  // 사업자 상세 정보 조회
  getBusinessmanDetail: (userIndex) => api.get(`businessmanlist/detail/${userIndex}`),
  
  // 사업자 목록 엑셀 다운로드
  downloadBusinessmanList: (searchData) => api.post('businessmanlist/download', searchData, { responseType: 'blob' })
}; 