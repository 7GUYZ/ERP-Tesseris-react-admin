import { api } from "../Http";

//공지사항
export const noticeInsert = (notice) => api.post("/notice/insert", notice);
export const noticeDetail = (notice_idx) =>
  api.get(`/notice/detail/${notice_idx}`);
export const noticeList = () => api.get("/notice/list");
export const noticeUpdate = (notice) => api.post(`/notice/update`, notice);
export const noticeDelete = (notice_idx) =>
  api.post(`/notice/delete/${notice_idx}`);

//중개 수수료 설정
export const getCommissionSetting = () =>
  api.get("/commission-setting/business-grades");
export const setCommissionSetting = (data) =>
  api.post("/commission-setting/business-grades-update", data);

//업데이트 로그 설정
export const getUpdateLog = (params) =>
  api.get("/update-log/search", { params });

// CMS 접속 로그 검색
export const searchCmsAccessLogs = (searchData) =>
  api.get("/cms-access-log/search", { params: searchData });

// 관리자 타입 목록 조회
export const getAdminTypes = () => api.get("/cms-access-log/admin-types");
