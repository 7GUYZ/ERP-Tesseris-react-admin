import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  const [form, setForm] = useState({ noticeTitle: "", noticeDesc: "" });
  const [modalType, setModalType] = useState(null); // 'update' | 'delete' | null
  const [isPwModalOpen, setIsPwModalOpen] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    const fetchNotice = async () => {
      try {
        const res = await noticeDetail(noticeIndex);
        setForm({
          noticeTitle: res.data.noticeTitle || "",
          noticeDesc: res.data.noticeDesc || "",
        });
      } catch {
        alert("공지사항을 불러오지 못했습니다.");
        navigate("/notice/list");
      }
    };
    fetchNotice();
  }, [noticeIndex, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 기존 handleSubmit → 모달 오픈으로 변경
  const handleUpdateClick = (e) => {
    e.preventDefault();
    setModalType("update");
    setIsPwModalOpen(true);
  };

  const handleDeleteClick = () => {
    setModalType("delete");
    setIsPwModalOpen(true);
  };

  // PwModal에서 확인 시 호출되는 콜백
  const handlePwConfirm = async (password) => {
    if (modalType === "update") {
      try {
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
        showToast("success", "삭제되었습니다.");
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
    <div className="notice-page">
      <div className="breadcrumb">
        고객센터 관리 &gt; 공지사항 관리 &gt; 공지사항 수정
      </div>
      <h1>공지사항 수정</h1>
      <form className="notice-form" onSubmit={handleUpdateClick}>
        <div className="form-group">
          <label htmlFor="noticeTitle">
            제목 <span className="required">*</span>
          </label>
          <input
            id="noticeTitle"
            name="noticeTitle"
            type="text"
            value={form.noticeTitle}
            onChange={handleChange}
            required
            className="notice-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="noticeDesc">
            상세내용 <span className="required">*</span>
          </label>
          <textarea
            id="noticeDesc"
            name="noticeDesc"
            rows="10"
            value={form.noticeDesc}
            onChange={handleChange}
            required
            className="notice-textarea"
          />
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleCancel}
          >
            취소
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleDeleteClick}
          >
            삭제
          </button>
          <button type="submit" className="btn btn-primary">
            수정
          </button>
        </div>
      </form>
      <PwModal
        isOpen={isPwModalOpen}
        onClose={handlePwModalClose}
        onConfirm={handlePwConfirm}
        title={modalType === "delete" ? "삭제 비밀번호 확인" : "수정 비밀번호 확인"}
      />
    </div>
  );
}
