"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cmLimit, cmLimitSave } from "../../../api/auth/JungeunAuth"
import { permissionCheckApi } from "../../../api/auth/TaekjunAuth"
import "../../../styles/jungeun/monthlyCmLimit.css";
import LoadingSpinner from "../../ui/jungeun/LoadingSpinner"
import ConfirmModal from "../../ui/jungeun/ConfirmModal"
import PasswordModal from "../../ui/jungeun/PasswordModal"
import { useToast } from "../../../context/jungeun/ToastContext";

const formatNumber = (num) => {
  if (num === undefined || num === null || isNaN(num)) return '0';
  return Number(num).toLocaleString();
};

const MonthlyCmLimitForm = () => {
  const [monthlyLimit, setMonthlyLimit] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(monthlyLimit);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState("fetch");
  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  // 권한 체크 함수
  const checkEditPermission = async () => {
    try {
      const response = await permissionCheckApi.checkPermission(38); // programIndex: 38 (월 CM사용한도)
      if (response.data) {
        setCanEdit(response.data.hasUpdateAuthority === 1);
        console.log('월 CM사용한도 수정 권한 체크 결과:', response.data.hasUpdateAuthority);
      }
    } catch (error) {
      console.error('권한 체크 실패:', error);
      setCanEdit(false);
    }
  };

  useEffect(() => {
    const getCmLimit = async () => {
      setLoading(true);
      try {
        const response = await cmLimit();
        setMonthlyLimit(response.data.data.settingValue);
      } catch (error) {
        setModalMessage('월 CM 한도를 불러오지 못했습니다.');
        setModalType("fetch");
        setModalOpen(true);
      } finally {
        setLoading(false);
      }
    };
    
    // 권한 체크와 데이터 로드 동시에 실행
    getCmLimit();
    checkEditPermission();
  }, []);

  const handleEdit = () => {
    if (!canEdit) {
      showToast("error", "수정 권한이 없습니다.");
      return;
    }
    setTempValue(monthlyLimit);
    setIsEditing(true);
  };

  // 비밀번호 모달 띄우는 로직
  const handleSave = () => {
    // 변경사항이 없으면 toast 띄우고 return
    if (tempValue === monthlyLimit) {
      showToast("info", "변경사항이 없습니다.");
      return;
    }
    setPwModalOpen(true);
  };

  const handleCancel = () => {
    setTempValue(monthlyLimit);
    setIsEditing(false);
  };

  const handleAmountIncrease = (amount) => {
    setTempValue((prev) => {
      const safePrev = typeof prev === "number" ? prev : Number(prev) || 0;
      return Math.max(0, safePrev + amount);
    });
  };

  const amountButtons = [
    { amount: 1000, label: "+ 1천원" },
    { amount: 5000, label: "+ 5천원" },
    { amount: 10000, label: "+ 1만원" },
    { amount: 50000, label: "+ 5만원" },
    { amount: 100000, label: "+ 10만원" },
  ];

  return (
    <div className="monthly-cm-limit">
      {loading && <LoadingSpinner fullScreen />}
      {modalOpen && (
        <ConfirmModal
          message={modalMessage}
          onConfirm={() => {
            if (modalType === "fetch") {
              navigate("/TestMain");
            } else {
              setModalOpen(false);
              setTempValue(monthlyLimit);
              setIsEditing(true);
            }
          }}
        />
      )}
      <PasswordModal
        isOpen={pwModalOpen}
        onConfirm={async (isCorrect) => {
          if (isCorrect) {
            setPwModalOpen(false);
            setLoading(true);
            try {
              const response = await cmLimitSave({ settingValue: tempValue });
              if (response.data.resultCode === 200) {
                // 화면 새로고침 대신 상태 직접 업데이트
                setMonthlyLimit(tempValue);
                setIsEditing(false);
                showToast("success", "월 CM 한도가 성공적으로 수정되었습니다.");
              } else {
                setModalMessage('월 CM 한도 수정 실패');
                setModalType("save");
                setModalOpen(true);
              }
            } catch (error) {
              setModalMessage('월 CM 한도 수정 실패');
              setModalType("save");
              setModalOpen(true);
            } finally {
              setLoading(false);
            }
          } else {
            // 비밀번호 틀렸을 때 모달 닫고 토스트만 노출
            setPwModalOpen(false);
          }
        }}
        onCancel={() => setPwModalOpen(false)}
      />
      <div className="setting-card">
        <div className="card-header">
          <div className="header-content">
            <h2 className="setting-title">월 CM 사용한도</h2>
            <p className="setting-description">매월 사용 가능한 CM 한도를 설정합니다</p>
          </div>
          <div className="header-actions">
            {!isEditing ? (
              canEdit ? (
                <button className="edit-btn" onClick={handleEdit}>수정</button>
              ) : (
                <button className="edit-btn" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>수정</button>
              )
            ) : (
              <div className="edit-actions">
                <button className="save-btn" onClick={handleSave}>저장</button>
                <button className="cancel-btn" onClick={handleCancel}>취소</button>
              </div>
            )}
          </div>
        </div>

        <div className="card-content">
          <div className="value-display">
            <div className="value-label">현재 월 CM 한도</div>
            {!isEditing ? (
              <div className="value-amount">
                <span className="amount-number">{formatNumber(monthlyLimit)}</span>
                <span className="amount-unit">원</span>
              </div>
            ) : (
              <div className="edit-section">
                <div className="value-input-container">
                  <input
                    type="number"
                    value={tempValue}
                    onChange={(e) => {
                      let value = e.target.value;
                      if (value === "") return setTempValue(0);
                      if (/^0[0-9]+/.test(value)) value = value.replace(/^0+/, "");
                      setTempValue(Math.max(0, Number(value)));
                    }}
                    className="value-input"
                    placeholder="한도를 입력하세요"
                  />
                  <span className="input-unit">원</span>
                </div>

                <div className="amount-buttons">
                  <div className="amount-buttons-label">빠른 증가</div>
                  <div className="amount-buttons-grid">
                    {amountButtons.map((btn) => (
                      <button
                        key={btn.amount}
                        className="amount-btn"
                        onClick={() => handleAmountIncrease(btn.amount)}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyCmLimitForm;
