import React, { useState } from 'react';
import '../../../styles/jungeun/passwordModal.css';
import { useToast } from '../../../context/jungeun/ToastContext';
import LoadingSpinner from './LoadingSpinner';
import { pwCheck } from '../../../api/auth/JungeunAuth';

const PasswordModal = ({ isOpen, onConfirm, onCancel }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handlePwCheck = async () => {
    setLoading(true);
    try {
      const userInfo = JSON.parse(localStorage.getItem("user-info"));
      const username = userInfo?.email;
      const response = await pwCheck({ username, password });
      if (response.data.resultCode === 200) {
        setPassword('');
        setLoading(false);
        onConfirm(true); // 비밀번호 일치 시 true 전달
        return;
      } else {
        showToast("error", "비밀번호가 틀립니다.");
        setLoading(false);
        onConfirm(false); // 비밀번호 불일치 시 false 전달
        return;
      }
    } catch (error) {
      showToast("error", "비밀번호 확인 실패");
      setLoading(false);
      onConfirm(false);
    }
  };

  if (!isOpen) return null;

  const handleConfirm = (e) => {
    if (e) e.preventDefault();
    if (!password) return;
    handlePwCheck();
  };

  const handleCancel = () => {
    setPassword('');
    onCancel();
  };

  return (
    <div className="password-modal-overlay">
      {loading && <LoadingSpinner fullScreen />}
      <div className="password-modal">
        <form onSubmit={handleConfirm}>
          <div className="password-modal-header">
            <h3>비밀번호 확인</h3>
          </div>
          <div className="password-modal-body">
            {/* 부제목 제거 */}
            <input
              type="password"
              className="password-input"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoFocus
            />
          </div>
          <div className="password-modal-footer center">
            <button type="submit" className="password-modal-btn confirm" disabled={!password}>
              확인
            </button>
            <button type="button" className="password-modal-btn cancel" onClick={handleCancel}>
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordModal; 