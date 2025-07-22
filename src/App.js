import { BrowserRouter, Route, Routes } from 'react-router-dom';
import LoginPage from "./pages/jungeun/LoginPage";
import { ToastProvider } from "./context/jungeun/ToastContext";
import { useEffect } from 'react';
import useAuthStore from './store/jungeun/AuthStore';
import { setupInterceptors } from './api/auth/JungeunAuth';
import AppRoutes from './routes/AppRoutes';

function App() {
  useEffect(() => {
    setupInterceptors(); // 인터셉터 등록
    // 기존 로그인 상태 복원 로직
    const tokens = localStorage.getItem("access-token");
    if (tokens) {
      useAuthStore.getState().zu_login();
    }
  }, []);

  return (
    <ToastProvider>
      <BrowserRouter basename="/reactadmin"> 
          <Routes>
            <Route path='/' element={<LoginPage />} />
            {/* 공통 레이아웃과 Route들이 들어있는 AppRoutes(헤더, 내비 포함) */}
            <Route path='/*' element={<AppRoutes />} />
          </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
