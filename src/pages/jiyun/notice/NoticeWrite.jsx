import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { noticeInsert } from "../../../api/auth";
import "../../../styles/jiyun/notice/notice-write.css";

export default function NoticeWrite() {
  const [form, setForm] = useState({ noticeTitle: "", noticeDesc: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await noticeInsert(form);
      alert("공지사항이 등록되었습니다.");
      navigate("/notice");
    } catch {
      alert("등록 실패");
    }
  };

  const handleCancel = () => {
    navigate("/notice");
  };

  return (
    <div className="notice-page">
      <div className="breadcrumb">
        고객센터 관리 &gt; 공지사항 관리 &gt; 공지사항 등록
      </div>
      <h1>공지사항 등록</h1>
      <form className="notice-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="noticeTitle">
            제목 <span className="required">*</span>
          </label>
          <input
            type="text"
            name="noticeTitle"
            id="noticeTitle"
            value={form.noticeTitle}
            onChange={handleChange}
            required
            placeholder="제목을 입력해주세요"
          />
        </div>

        <div className="form-group">
          <label htmlFor="noticeDesc">
            상세내용 <span className="required">*</span>
          </label>
          <textarea
            name="noticeDesc"
            id="noticeDesc"
            rows="10"
            value={form.noticeDesc}
            onChange={handleChange}
            required
            placeholder="내용을 입력해주세요"
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
          <button type="submit" className="btn btn-primary">
            등록
          </button>
        </div>
      </form>
    </div>
  );
}
