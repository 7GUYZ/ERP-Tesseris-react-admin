import axios from "axios";

// 스프링 서버에 가는  axios 인스턴스 생성(api)
export const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // CORS 허용
});

// 인터셉터
