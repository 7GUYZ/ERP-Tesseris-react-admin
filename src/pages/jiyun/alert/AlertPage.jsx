import { useState } from "react";
import "../../../styles/jiyun/alert/alert.css";

export default function AlertPage() {
  const [settings, setSettings] = useState({
    companyNotice: true,
    companyInquiry: false,
    qaNotice: true,
    qaInquiry: false,
    publicNotice: true,
    publicInquiry: true,
    generalQa: false,
    generalInquiry: false,
  });

  const newNotifications = [
    {
      id: 1,
      title: "권한이 수정되었습니다",
      content:
        "사용자 권한 설정이 변경되어 일부 기능에 대한 접근 권한이 업데이트되었습니다.",
      date: "2024-01-15 14:30",
      isRead: false,
    },
    {
      id: 2,
      title: "공지사항이 등록되었습니다",
      content: "",
      date: "2024-01-15 13:20",
      isRead: false,
    },
    {
      id: 3,
      title: "시스템 업데이트가 완료되었습니다",
      content:
        "포인트 시스템 업데이트가 성공적으로 완료되었습니다. 새로운 기능을 확인해보세요.",
      date: "2024-01-15 12:15",
      isRead: false,
    },
    {
      id: 4,
      title: "공지사항이 등록되었습니다",
      content: "",
      date: "2024-01-15 11:45",
      isRead: false,
    },
    {
      id: 5,
      title: "데이터베이스 백업이 완료되었습니다",
      content: "정기 데이터베이스 백업 작업이 성공적으로 완료되었습니다.",
      date: "2024-01-15 10:30",
      isRead: false,
    },
  ];

  const pastNotifications = Array.from({ length: 100 }, (_, index) => {
    const titles = [
      "권한이 수정되었습니다",
      "공지사항이 등록되었습니다",
      "시스템 업데이트가 완료되었습니다",
      "사용자 계정이 생성되었습니다",
      "포인트 정산이 완료되었습니다",
      "데이터베이스 백업이 완료되었습니다",
      "보안 정책이 업데이트되었습니다",
    ];
    const title = titles[index % titles.length];
    const isNotice = title === "공지사항이 등록되었습니다";
    return {
      id: index + 6,
      title: title,
      content: isNotice ? "" : "이전 알림 내용입니다.",
      date: `2024-01-${String(14 - Math.floor(index / 7)).padStart(
        2,
        "0"
      )} ${String(23 - (index % 24)).padStart(2, "0")}:${String(
        59 - (index % 60)
      ).padStart(2, "0")}`,
      isRead: true,
    };
  });

  const handleSettingChange = (key) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
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
    const settingsConfig = [
      { key: "companyNotice", label: "공지사항 알림" },
      { key: "companyInquiry", label: "공지사항 알림" },
      { key: "qaNotice", label: "Q&A 알림" },
      { key: "qaInquiry", label: "Q&A 알림" },
      { key: "publicNotice", label: "공지사항 알림" },
      { key: "publicInquiry", label: "공지사항 알림" },
      { key: "generalQa", label: "Q&A 알림" },
      { key: "generalInquiry", label: "Q&A 알림" },
    ];
    return (
      <div className="settings-container">
        <div className="settings-header">
          <h2>알림 설정</h2>
          <button className="save-btn">저장</button>
        </div>
        <div className="settings-grid">
          <div className="settings-column">
            {settingsConfig.slice(0, 4).map((setting) => (
              <div key={setting.key} className="setting-item">
                <span className="setting-label">• {setting.label}</span>
                <ToggleSwitch
                  checked={settings[setting.key]}
                  onChange={() => onSettingChange(setting.key)}
                />
              </div>
            ))}
          </div>
          <div className="settings-column">
            {settingsConfig.slice(4, 8).map((setting) => (
              <div key={setting.key} className="setting-item">
                <span className="setting-label">• {setting.label}</span>
                <ToggleSwitch
                  checked={settings[setting.key]}
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
  const NotificationRow = ({ notification }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const handleToggleExpand = () => {
      if (notification.content) {
        setIsExpanded(!isExpanded);
      }
    };
    return (
      <>
        <tr className="notification-row">
          <td className="notification-title">
            <div className="title-container">
              <button
                onClick={handleToggleExpand}
                className="title-btn"
                disabled={!notification.content}
              >
                {notification.title}
              </button>
            </div>
            <div className="notification-meta">
              <span className="notification-date">{notification.date}</span>
            </div>
          </td>
        </tr>
        {isExpanded && notification.content && (
          <tr className="expanded-row">
            <td>
              <div className="expanded-content">
                <p>{notification.content}</p>
              </div>
            </td>
          </tr>
        )}
      </>
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
      <div className="list-container">
        <div
          className={`table-container ${
            type === "past" ? "scroll-container" : ""
          }`}
        >
          <table className="notification-table">
            <tbody>
              {displayNotifications.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
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

  return (
    <div className="container">
      <div className="content">
        <NotificationSettings
          settings={settings}
          onSettingChange={handleSettingChange}
        />
        {/* 새로운 알림 섹션 */}
        <div className="notification-section">
          <div className="section-header">
            <h2 className="section-title">새로운 알림</h2>
            <span className="count">5</span>
          </div>
          <NotificationList notifications={newNotifications} type="new" />
        </div>
        {/* 지난 알림 섹션 */}
        <div className="notification-section">
          <div className="section-header">
            <h2 className="section-title">지난 알림</h2>
            <span className="count">100+</span>
          </div>
          <NotificationList notifications={pastNotifications} type="past" />
        </div>
      </div>
    </div>
  );
}
