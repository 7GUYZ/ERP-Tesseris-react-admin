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
  const [searchTerm, setSearchTerm] = useState("");
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
        <h1 className="notice-page-title">공지사항 목록</h1>
        <p>로딩 중...</p>
      </div>
    );

  if (error) return <div>{error}</div>;

  // 백엔드에서 최신순으로 정렬되어 옴
  const sortedList = list;
  
  // 검색어에 따라 공지사항 필터링
  const filteredList = sortedList.filter(notice => 
    notice.noticeTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // 중요공지사항 3개 추출 (검색된 결과에서)
  const importantNotices = filteredList.filter(notice => notice.noticeType === '중요').slice(0, 3);
  
  // 전체 공지사항 리스트 (검색된 결과에서)
  const allNotices = filteredList;

  return (
    <div className="notice-list-page">
      <div className="notice-page-header">
        <h1 className="notice-page-title">공지사항 목록</h1>
        <div className="notice-header-actions">
          <button
            className="notice-update-btn notice-update-btn-primary"
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
            등록
          </button>
        </div>
      </div>
      
      {/* 검색 입력창 */}
      <div className="notice-search-container">
        <input
          type="text"
          placeholder="제목으로 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="notice-search-input"
        />
      </div>
      
      {/* 통합 공지사항 리스트 */}
      <div className="notice-list-table-wrapper">
        <table className="notice-list-table">
          <thead>
            <tr>
              <th>#</th>
              <th>분류</th>
              <th>제목</th>
              <th>작성자</th>
              <th>등록일</th>
            </tr>
          </thead>
          <tbody>
            {/* 중요공지사항 (번호 없음) */}
            {importantNotices.map((notice) => (
              <tr 
                key={notice.noticeIndex}
                className="important-notice"
              >
                <td>-</td>
                <td>
                  <span className="notice-type-badge important">중요</span>
                </td>
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
            
            {/* 전체 공지사항 (번호 있음) */}
            {allNotices.map((notice, idx) => (
              <tr 
                key={notice.noticeIndex}
              >
                <td>{idx + 1}</td>
                <td>
                  <span className={`notice-type-badge ${notice.noticeType === '중요' ? 'important' : 'normal'}`}>
                    {notice.noticeType === '중요' ? '중요' : '일반'}
                  </span>
                </td>
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
