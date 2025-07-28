import { Route, Routes, useNavigate } from 'react-router-dom';
import LoginPage from "./pages/jungeun/LoginPage";
import { ToastProvider } from "./context/jungeun/ToastContext";
import { NotificationToastProvider } from "./context/jungeun/NotificationToastContext";
import { useEffect } from 'react';
import useAuthStore from './store/jungeun/AuthStore';
import { setupInterceptors } from './api/auth/JungeunAuth';
import AppRoutes from './routes/AppRoutes';
import { WebSocketProvider, useWebSocket } from './context/jungeun/WebSocketContext';

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    setupInterceptors(navigate); // navigate 함수 전달
    // 기존 로그인 상태 복원 로직
    const tokens = localStorage.getItem("access-token");
    if (tokens) {
      useAuthStore.getState().zu_login();
    }
  }, [navigate]);

  return (
    <WebSocketProvider>
      <AppContent />
    </WebSocketProvider>
  );
}

// WebSocket 자동 재연결을 위한 내부 컴포넌트
function AppContent() {
  const { connectWebSocket } = useWebSocket();

  useEffect(() => {
    // 새로고침 시 WebSocket 자동 재연결
    const userInfo = localStorage.getItem("user-info");
    const token = localStorage.getItem("access-token");
    
    if (userInfo && token) {
      const parsedUserInfo = JSON.parse(userInfo);
      
      // 즉시 재연결 (사용자 경험 우선)
      connectWebSocket(token, parsedUserInfo.user_index, (notification) => {
        console.log('📨 알림:', notification.message);
        // 알림 토스트 사용
        if (window.showNotificationToast) {
          window.showNotificationToast('info', notification.message);
        }
      });
    }
  }, [connectWebSocket]);

  return (
    <NotificationToastProvider>
      <ToastProvider>
        <Routes>
          <Route path='/' element={<LoginPage />} />
          {/* 공통 레이아웃과 Route들이 들어있는 AppRoutes(헤더, 내비 포함) */}
          <Route path='/*' element={<AppRoutes />} />
        </Routes>
      </ToastProvider>
    </NotificationToastProvider>
  );
}

export default App;
