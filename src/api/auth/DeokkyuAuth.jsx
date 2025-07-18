import {api} from "../Http";

export const getStoreList = (params) =>
  api.get('/store/list',{ params });

export const getCustomerAllStoreList = (params) =>
  api.get('/store/customerlist',{ params });

export const getStoreCustomerList = (storeId) => {
  return api.get(`/store/customerlist/${storeId}`);
};