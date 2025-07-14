import { useEffect, useState } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/jungeun/AuthStore';
import ConfirmModal from "../../components/ui/jungeun/ConfirmModal";

function ProtectedRoute() {
  const isLoggedIn = useAuthStore((state) => state.zu_isLoggedIn);
  const navigate = useNavigate();
  const location = useLocation();
  const [showModal, setShowModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 로컬스토리지의 토큰과 Zustand 상태 모두 확인
    const token = localStorage.getItem("access-token");
    const userInfo = localStorage.getItem("user-info");
    
    console.log("🔒 Admin ProtectedRoute 체크:", {
      token: !!token,
      userInfo: !!userInfo,
      isLoggedIn,
      pathname: location.pathname
    });
    
    if (!token || !userInfo || !isLoggedIn) {
      console.log("❌ Admin 인증 실패 - ConfirmModal 표시");
      setShowModal(true);
      setIsAuthenticated(false);
    } else {
      console.log("✅ Admin 인증 성공 - 페이지 렌더링");
      setShowModal(false);
      setIsAuthenticated(true);
    }
    
    setIsLoading(false);
  }, [isLoggedIn, location.pathname]);

  const handleConfirm = () => {
    console.log("🔗 Admin 로그인 페이지로 이동");
    setShowModal(false);
    navigate('/'); // 로그인 페이지로 이동
  };

  // 로딩 중이거나 인증되지 않은 경우
  if (isLoading) {
    return null; // 아무것도 렌더링하지 않음
  }

  return (
    <>
      {showModal && (
        <ConfirmModal
          message="로그인이 필요한 서비스입니다."
          onConfirm={handleConfirm}
        />
      )}
      {isAuthenticated && <Outlet />}
    </>
  );
}

export default ProtectedRoute;
