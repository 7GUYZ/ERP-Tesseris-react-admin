import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { permissionCheckApi } from "../../../api/auth/TaekjunAuth";
import {
  noticeDetail,
  noticeUpdate,
  noticeDelete,
} from "../../../api/auth/JiyoonAuth";
import "../../../styles/jiyun/notice/notice-update.css";
import PwModal from "../../../components/feature/jiyun/PwModal";
import { useToast } from "../../../context/jungeun/ToastContext";

export default function NoticeUpdate() {
  const { noticeIndex } = useParams();
  const [form, setForm] = useState({ noticeTitle: "", noticeDesc: "", noticeType: "일반" });
  const [modalType, setModalType] = useState(null); // 'update' | 'delete' | null
  const [isPwModalOpen, setIsPwModalOpen] = useState(false);
  const [canUpdate, setCanUpdate] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  // 권한 체크
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const response = await permissionCheckApi.checkPermission(25); // programIndex: 25 (공지사항 관리)
        if (response.data) {
          setCanUpdate(response.data.hasUpdateAuthority === 1);
          setCanDelete(response.data.hasDeleteAuthority === 1);
          console.log("공지사항 수정/삭제 권한 체크 결과:", {
            update: response.data.hasUpdateAuthority,
            delete: response.data.hasDeleteAuthority,
          });
        }
      } catch (error) {
        console.error("권한 체크 실패:", error);
        setCanUpdate(false);
        setCanDelete(false);
      }
    };

    checkPermission();
  }, []);

  // 공지사항 상세 정보 로드
  useEffect(() => {
    const fetchNotice = async () => {
      try {
        const res = await noticeDetail(noticeIndex);
        console.log("공지사항 상세 데이터:", res.data);
        setForm({
          noticeTitle: res.data.noticeTitle || "",
          noticeDesc: res.data.noticeDesc || "",
          noticeType: res.data.noticeType || "일반",
        });
        console.log("설정된 폼 데이터:", {
          noticeTitle: res.data.noticeTitle || "",
          noticeDesc: res.data.noticeDesc || "",
          noticeType: res.data.noticeType || "NORMAL",
        });
      } catch {
        alert("공지사항을 불러오지 못했습니다.");
        navigate("/notice/list");
      }
    };
    fetchNotice();
  }, [noticeIndex, navigate]);

  const handleChange = (e) => {
    if (!canUpdate) {
      showToast("error", "수정 권한이 없습니다.");
      return;
    }
    console.log("필드 변경:", e.target.name, e.target.value);
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 기존 handleSubmit → 모달 오픈으로 변경
  const handleUpdateClick = (e) => {
    e.preventDefault();
    if (!canUpdate) {
      showToast("error", "수정 권한이 없습니다.");
      return;
    }
    setModalType("update");
    setIsPwModalOpen(true);
  };

  const handleDeleteClick = () => {
    if (!canDelete) {
      showToast("error", "삭제 권한이 없습니다.");
      return;
    }
    setModalType("delete");
    setIsPwModalOpen(true);
  };

  // PwModal에서 확인 시 호출되는 콜백
  const handlePwConfirm = async (password) => {
    if (modalType === "update") {
      try {
        console.log("수정 요청 데이터:", { ...form, noticeIndex, password });
        await noticeUpdate({ ...form, noticeIndex, password });
        showToast("success", "공지사항이 수정되었습니다.");
        setIsPwModalOpen(false);
        navigate("/notice/list");
      } catch {
        showToast("error", "비밀번호가 일치하지 않습니다.");
      }
    } else if (modalType === "delete") {
      try {
        await noticeDelete({ noticeIndex, password });
        showToast("success", "공지사항이 삭제되었습니다.");
        setIsPwModalOpen(false);
        navigate("/notice/list");
      } catch {
        showToast("error", "비밀번호가 일치하지 않습니다.");
      }
    }
  };

  const handlePwModalClose = () => {
    setIsPwModalOpen(false);
  };

  const handleCancel = () => {
    navigate("/notice/list");
  };

  return (
    <div className="notice-update-page">
      <h1 className="notice-page-title">공지사항 수정</h1>
      <form className="notice-update-form" onSubmit={handleUpdateClick}>
        <div className="notice-update-form-group">
          <label htmlFor="noticeType">
            공지 타입 <span className="notice-update-required">*</span>
          </label>
          <select
            id="noticeType"
            name="noticeType"
            value={form.noticeType}
            onChange={handleChange}
            required
            disabled={!canUpdate}
            style={!canUpdate ? { opacity: 0.5, cursor: "not-allowed" } : {}}
            className="notice-update-input"
          >
            <option value="일반">일반</option>
            <option value="중요">중요</option>
          </select>
        </div>

        <div className="notice-update-form-group">
          <label htmlFor="noticeTitle">
            제목 <span className="notice-update-required">*</span>
          </label>
          <input
            id="noticeTitle"
            name="noticeTitle"
            type="text"
            value={form.noticeTitle}
            onChange={handleChange}
            required
            disabled={!canUpdate}
            style={!canUpdate ? { opacity: 0.5, cursor: "not-allowed" } : {}}
            className="notice-update-input"
          />
        </div>

        <div className="notice-update-form-group">
          <label htmlFor="noticeDesc">
            상세내용 <span className="notice-update-required">*</span>
          </label>
          <textarea
            id="noticeDesc"
            name="noticeDesc"
            rows="10"
            value={form.noticeDesc}
            onChange={handleChange}
            required
            disabled={!canUpdate}
            style={!canUpdate ? { opacity: 0.5, cursor: "not-allowed" } : {}}
            className="notice-update-textarea"
          />
        </div>

        <div className="notice-update-form-actions">
          <button
            type="button"
            className="notice-update-btn notice-update-btn-secondary"
            onClick={handleCancel}
          >
            취소
          </button>
          <button
            type="button"
            className="notice-update-btn notice-update-btn-danger"
            onClick={handleDeleteClick}
            disabled={!canDelete}
            style={!canDelete ? { opacity: 0.5, cursor: "not-allowed" } : {}}
          >
            삭제
          </button>
          <button
            type="submit"
            className="notice-update-btn notice-update-btn-primary"
            disabled={!canUpdate}
            style={!canUpdate ? { opacity: 0.5, cursor: "not-allowed" } : {}}
          >
            수정
          </button>
        </div>
      </form>
      <PwModal
        isOpen={isPwModalOpen}
        onClose={handlePwModalClose}
        onConfirm={handlePwConfirm}
        title={
          modalType === "delete" ? "삭제 비밀번호 확인" : "수정 비밀번호 확인"
        }
      />
    </div>
  );
}
