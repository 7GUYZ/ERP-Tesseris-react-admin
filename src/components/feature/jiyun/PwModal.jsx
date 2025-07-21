import { useState } from "react"; // ← 이거 추가해야 함!
import { useToast } from "../../../context/jungeun/ToastContext";
import "../../../styles/jiyun/feature/pwModal.css";

export default function PwModal({
  isOpen,
  onClose,
  onConfirm,
  title = "비밀번호 입력",
}) {
  const [password, setPassword] = useState(""); // ← 최상단에서 선언
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const handleConfirm = async () => {
    if (!password.trim()) {
      showToast("비밀번호가 일치하지 않습니다.");
      return;
    }

    setIsLoading(true);
    try {
      await onConfirm(password);
      setPassword("");
    } catch (error) {
      showToast("error", "비밀번호가 일치하지 않습니다.");
      setPassword(""); // 비밀번호 입력 필드 비우기
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setPassword("");
    onClose();
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleConfirm();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="overlay" onClick={handleCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="pwmodal-header">
          <h2 className="title">{title}</h2>
        </div>

        <div className="content">
          <div className="inputGroup">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="비밀번호를 입력하세요"
              className="passwordInput"
              autoFocus
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="footer">
          <button
            type="button"
            onClick={handleCancel}
            className="button cancelButton"
            disabled={isLoading}
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="button confirmButton"
            disabled={isLoading}
          >
            {"확인"}
          </button>
        </div>
      </div>
    </div>
  );
}
