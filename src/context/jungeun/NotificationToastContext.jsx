import { createContext, useContext, useState, useCallback, useEffect } from "react";
import NotificationToast from "../../components/ui/jungeun/NotificationToast";

const NotificationToastContext = createContext();

export const useNotificationToast = () => useContext(NotificationToastContext);

export const NotificationToastProvider = ({ children }) => {
  const [notification, setNotification] = useState(null);

  // 알림 토스트 띄우는 함수
  const showNotificationToast = useCallback((type, message) => {
    console.log('📢 알림 토스트 표시:', { type, message });
    setNotification({ type, message });
  }, []);

  // 전역 함수로 등록 (새로고침 후에도 사용 가능)
  useEffect(() => {
    window.showNotificationToast = showNotificationToast;
    console.log('🌐 window.showNotificationToast 등록 완료');
    return () => {
      delete window.showNotificationToast;
      console.log('🌐 window.showNotificationToast 해제 완료');
    };
  }, [showNotificationToast]);

  // 커스텀 이벤트 리스너 등록
  useEffect(() => {
    const handler = (e) => {
      const { type, message } = e.detail;
      showNotificationToast(type, message);
    };
    window.addEventListener("show-notification-toast", handler);
    return () => window.removeEventListener("show-notification-toast", handler);
  }, [showNotificationToast]);

  // 알림 토스트 닫기
  const handleClose = () => setNotification(null);

  return (
    <NotificationToastContext.Provider value={{ showNotificationToast }}>
      {children}
      {notification && (
        <NotificationToast
          type={notification.type}
          message={notification.message}
          onClose={handleClose}
        />
      )}
    </NotificationToastContext.Provider>
  );
}; 