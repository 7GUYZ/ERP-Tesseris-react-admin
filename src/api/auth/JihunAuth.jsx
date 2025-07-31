import { api } from "../Http"

// 회원 자산 내역
export const memberaccountSearch = (data) => api.post("/memberaccount/search", data);
export const memberaccountLookupRoles = () => api.get("/memberaccount/lookup/roles");
export const memberaccountLookupTransactionTypes = () => api.get("/memberaccount/lookup/transaction-types");

// 회원 자산 현황
export const ajgMemberAssetDetails = (page = 0, size = 25) => api.get(`/memberassetdetails?page=${page}&size=${size}`);
export const ajgMemberAssetDetailsSearch = (data) => api.post("/memberassetdetails/search", data);
export const ajgMemberAssetDetailsLookupGrades = () => api.get("/memberassetdetails/lookup/grades");
export const ajgMemberAssetDetailsPayment = (data) => api.post("/memberassetdetails/payment", data);

// 엑셀 다운로드 API
export const excelDownloadMemberAccount = (page = 0, size = 50000) => api.get(`/common/exceldownload/memberaccount?page=${page}&size=${size}`);
export const excelDownloadMemberAssetDetails = (page = 0, size = 50000) => api.get(`/common/exceldownload/memberassetdetails?page=${page}&size=${size}`);
// ============================================================================
// 채팅방 관리자 목록 호출
export const GetAdminList = () => api.get("/adminchat/adminlist");
// ============================================================================
// Interceptor 등록 함수로 분리
export function setupInterceptors() {
  // 요청 인터셉터
  api.interceptors.request.use(
    (config) => {
      const excludePaths = ["/auth/login", "/auth/signUp"];
      if (!excludePaths.includes(config.url)) {
        const accessToken = localStorage.getItem("access-token");
        if (accessToken) {
          config.headers.Authorization = accessToken.startsWith("Bearer ")
            ? accessToken
            : `Bearer ${accessToken}`;
        }
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // 응답 인터셉터
  api.interceptors.response.use(
    (res) => res,
    async (error) => {
      const { config, response } = error;

      // accessToken 만료 처리 (401 응답)
      if (response?.status === 401 && !config._retry) {
        console.log("🔒 401 응답 받음 → refresh 시도");

        config._retry = true;

        try {
          const result = await api.post("/auth/refresh");
          const { success, data: accessToken } = result.data;

          if (!success || !accessToken) {
            throw new Error("refreshToken expired");
          }

          console.log("새 accessToken:", accessToken);

          // accessToken 저장 및 재시도
          localStorage.setItem("access-token", `Bearer ${accessToken}`);
          config.headers.Authorization = `Bearer ${accessToken}`;
          return api(config); // 원래 요청 재전송

        } catch (e) {
          console.warn("refreshToken 만료 또는 서버 오류:", e.message);

          // 로그인 만료 처리 (전역 이벤트로 Toast 발생)
          localStorage.removeItem("access-token");
          localStorage.removeItem("user-info");
          window.dispatchEvent(
            new CustomEvent("show-toast", {
              detail: {
                type: "error",
                message: "로그인 만료 \n(4초 뒤 로그인 페이지로 이동)",
              },
            })
          );

          // 홈으로 이동
          setTimeout(() => {
            window.location.href = "/";
          }, 4000);

          return Promise.reject(e);
          
        }
      }

      return Promise.reject(error);
    }
  );
}
