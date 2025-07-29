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
    setupInterceptors(navigate);
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

function AppContent() {
  const { connectWebSocket } = useWebSocket();

  useEffect(() => {
    const userInfo = localStorage.getItem("user-info");
    const token = localStorage.getItem("access-token");
    
    if (userInfo && token) {
      const parsedUserInfo = JSON.parse(userInfo);
      connectWebSocket(token, parsedUserInfo.user_index, (notification) => {
        console.log('📨 알림:', notification.message);
        // WebSocketContext에서 이미 토스트를 처리하므로 여기서는 제거
      });
    }
  }, [connectWebSocket]);

  return (
    <NotificationToastProvider>
      <ToastProvider>
        <Routes>
          <Route path='/' element={<LoginPage />} />
          <Route path='/*' element={<AppRoutes />} />
        </Routes>
      </ToastProvider>
    </NotificationToastProvider>
  );
}

export default App;
