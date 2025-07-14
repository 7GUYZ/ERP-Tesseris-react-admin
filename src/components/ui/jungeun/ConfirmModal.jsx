import React from 'react';
import "../../../styles/jungeun/confirmModal.css";

const ConfirmModal = ({ message, onConfirm }) => {
  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div style={{ marginBottom: '1rem' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#3b7ddd' }}>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
        </div>
        <p>{message}</p>
        <button onClick={onConfirm}>
          로그인하기
        </button>
      </div>
    </div>
  );
};

export default ConfirmModal;
