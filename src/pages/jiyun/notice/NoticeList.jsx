import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { noticeList } from "../../../api/auth/JiyoonAuth";
import { permissionCheckApi } from "../../../api/auth/TaekjunAuth";
import { useToast } from "../../../context/jungeun/ToastContext";
import "../../../styles/jiyun/notice/notice.css";

export default function NoticeList() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [canInsert, setCanInsert] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  // 권한 체크
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const response = await permissionCheckApi.checkPermission(25); // programIndex: 25 (공지사항 관리)
        if (response.data) {
          setCanInsert(response.data.hasInsertAuthority === 1);
          console.log(
            "공지사항 등록 권한 체크 결과:",
            response.data.hasInsertAuthority
          );
        }
      } catch (error) {
        console.error("권한 체크 실패:", error);
        setCanInsert(false);
      }
    };

    checkPermission();
  }, []);

  // 공지사항 목록 로드
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
      <div className="notice-list-page">
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
    <div className="notice-list-page">
      <h1 className="notice-title">공지사항 목록</h1>
      <div className="notice-list-top-bar">
        <button
          className="notice-list-btn-n notice-list-btn-primary"
          onClick={() => {
            if (!canInsert) {
              showToast("error", "등록 권한이 없습니다.");
              return;
            }
            navigate("/notice/write");
          }}
          disabled={!canInsert}
          style={!canInsert ? { opacity: 0.5, cursor: "not-allowed" } : {}}
        >
          공지사항 등록
        </button>
      </div>
      <div className="notice-list-table-wrapper">
        <table className="notice-list-table">
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
                    className="notice-list-link"
                    onClick={() =>
                      navigate(`/notice/update/${notice.noticeIndex}`)
                    }
                  >
                    {notice.noticeTitle}
                  </span>
                </td>
                <td>{notice.userEmail}</td>
                <td>{formatDate(notice.noticeCreateTime)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
