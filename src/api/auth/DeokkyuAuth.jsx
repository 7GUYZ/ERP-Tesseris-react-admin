import {api} from "../Http";

export const getStoreList = (params) => // 가맹점 회원 리스트
  api.get('/store/list',{ params });

export const getCustomerAllStoreList = (params) => // 가맹점 고객현황 - 가맹점리스트
  api.get('/store/customerlist',{ params });

export const getStoreCustomerList = (storeId) => { // 가맹점 고객현황 - 고객 리스트 
  return api.get(`/store/customerlist/${storeId}`);
};

export const getStoreRegisterList = (params) => // 가맹점 신청 현황
  api.get('/store/registerlist',{ params });


export const getAllowanceList = (params) => // 사업자 수당 내역
  api.get('/businessman/allowance',{ params });

export const getBusinessManList = (params) => // 사업자 조직도 - 전체 사업자 리스트
  api.get('/businessman/orgchart',{ params });

