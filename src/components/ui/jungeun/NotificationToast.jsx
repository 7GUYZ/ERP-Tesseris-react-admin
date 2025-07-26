import React, { useEffect } from 'react';
import './NotificationToast.css';

const NotificationToast = ({ message, onClose, type = 'info' }) => {
  useEffect(() => {
    // 5초 후 자동으로 닫기
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return '📢';
    }
  };

  const getTypeClass = () => {
    switch (type) {
      case 'success':
        return 'notification-toast-success';
      case 'error':
        return 'notification-toast-error';
      case 'warning':
        return 'notification-toast-warning';
      case 'info':
      default:
        return 'notification-toast-info';
    }
  };

  return (
    <div className={`notification-toast ${getTypeClass()}`}>
      <div className="notification-toast-content">
        <div className="notification-toast-icon">
          {getIcon()}
        </div>
        <div className="notification-toast-message">
          {message}
        </div>
        <button 
          className="notification-toast-close" 
          onClick={onClose}
          aria-label="알림 닫기"
        >
          ×
        </button>
      </div>
      <div className="notification-toast-progress"></div>
    </div>
  );
};

export default NotificationToast; 