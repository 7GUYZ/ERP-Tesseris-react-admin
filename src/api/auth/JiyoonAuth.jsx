import { api } from "../Http";

//공지사항
export const noticeInsert = (notice) => api.post("/notice/insert", notice);
export const noticeDetail = (notice_idx) =>
  api.get(`/notice/detail/${notice_idx}`);
export const noticeList = () => api.get("/notice/list");
export const noticeUpdate = (notice) => api.post(`/notice/update`, notice);
export const noticeDelete = (data) => api.post(`/notice/delete`, data);

//중개 수수료 설정
export const getCommissionSetting = () =>
  api.get("/commission-setting/business-grades");
export const setCommissionSetting = (data) =>
  api.post("/commission-setting/business-grades-update", data);
export const pwCheck = (password) =>
  api.post("/commission-setting/pwCheck", { password });

//업데이트 로그 설정
export const getUpdateLog = (params) =>
  api.get("/update-log/search", { params });

// CMS 접속 로그 검색
export const searchCmsAccessLogs = (searchData) =>
  api.get("/cms-access-log/search", { params: searchData });

// 관리자 타입 목록 조회
export const getAdminTypes = () => api.get("/cms-access-log/admin-types");

// 알림 내역 조회 (메인 서버를 통해 알림 백엔드 호출)
export const getMyAlarmHistory = (userIndex) => 
  api.get(`/alarm-history/user/${userIndex}`);

// 알림 읽음 처리 (메인 서버를 통해 알림 백엔드 호출)
export const markAsRead = (alarmId) => 
  api.post(`/alarm-history/alarms/${alarmId}/read`);
