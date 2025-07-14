import { createContext, useContext, useState, useCallback, useEffect } from "react";
import Toast from "../../components/ui/jungeun/Toast"

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);

  // 토스트 띄우는 함수
  const showToast = useCallback((type, message) => {
    setToast({ type, message });
  }, []);

  // 커스텀 이벤트 리스너 등록
  useEffect(() => {
    const handler = (e) => {
      const { type, message } = e.detail;
      showToast(type, message);
    };
    window.addEventListener("show-toast", handler);
    return () => window.removeEventListener("show-toast", handler);
  }, [showToast]);

  // 토스트 닫기
  const handleClose = () => setToast(null);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={handleClose}
        />
      )}
    </ToastContext.Provider>
  );
}; 