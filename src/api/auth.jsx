import { api } from "./http";

//공지사항
export const noticeInsert = (notice) => api.post("/notice/insert", notice);
export const noticeDetail = (notice_idx) =>
  api.get(`/notice/detail/${notice_idx}`);
export const noticeList = () => api.get("/notice/list");
export const noticeUpdate = (notice) => api.post(`/notice/update`, notice);
export const noticeDelete = (notice_idx) =>
  api.post(`/notice/delete/${notice_idx}`);
