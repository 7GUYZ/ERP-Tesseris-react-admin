import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  noticeDetail,
  noticeUpdate,
  noticeDelete,
} from "../../../api/auth/JiyoonAuth";
import "../../../styles/jiyun/notice/notice-update.css";

export default function NoticeUpdate() {
  const { noticeIndex } = useParams();
  const [form, setForm] = useState({ noticeTitle: "", noticeDesc: "" });
  const navigate = useNavigate();

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
        navigate("/notice");
      }
    };
    fetchNotice();
  }, [noticeIndex, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await noticeUpdate({ ...form, noticeIndex });
      alert("공지사항이 수정되었습니다.");
      navigate("/notice");
    } catch {
      alert("수정 실패");
    }
  };

  const handleDelete = async () => {
    if (window.confirm("정말 삭제하시겠습니까?")) {
      try {
        await noticeDelete(noticeIndex);
        alert("삭제되었습니다.");
        navigate("/notice");
      } catch {
        alert("삭제 실패");
      }
    }
  };

  const handleCancel = () => {
    navigate("/notice");
  };

  return (
    <div className="notice-page">
      <div className="breadcrumb">
        고객센터 관리 &gt; 공지사항 관리 &gt; 공지사항 수정
      </div>
      <h1>공지사항 수정</h1>
      <form className="notice-form" onSubmit={handleSubmit}>
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
            onClick={handleDelete}
          >
            삭제
          </button>
          <button type="submit" className="btn btn-primary">
            수정
          </button>
        </div>
      </form>
    </div>
  );
}
