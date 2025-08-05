"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import InputField from "./LoginInputField.jsx"
import LoginButton from "./LoginButton.jsx"
import { login, menuAuthority } from "../../../api/auth/JungeunAuth.jsx"
import { useToast } from "../../../context/jungeun/ToastContext.jsx"
import useAuthStore from "../../../store/jungeun/AuthStore"
import "../../../styles/jungeun/login.css"

import { useWebSocket } from "../../../context/jungeun/WebSocketContext.jsx"
import { useNotificationToast } from "../../../context/jungeun/NotificationToastContext.jsx"
import { useChatWebSocket } from "../../../context/ChatWebSocketContext.jsx"

const LoginForm = () => {
  
  const { connectWebSocket } = useWebSocket();
  const { connectWebSocket: connectChatWebSocket } = useChatWebSocket();
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const { showToast } = useToast()
  const { showNotificationToast } = useNotificationToast();
  const zu_login = useAuthStore((state) => state.zu_login)
  const navigate = useNavigate();

  // 컴포넌트 마운트 시 기존 로그인 상태 체크
  useEffect(() => {
    const checkExistingLogin = () => {
      const accessToken = localStorage.getItem("admin-access-token");
      const userInfo = localStorage.getItem("admin-info");
      const userAuthority = localStorage.getItem("user-authority");

      // 이미 로그인된 상태라면 대시보드로 리다이렉트
      if (accessToken && userInfo && userAuthority) {
        try {
          const parsedUserInfo = JSON.parse(userInfo);
          
          // 관리자 권한 확인
          if (parsedUserInfo.user_role_index === "4") {
            // 이미 로그인된 상태이므로 대시보드로 이동
            navigate("/dashboard");
            return;
          }
        } catch (error) {
          console.error("기존 로그인 정보 파싱 오류:", error);
          // 파싱 오류 시 로컬스토리지 클리어
          localStorage.removeItem("admin-access-token");
          localStorage.removeItem("admin-info");
          localStorage.removeItem("user-authority");
        }
      }
    };

    checkExistingLogin();
  }, [navigate]);

  // 이메일 유효성 검사
  const validateEmail = (email) => {
    // 간단한 이메일 정규식
    const emailRegex = /^[\w-.]+@[\w-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  // 실시간 유효성 검사
  const handleEmailChange = (e) => {
    const value = e.target.value
    setEmail(value)

    if (errors.email) {
      if (value.trim() === "") {
        setErrors((prev) => ({ ...prev, email: "이메일을 입력해주세요." }))
      } else if (!validateEmail(value)) {
        setErrors((prev) => ({ ...prev, email: "올바른 이메일 형식이 아닙니다." }))
      } else {
        setErrors((prev) => ({ ...prev, email: "" }))
      }
    }
  }

  const handlePasswordChange = (e) => {
    const value = e.target.value
    setPassword(value)

    if (errors.password) {
      if (value.trim() === "") {
        setErrors((prev) => ({ ...prev, password: "비밀번호를 입력해주세요." }))
      } else {
        setErrors((prev) => ({ ...prev, password: "" }))
      }
    }
  }

  const validateForm = () => {
    const newErrors = {}

    // 이메일 검증
    if (!email.trim()) {
      newErrors.email = "이메일을 입력해주세요."
    } else if (!validateEmail(email)) {
      newErrors.email = "올바른 이메일 형식이 아닙니다."
    }

    // 비밀번호 검증 (길이 제한 없음)
    if (!password.trim()) {
      newErrors.password = "비밀번호를 입력해주세요."
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLogin = async (e) => {
    e.preventDefault()

    // 폼 유효성 검사
    if (!validateForm()) {
      showToast("error", "입력 정보를 확인해주세요");
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      const response = await login(email, password);
      console.log(response);

      // 백엔드 응답에 맞춰서 처리
      if (response.data && response.data.resultCode === 200) {
        // response.data.data = user-info 변수에 저장
        const userInfo = response.data.data

        if (userInfo.user_role_index === "4") {
          // 토큰 저장
          const accessToken = response.headers['authorization'];

          if (accessToken) {
            // localStorage에 토큰 저장
            localStorage.setItem("admin-access-token", accessToken)
            // localStorage에 user-info 저장 - 백엔드에서 응답 본문에 포함된 데이터 저장
            localStorage.setItem("admin-info", JSON.stringify(response.data.data))
          }

          // 권한 조회 및 캐싱
          try {
            const adminTypeIndex = userInfo.admin_type_index;
            if (adminTypeIndex) {
              const authorityResponse = await menuAuthority(adminTypeIndex);
              if (authorityResponse.data.resultCode === 200) {
                localStorage.setItem("user-authority", JSON.stringify(authorityResponse.data.data));
                console.log("권한 조회 성공:", authorityResponse.data.data);
              }
            }
          } catch (authorityError) {
            console.error("권한 조회 실패:", authorityError);
            // 권한 조회 실패해도 로그인은 진행
          }

          // 기존 WebSocket 연결 (알림용)
          connectWebSocket(accessToken, userInfo.user_index, (notification) => {
            console.log('알림 수신:', notification);
            showNotificationToast("info", notification.message);
          });

          // 채팅 WebSocket 연결
          const chatUser = {
            id: userInfo.user_index,
            name: userInfo.name,
            email: userInfo.email,
            role: userInfo.user_role_index
          };
          connectChatWebSocket(chatUser);

          // Zustand 상태 업데이트
          zu_login()

          // 성공 토스트 메시지
          showToast("success", response.data.resultMessage || "로그인에 성공했습니다");

          setTimeout(() => navigate("/dashboard"), 1500);
        } else {
          showToast("error", "허용되지 않은 사용자입니다");
        }
      }
    } catch (error) {
      console.error("로그인 에러:", error);

      // 에러 메시지 처리
      let errorMessage = "로그인에 실패했습니다";
      if (error.response?.data?.resultMessage) {
        errorMessage = error.response.data.resultMessage;
      }

      showToast("error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form className="login-login-form" onSubmit={handleLogin}>
      <h1 className="login-login-title">TESSERIS<br /><span style={{ fontSize: 18 }}>소상공인 물물교환 결제시스템</span></h1>
      <p className="login-login-subtitle">ADMIN LOGIN</p>
      <InputField
        type="text"
        placeholder="이메일을 입력하세요"
        value={email}
        onChange={handleEmailChange}
        icon="id"
        error={errors.email}
        errorMessage={errors.email}
      />
      <InputField
        type="password"
        placeholder="비밀번호를 입력하세요"
        value={password}
        onChange={handlePasswordChange}
        icon="lock"
        error={errors.password}
        errorMessage={errors.password}
      />
      <LoginButton type="submit" isLoading={isLoading}>
        {isLoading ? "로그인 중..." : "로그인"}
      </LoginButton>
    </form>
  )
}

export default LoginForm
