import { useState, useEffect } from "react";
import {
  searchCmsAccessLogs,
  getAdminTypes,
} from "../../../api/auth/JiyoonAuth";
import "../../../styles/jiyun/cmsAccessLog/CmsAccessLogPage.css";

const truncate = (str, maxLength = 30) => {
  if (!str) return "";
  return str.length > maxLength ? str.slice(0, maxLength) + "..." : str;
};

// 날짜 배열을 Date 객체로 변환하는 함수
function parseDate(arr) {
  if (!Array.isArray(arr) || arr.length < 3) return "";
  const [year, month, day, hour = 0, min = 0] = arr;
  return new Date(year, month - 1, day, hour, min, 0);
}

function formatDateToSecond(dateOrTimestamp) {
  let date;
  if (!dateOrTimestamp) return "";
  if (typeof dateOrTimestamp === "number") {
    date = new Date(dateOrTimestamp);
  } else if (Array.isArray(dateOrTimestamp)) {
    const [year, month, day, hour = 0, min = 0, sec = 0] = dateOrTimestamp;
    date = new Date(year, month - 1, day, hour, min, sec);
  } else if (
    typeof dateOrTimestamp === "string" &&
    !isNaN(Number(dateOrTimestamp))
  ) {
    date = new Date(Number(dateOrTimestamp));
  } else {
    date = new Date(dateOrTimestamp);
  }
  if (!date || isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");
  return `${y}-${m}-${d} ${h}:${min}:${s}`;
}

const CmsAccessLog = () => {
  const [searchParams, setSearchParams] = useState({
    userId: "",
    userName: "",
    cmsAccessUserIp: "",
    adminTypeIndex: "0",
    cmsAccessUserTimeStart: "",
    cmsAccessUserTimeEnd: "",
  });

  const [searchResults, setSearchResults] = useState([]);
  const [adminTypes, setAdminTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  const keys = [
    "userId",
    "userName",
    "cmsAccessUserValue",
    "adminTypeName",
    "cmsAccessUserIp",
    "cmsAccessUserTime",
  ];

  // 처음 마운트 시 전체 데이터 자동 조회
  useEffect(() => {
    loadAdminTypes();
    const fetchAll = async () => {
      setLoading(true);
      try {
        const response = await searchCmsAccessLogs({});
        if (response.data.resultCode === 200) {
          // 2차원 배열을 객체 배열로 매핑
          const mapped = Array.isArray(response.data.data)
            ? response.data.data.map((arr) =>
                keys.reduce(
                  (obj, key, idx) => ({ ...obj, [key]: arr[idx] }),
                  {}
                )
              )
            : [];
          setSearchResults(mapped);
        }
      } catch (error) {
        alert("전체 데이터 조회 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // 관리자 타입 목록 로드
  const loadAdminTypes = async () => {
    try {
      const response = await getAdminTypes();
      if (response.data.resultCode === 200) {
        setAdminTypes(response.data.data);
      }
    } catch (error) {
      console.error("관리자 타입 로드 실패:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchParams((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params = {};
      Object.keys(searchParams).forEach((key) => {
        if (searchParams[key] && searchParams[key].trim() !== "") {
          params[key] = searchParams[key];
        }
      });
      const response = await searchCmsAccessLogs(params);
      if (response.data.resultCode === 200) {
        // 2차원 배열을 객체 배열로 매핑
        const mapped = Array.isArray(response.data.data)
          ? response.data.data.map((arr) =>
              keys.reduce((obj, key, idx) => ({ ...obj, [key]: arr[idx] }), {})
            )
          : [];
        setSearchResults(mapped);
      } else {
        alert("검색 실패: " + response.data.resultMessage);
      }
    } catch (error) {
      alert("검색 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleExcelDownload = () => {
    // 엑셀 다운로드 로직 구현
    alert("엑셀 다운로드 기능은 추후 구현 예정입니다.");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString("ko-KR");
  };

  return (
    <div className="cms-access-log-search">
      <div className="search-header">
        <h2>CMS 접속 기록</h2>
        <div className="button-group">
          <button className="btn btn-excel" onClick={handleExcelDownload}>
            엑셀
          </button>
          <button
            className="btn btn-search"
            onClick={handleSearch}
            disabled={loading}
          >
            {loading ? "검색 중..." : "조회"}
          </button>
        </div>
      </div>

      <div className="search-form">
        <div className="form-row">
          <div className="form-group">
            <label>아이디</label>
            <input
              type="text"
              name="userId"
              value={searchParams.userId}
              onChange={handleInputChange}
              placeholder="검색명을 입력하세요."
            />
          </div>
          <div className="form-group">
            <label>이름</label>
            <input
              type="text"
              name="userName"
              value={searchParams.userName}
              onChange={handleInputChange}
              placeholder="검색명을 입력하세요."
            />
          </div>
          <div className="form-group">
            <label>IP</label>
            <input
              type="text"
              name="cmsAccessUserIp"
              value={searchParams.cmsAccessUserIp}
              onChange={handleInputChange}
              placeholder="검색명을 입력하세요."
            />
          </div>
          <div className="form-group">
            <label>등급</label>
            <select
              name="adminTypeIndex"
              value={searchParams.adminTypeIndex}
              onChange={handleInputChange}
            >
              <option value="0">등급을 선택하세요.</option>
              {adminTypes.map((type) => (
                <option key={type.adminTypeIndex} value={type.adminTypeIndex}>
                  {type.adminTypeName}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>발생일</label>
            <input
              type="date"
              name="cmsAccessUserTimeStart"
              value={searchParams.cmsAccessUserTimeStart}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label>~</label>
            <input
              type="date"
              name="cmsAccessUserTimeEnd"
              value={searchParams.cmsAccessUserTimeEnd}
              onChange={handleInputChange}
            />
          </div>
        </div>
      </div>

      <div className="search-results">
        <table className="results-table">
          <thead>
            <tr>
              <th>아이디</th>
              <th>이름</th>
              <th>로그</th>
              <th>권한</th>
              <th>접속 IP</th>
              <th>발생 시간</th>
            </tr>
          </thead>
          <tbody>
            {searchResults.map((log, index) => (
              <tr key={index}>
                <td>{log.userId || "-"}</td>
                <td>{log.userName || "-"}</td>
                <td title={log.cmsAccessUserValue || ""}>
                  {truncate(log.cmsAccessUserValue)}
                </td>
                <td>{log.adminTypeName || "-"}</td>
                <td>{log.cmsAccessUserIp || "-"}</td>
                <td>
                  {log.cmsAccessUserTime
                    ? formatDateToSecond(log.cmsAccessUserTime)
                    : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {searchResults.length === 0 && !loading && (
          <div className="no-results">검색 결과가 없습니다.</div>
        )}
      </div>
    </div>
  );
};

export default CmsAccessLog;
