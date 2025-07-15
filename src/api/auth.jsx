import {api} from "./http"

export const getStoreList = (params) =>
  api.get('/store/list',{ params });

export const getStoreCustomerList = (params) =>
  api.get('/store/customerlist',{ params });