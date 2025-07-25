import { Route, Routes, useNavigate } from 'react-router-dom';
import LoginPage from "./pages/jungeun/LoginPage";
import { ToastProvider } from "./context/jungeun/ToastContext";
import { useEffect } from 'react';
import useAuthStore from './store/jungeun/AuthStore';
import { setupInterceptors } from './api/auth/JungeunAuth';
import AppRoutes from './routes/AppRoutes';

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
    <ToastProvider>
      <Routes>
        <Route path='/' element={<LoginPage />} />
        {/* 공통 레이아웃과 Route들이 들어있는 AppRoutes(헤더, 내비 포함) */}
        <Route path='/*' element={<AppRoutes />} />
      </Routes>
    </ToastProvider>
  );
}

export default App;
