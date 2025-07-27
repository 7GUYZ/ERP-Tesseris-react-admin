import { useState, useEffect } from "react";
import { getMyAlarmHistory } from "../../../api/auth/JiyoonAuth";
import "../../../styles/jiyun/alert/alert.css";

// 알림 설정 목데이터 (배열, key/label/active)
const initialSettings = [
  { key: "companyNotice", label: "공지사항 알림", active: 1 },
  { key: "companyInquiry", label: "공지사항 알림", active: 0 },
  { key: "qaNotice", label: "Q&A 알림", active: 1 },
  { key: "qaInquiry", label: "Q&A 알림", active: 0 },
  { key: "publicNotice", label: "공지사항 알림", active: 1 },
  { key: "publicInquiry", label: "공지사항 알림", active: 1 },
  { key: "generalQa", label: "Q&A 알림", active: 0 },
  { key: "generalInquiry", label: "Q&A 알림", active: 0 },
];

export default function AlertPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [settings, setSettings] = useState(initialSettings);

  useEffect(() => {
    const getAlarmList = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // localStorage에서 user_index 가져오기
        const userInfo = JSON.parse(localStorage.getItem("user-info"));
        const userIndex = userInfo?.user_index;

        if (!userIndex) {
          setError("사용자 정보를 찾을 수 없습니다.");
          return;
        }

        console.log("알림 데이터 로드 시작 - userIndex:", userIndex);
        
                       // 알림 내역만 로드 (통계는 프론트엔드에서 계산)
               const response = await getMyAlarmHistory(userIndex);
               
               console.log("알림 내역 응답:", response);
               
               // ResponseDTO 구조에서 data 추출
               console.log("전체 응답:", response);
               console.log("response.data:", response?.data);
               console.log("response.data.data:", response?.data?.data);
               console.log("response.data.data 타입:", typeof response?.data?.data);
               console.log("response.data.data가 배열인가?", Array.isArray(response?.data?.data));
               
               if (response && response.data && response.data.data && Array.isArray(response.data.data)) {
                 console.log("알림 데이터 설정:", response.data.data);
                 setNotifications(response.data.data);
               } else {
                 console.log("알림 데이터가 없거나 배열이 아님, 빈 배열 설정");
                 setNotifications([]);
               }
        
      } catch (error) {
        console.error("알림 데이터 로드 실패:", error);
        setError("알림 내역을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };
    getAlarmList();
  }, []);

           // 읽음/안읽음 분리 (isRead 기준) - 배열인지 확인 후 필터링
         const newNotifications = Array.isArray(notifications) ? notifications.filter((n) => n.isRead === 0) : [];
         const pastNotifications = Array.isArray(notifications) ? notifications.filter((n) => n.isRead === 1) : [];

  // 배열 기반 토글
  const handleSettingChange = (key) => {
    setSettings((prev) =>
      prev.map((item) =>
        item.key === key ? { ...item, active: item.active ? 0 : 1 } : item
      )
    );
  };

  // Toggle Switch Component
  const ToggleSwitch = ({ checked, onChange }) => (
    <label className="switch">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="switch-input"
      />
      <span className="slider"></span>
    </label>
  );

  // Notification Settings Component
  const NotificationSettings = ({ settings, onSettingChange }) => {
    return (
      <div className="alert-settings-container">
        <div className="alert-settings-header">
          <h2 className="alert-section-title">알림 설정</h2>
          <button className="alert-save-btn">저장</button>
        </div>
        <div className="alert-settings-grid">
          <div className="alert-settings-column">
            {settings.slice(0, 4).map((setting) => (
              <div key={setting.key} className="alert-setting-item">
                <span className="alert-setting-label">• {setting.label}</span>
                <ToggleSwitch
                  checked={!!setting.active}
                  onChange={() => onSettingChange(setting.key)}
                />
              </div>
            ))}
          </div>
          <div className="alert-settings-column">
            {settings.slice(4, 8).map((setting) => (
              <div key={setting.key} className="alert-setting-item">
                <span className="alert-setting-label">• {setting.label}</span>
                <ToggleSwitch
                  checked={!!setting.active}
                  onChange={() => onSettingChange(setting.key)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

           // Notification Row Component
         const NotificationRow = ({ notification, rowClassName }) => {
           // createdAt 배열을 Date 객체로 변환
           const formatCreatedAt = (createdAt) => {
             if (Array.isArray(createdAt)) {
               // [2025, 7, 27, 18, 8, 25] 형식을 Date로 변환
               const [year, month, day, hour, minute, second] = createdAt;
               return new Date(year, month - 1, day, hour, minute, second).toLocaleString('ko-KR');
             } else if (createdAt) {
               return new Date(createdAt).toLocaleString('ko-KR');
             }
             return '날짜 없음';
           };

           return (
             <tr className={rowClassName || "alert-notification-row"}>
               <td className="notification-title">
                 <div className="title-container">
                   <span className="title-text">{notification.message}</span>
                 </div>
                 <div className="notification-meta">
                   <span className="notification-date">
                     {formatCreatedAt(notification.createdAt)}
                   </span>
                 </div>
               </td>
             </tr>
           );
         };

  // Notification List Component
  const NotificationList = ({ notifications }) => {
    return (
      <div className="alert-list-container">
        <div className="alert-table-container">
          <table className="alert-notification-table">
            <tbody>
              {notifications.map((notification) => (
                <NotificationRow
                  key={notification.alarmId}
                  notification={notification}
                  rowClassName="alert-notification-row"
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // 신규/지난 알림 개수 표시 (100개 넘으면 100+)
  const newCount = newNotifications.length > 100 ? "100+" : newNotifications.length;
  const pastCount = pastNotifications.length > 100 ? "100+" : pastNotifications.length;

  if (loading) {
    return <div className="alert-loading">로딩 중...</div>;
  }

  if (error) {
    return <div className="alert-error">{error}</div>;
  }

           return (
           <div className="alert-root-container">
             <div className="content">
               {/* 알림 설정 섹션 */}
               <NotificationSettings settings={settings} onSettingChange={handleSettingChange} />
               {/* 새로운 알림 섹션 */}
        <div className="notification-section">
          <div className="section-header">
            <h2 className="alert-section-title">새로운 알림</h2>
            <span className="count">{newCount}</span>
          </div>
          <NotificationList notifications={newNotifications} />
        </div>
        {/* 지난 알림 섹션 */}
        <div className="notification-section">
          <div className="section-header">
            <h2 className="alert-section-title">지난 알림</h2>
            <span className="count">{pastCount}</span>
          </div>
          <NotificationList notifications={pastNotifications} />
        </div>
      </div>
    </div>
  );
}
