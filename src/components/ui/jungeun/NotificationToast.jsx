import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import '../../../styles/jungeun/notificationToast.css';

// 토스트 타입별 아이콘과 색상
const toastConfig = {
  success: {
    icon: CheckCircle,
    bgColor: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    borderColor: '#10b981',
    textColor: '#ffffff'
  },
  error: {
    icon: AlertCircle,
    bgColor: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    borderColor: '#ef4444',
    textColor: '#ffffff'
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    borderColor: '#f59e0b',
    textColor: '#ffffff'
  },
  info: {
    icon: Info,
    bgColor: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    borderColor: '#3b82f6',
    textColor: '#ffffff'
  }
};

const NotificationToast = ({ message, onClose, type = 'info', duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  
  const config = toastConfig[type] || toastConfig.info;
  const IconComponent = config.icon;

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div className={`notification-toast ${isExiting ? 'toast-exit' : 'toast-enter'}`}>
      <div 
        className="toast-content"
        style={{
          background: config.bgColor,
          borderColor: config.borderColor,
          color: config.textColor
        }}
      >
        <div className="toast-icon">
          <IconComponent size={20} />
        </div>
        
        <div className="toast-message">
          <span className="message-text">{message}</span>
        </div>
        
        <button 
          className="toast-close-btn"
          onClick={handleClose}
          style={{ color: config.textColor }}
        >
          <X size={16} />
        </button>
        
        <div 
          className="toast-progress"
          style={{ backgroundColor: config.textColor }}
        />
      </div>
    </div>
  );
};

// 토스트 표시 함수들
const showToast = {
  success: (message) => {
    window.showNotificationToast(message, 'success');
  },
  error: (message) => {
    window.showNotificationToast(message, 'error');
  },
  warning: (message) => {
    window.showNotificationToast(message, 'warning');
  },
  info: (message) => {
    window.showNotificationToast(message, 'info');
  }
};

export default NotificationToast;
export { showToast }; 