import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { noticeInsert } from "../../../api/auth/JiyoonAuth";
import "../../../styles/jiyun/notice/notice-write.css";
import { useToast } from "../../../context/jungeun/ToastContext";

export default function NoticeWrite() {
  const [form, setForm] = useState({ noticeTitle: "", noticeDesc: "", noticeType: "일반" });
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await noticeInsert(form);
      showToast("success", "공지사항이 등록되었습니다.");
      navigate("/notice/list");
    } catch {
      showToast("error", "등록 실패");
    }
  };

  const handleCancel = () => {
    navigate("/notice/list");
  };

  return (
    <div className="notice-write-page">
      <div className="notice-page-header">
        <h1 className="notice-page-title">공지사항 등록</h1>
      </div>
      <form className="notice-write-form" onSubmit={handleSubmit}>
        <div className="notice-write-form-group">
          <label htmlFor="noticeType">
            공지 타입 <span className="notice-write-required">*</span>
          </label>
          <select
            name="noticeType"
            id="noticeType"
            value={form.noticeType}
            onChange={handleChange}
            required
            className="notice-write-input"
          >
            <option value="일반">일반</option>
            <option value="중요">중요</option>
          </select>
        </div>

        <div className="notice-write-form-group">
          <label htmlFor="noticeTitle">
            제목 <span className="notice-write-required">*</span>
          </label>
          <input
            type="text"
            name="noticeTitle"
            id="noticeTitle"
            value={form.noticeTitle}
            onChange={handleChange}
            required
            placeholder="제목을 입력해주세요"
            className="notice-write-input"
          />
        </div>

        <div className="notice-write-form-group">
          <label htmlFor="noticeDesc">
            상세내용 <span className="notice-write-required">*</span>
          </label>
          <textarea
            name="noticeDesc"
            id="noticeDesc"
            rows="10"
            value={form.noticeDesc}
            onChange={handleChange}
            required
            placeholder="내용을 입력해주세요"
            className="notice-write-textarea"
          />
        </div>

                 <div className="notice-write-form-actions">
           <button
             type="button"
             className="notice-update-btn notice-update-btn-secondary"
             onClick={handleCancel}
           >
             취소
           </button>
           <button
             type="submit"
             className="notice-update-btn notice-update-btn-primary"
           >
             등록
           </button>
         </div>
      </form>
    </div>
  );
}
