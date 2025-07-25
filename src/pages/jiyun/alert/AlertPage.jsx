import { useState } from "react";
import "../../../styles/jiyun/alert/alert.css";

// 알림 목데이터 (명시적 객체 배열)
const notifications = [
  { id: 1, title: "권한이 수정되었습니다", content: "사용자 권한 설정이 변경되어 일부 기능에 대한 접근 권한이 업데이트되었습니다.", date: "2024-01-15 14:30", isRead: false },
  { id: 2, title: "공지사항이 등록되었습니다", content: "새로운 공지가 등록되었습니다. 확인해 주세요.", date: "2024-01-15 13:20", isRead: false },
  { id: 3, title: "시스템 업데이트가 완료되었습니다", content: "포인트 시스템 업데이트가 성공적으로 완료되었습니다. 새로운 기능을 확인해보세요.", date: "2024-01-15 12:15", isRead: false },
  { id: 4, title: "데이터베이스 백업이 완료되었습니다", content: "정기 데이터베이스 백업 작업이 성공적으로 완료되었습니다.", date: "2024-01-15 10:30", isRead: false },
  { id: 5, title: "보안 정책이 업데이트되었습니다", content: "보안 정책이 최신 상태로 업데이트되었습니다.", date: "2024-01-14 18:00", isRead: false },
  { id: 6, title: "사용자 계정이 생성되었습니다", content: "새로운 사용자 계정이 생성되었습니다.", date: "2024-01-14 15:10", isRead: true },
  { id: 7, title: "포인트 정산이 완료되었습니다", content: "포인트 정산이 정상적으로 완료되었습니다.", date: "2024-01-14 13:45", isRead: true },
  { id: 8, title: "공지사항이 등록되었습니다", content: "시스템 점검 안내 공지가 등록되었습니다.", date: "2024-01-14 11:30", isRead: true },
  { id: 9, title: "권한이 수정되었습니다", content: "관리자 권한이 변경되었습니다.", date: "2024-01-13 17:20", isRead: true },
  { id: 10, title: "시스템 업데이트가 완료되었습니다", content: "시스템이 최신 버전으로 업데이트되었습니다.", date: "2024-01-13 15:00", isRead: true },
  { id: 11, title: "데이터베이스 백업이 완료되었습니다", content: "DB 백업이 정상적으로 완료되었습니다.", date: "2024-01-13 10:00", isRead: true },
  { id: 12, title: "보안 정책이 업데이트되었습니다", content: "보안 정책이 강화되었습니다.", date: "2024-01-12 09:00", isRead: true },
  { id: 13, title: "보안 정책이 업데이트되었습니다", content: "보안 정책이 강화되었습니다.", date: "2024-01-12 09:00", isRead: true },
  { id: 14, title: "보안 정책이 업데이트되었습니다", content: "보안 정책이 강화되었습니다.", date: "2024-01-12 09:00", isRead: true },
];

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
  const [settings, setSettings] = useState(initialSettings);

  // 읽음/안읽음 분리
  const newNotifications = notifications.filter((n) => !n.isRead);
  const pastNotifications = notifications.filter((n) => n.isRead);

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
    return (
      <tr className={rowClassName || "alert-notification-row"}>
        <td className="notification-title">
          <div className="title-container">
            <span className="title-text">{notification.title}</span>
          </div>
          <div className="notification-meta">
            <span className="notification-date">{notification.date}</span>
          </div>
        </td>
      </tr>
    );
  };

  // Notification List Component
  const NotificationList = ({ notifications, type }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const displayNotifications =
      type === "past"
        ? notifications
        : notifications.slice(
            (currentPage - 1) * itemsPerPage,
            currentPage * itemsPerPage
          );
    const totalPages =
      type === "past" ? 1 : Math.ceil(notifications.length / itemsPerPage);
    const handlePageChange = (page) => {
      setCurrentPage(page);
    };
    return (
      <div className="alert-list-container">
        <div className="alert-table-container">
          <table className="alert-notification-table">
            <tbody>
              {displayNotifications.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  rowClassName="alert-notification-row"
                />
              ))}
            </tbody>
          </table>
        </div>
        {type === "new" && totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="page-btn"
            >
              이전
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`page-btn ${
                    currentPage === page ? "active-page" : ""
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() =>
                handlePageChange(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="page-btn"
            >
              다음
            </button>
            <span className="page-info">
              총 {notifications.length}개 중{" "}
              {(currentPage - 1) * itemsPerPage + 1}-
              {Math.min(currentPage * itemsPerPage, notifications.length)}개
              표시
            </span>
          </div>
        )}
      </div>
    );
  };

  // 신규/지난 알림 개수 표시 (100개 넘으면 100+)
  const newCount = newNotifications.length > 100 ? "100+" : newNotifications.length;
  const pastCount = pastNotifications.length > 100 ? "100+" : pastNotifications.length;

  return (
    <div className="alert-root-container">
      <div className="content">
        <NotificationSettings
          settings={settings}
          onSettingChange={handleSettingChange}
        />
        {/* 새로운 알림 섹션 */}
        <div className="notification-section">
          <div className="section-header">
            <h2 className="alert-section-title">새로운 알림</h2>
            <span className="count">{newCount}</span>
          </div>
          <NotificationList notifications={newNotifications} type="new" />
        </div>
        {/* 지난 알림 섹션 */}
        <div className="notification-section">
          <div className="section-header">
            <h2 className="alert-section-title">지난 알림</h2>
            <span className="count">{pastCount}</span>
          </div>
          <NotificationList notifications={pastNotifications} type="past" />
        </div>
      </div>
    </div>
  );
}
