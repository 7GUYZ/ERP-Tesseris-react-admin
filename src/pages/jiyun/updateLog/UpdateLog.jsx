import { useState, useEffect } from "react";
import "../../../styles/jiyun/updateLog/update-log.css";
import { getUpdateLog } from "../../../api/auth/JiyoonAuth";

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

function formatDateToMinute(date) {
  if (!date || isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d} ${h}:${min}`;
}

const UpdateLog = () => {
  const [searchParams, setSearchParams] = useState({
    updateUserId: "",
    inflictUserId: "",
    updateDataValue: "",
    updateUserLogUpdateTimeStart: "",
    updateUserLogUpdateTimeEnd: "",
  });

  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // 처음 마운트 시 전체 데이터 자동 조회
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const response = await getUpdateLog({});
        setSearchResults(response.data);
      } catch (error) {
        alert("전체 데이터 조회 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

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
      const response = await getUpdateLog(params);
      setSearchResults(response.data);
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
    <div className="update-log-search">
      <div className="search-header">
        <h2>사용자 업데이트 로그</h2>
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
            <label>아이디(수정자)</label>
            <input
              type="text"
              name="updateUserId"
              value={searchParams.updateUserId}
              onChange={handleInputChange}
              placeholder="검색명을 입력하세요."
            />
          </div>
          <div className="form-group">
            <label>아이디</label>
            <input
              type="text"
              name="inflictUserId"
              value={searchParams.inflictUserId}
              onChange={handleInputChange}
              placeholder="검색명을 입력하세요."
            />
          </div>
          <div className="form-group">
            <label>프로그램명</label>
            <input
              type="text"
              name="updateDataValue"
              value={searchParams.updateDataValue}
              onChange={handleInputChange}
              placeholder="검색명을 입력하세요."
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>발생일</label>
            <input
              type="date"
              name="updateUserLogUpdateTimeStart"
              value={searchParams.updateUserLogUpdateTimeStart}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label>~</label>
            <input
              type="date"
              name="updateUserLogUpdateTimeEnd"
              value={searchParams.updateUserLogUpdateTimeEnd}
              onChange={handleInputChange}
            />
          </div>
        </div>
      </div>

      <div className="search-results">
        <table className="results-table">
          <thead>
            <tr>
              <th>수정자 ID</th>
              <th>수정자 역할</th>
              <th>대상 ID</th>
              <th>대상 역할</th>
              <th>프로그램명</th>
              <th>수정 전 데이터</th>
              <th>수정 후 데이터</th>
              <th>수정 시간</th>
            </tr>
          </thead>
          <tbody>
            {searchResults.map((log, index) => (
              <tr key={index}>
                <td>{log.updateUserId || "-"}</td>
                <td>{log.updateUserRoleNm1 || "-"}</td>
                <td>{log.inflictUserId || "-"}</td>
                <td>{log.updateUserRoleNm2 || "-"}</td>
                <td>{log.updateDataValue || "-"}</td>
                <td title={log.updateBeforeData || ""}>
                  {truncate(log.updateBeforeData)}
                </td>
                <td title={log.updateAfterData || ""}>
                  {truncate(log.updateAfterData)}
                </td>
                <td>
                  {log.updateUserLogUpdateTime
                    ? formatDateToMinute(parseDate(log.updateUserLogUpdateTime))
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

export default UpdateLog;
