import {api} from "../Http";

// Interceptor 등록 함수로 분리
export function setupInterceptors() {
  // 요청 인터셉터
  api.interceptors.request.use(
    (config) => {
      const excludePaths = ["/auth/login", "/auth/signUp"];
      if (!excludePaths.includes(config.url)) {
        const accessToken = localStorage.getItem("admin-access-token");
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
          localStorage.setItem("admin-access-token", `Bearer ${accessToken}`);
          config.headers.Authorization = `Bearer ${accessToken}`;
          return api(config); // 원래 요청 재전송

        } catch (e) {
          console.warn("refreshToken 만료 또는 서버 오류:", e.message);

          // 로그인 만료 처리 (전역 이벤트로 Toast 발생)
          localStorage.removeItem("admin-access-token");
          localStorage.removeItem("admin-info");
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

export const getStoreList = (params) => // 가맹점 회원 리스트
  api.get('/store/list',{ params });

export const getAdminList = (params) => // 관리자 리스트
  api.get('/admin/list',{ params });

export const createAdmin = (data) => // 관리자 등록
  api.post('/admin/create', data);

export const getAdminDetail = (adminId) => // 관리자 상세정보 조회
  api.get(`/admin/detail/${adminId}`);

export const updateAdmin = (adminId, data) => // 관리자 정보 수정
  api.put(`/admin/update/${adminId}`, data);

  

export const getCustomerAllStoreList = (params) => // 가맹점 고객현황 - 가맹점리스트
  api.get('/store/customerlist',{ params });

export const getStoreCustomerList = (storeId) => { // 가맹점 고객현황 - 고객 리스트 
  return api.get(`/store/customerlist/${storeId}`);
};

export const getStoreRegisterList = (params) => // 가맹점 신청 현황
  api.get('/store/registerlist',{ params });

export const getAllowanceList = (params) => // 사업자 수당 내역
  api.get('/businessman/allowance',{ params });

export const getBusinessManList = () => // 사업자 조직도 - 전체 사업자 리스트
  api.get('/businessman/orgchart');



  
// 상세정보 모달용 API 함수들
export const getBusinessManDetail = (businessManId) => // 사업자 상세정보
  api.get(`/modal/businessman/detail/${businessManId}`);
  
export const getBusinessManTransactionHistory = (businessManId) => // 사업자 거래내역 (JOIN 필요: user_cm_log_payment, user_cm_log_transaction_type)
  api.get(`/modal/businessman/transaction-history/${businessManId}`);

  
  export const getStoreDetail = (storeId) => // 가맹점 상세정보
  api.get(`/modal/store/detail/${storeId}`);
  
  export const getStoreTransactionHistory = (userId) => // 가맹점 거래내역 
  api.get(`/modal/store/transaction-history/${userId}`);
  
  
  
  
  export const updateStore = (storeId, data) => // 가맹점 정보 수정
  api.put(`/modal/store/update/${storeId}`, data);
  
  export const updateBusinessMan = (businessManId, data) => // 사업자 정보 수정
    api.put(`/modal/businessman/update/${businessManId}`, data);
  
export const getStoreRegisterDetail = (storeId) => // 가맹점 신청 상세정보
  api.get(`/modal/store/register/detail/${storeId}`);

export const updateStoreRegister = (storeId, data) => // 가맹점 신청 정보 수정
  api.put(`/modal/store/register/update/${storeId}`, data);

export const getWithdrawalDetails = (params) => // 출금 상세 내역 조회
  api.get('/withdrawal/details', { params });



// 채팅 관련 API
export const getChatAdminList = () => // 전체 관리자 목록 조회
  api.get('/adminchat/list');

export const getUserChatRooms = (userid) => // 사용자 채팅방 목록 조회
  api.get(`/adminchat/${userid}`);

export const saveChatMessage = (messageData) => // 채팅 메시지 DB 저장 (백엔드에서 분기처리)
  api.post('/adminchat/message', messageData);

// S3 이미지 관련 API
export const getStoreImagesWithPresignedUrls = (storeIndex) => // store_index로 store_image 조회 + S3 Presigned URL 생성
  api.get(`/store/images-with-presigned/${storeIndex}`);


