import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { noticeList } from "../../../api/Auth";
import "../../../styles/jiyun/notice/notice.css";

export default function NoticeList() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getnoticeList = async () => {
      try {
        const response = await noticeList();
        setList(response.data);
      } catch (err) {
        setError("공지사항 리스트를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };
    getnoticeList();
  }, []);

  const formatDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading)
    return (
      <div className="notice-page">
        <h1>공지사항 목록</h1>
        <p>로딩 중...</p>
      </div>
    );

  if (error) return <div>{error}</div>;

  // 등록일 내림차순 정렬
  const sortedList = [...list].sort(
    (a, b) => new Date(b.noticeCreateTime) - new Date(a.noticeCreateTime)
  );

  return (
    <div className="notice-page">
      <h1>공지사항 목록</h1>
      <div className="top-bar">
        <button
          className="btn btn-primary"
          onClick={() => navigate("/notice/write")}
        >
          공지사항 등록
        </button>
      </div>
      <div className="notice-table-wrapper">
        <table className="notice-table">
          <thead>
            <tr>
              <th>#</th>
              <th>제목</th>
              <th>작성자</th>
              <th>등록일</th>
            </tr>
          </thead>
          <tbody>
            {sortedList.map((notice, idx) => (
              <tr key={notice.noticeIndex}>
                <td>{idx + 1}</td>
                <td>
                  <span
                    className="notice-link"
                    onClick={() =>
                      navigate(`/notice/update/${notice.noticeIndex}`)
                    }
                  >
                    {notice.noticeTitle}
                  </span>
                </td>
                <td>{notice.userId}</td>
                <td>{formatDate(notice.noticeCreateTime)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
