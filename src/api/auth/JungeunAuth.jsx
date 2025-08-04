import { api } from "../Http"
// [로그인]
export const login = (username, password) =>
  api.post("/auth/login", { username, password })

export const test = () =>
  api.get("/user/testBackend")

export const alarmTest = () =>
  api.get("/alarms/HelloAlarm")

export const logout = () => 
  api.post("/auth/logout")

// Interceptor 등록 함수로 분리
export function setupInterceptors(navigate) {
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
            if (navigate) {
              navigate("/");
            } else {
              window.location.href = "/";
            }
          }, 4000);

          return Promise.reject(e);
          
        }
      }

      return Promise.reject(error);
    }
  );
}


// 월 CM 한도 설정
// 월 CM 한도 조회 ( 첫 화면 )
export const cmLimit = () => 
  api.get("/cmLimit")

export const cmLimitSave = (settingValue) =>
  api.post("/cmLimit/save", settingValue)

export const pwCheck = ({username, password}) =>
  api.post("/passwordCheck", {username, password})

export const menuAuthority = (adminTypeIndex) => {
  return api.get("/adminAuthority", {
    params: { adminTypeIndex }
  });
};

// 사용자의 알림 설정 조회
export const getUserAlarmSetting = (userIndex, alarmTypesId) => {
  return api.get("/alarms/user-alarm-setting", {
    params: { userIndex, alarmTypesId }
  });
};

// 사용자의 알림 설정 업데이트
export const updateUserAlarmSetting = (userIndex, alarmTypesId, isActive) => {
  return api.post("/alarms/update-user-alarm-setting", null, {
    params: { userIndex, alarmTypesId, isActive }
  });
};
