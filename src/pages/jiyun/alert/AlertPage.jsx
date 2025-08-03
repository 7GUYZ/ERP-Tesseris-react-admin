import { useState, useEffect } from "react";
import { getMyAlarmHistory, markAsRead } from "../../../api/auth/JiyoonAuth";
import "../../../styles/jiyun/alert/alert.css";
import {
  menuAuthority,
  getUserAlarmSetting,
  updateUserAlarmSetting,
} from "../../../api/auth/JungeunAuth";
import useNotificationStore from "../../../store/jiyun/NotificationStore";
import LoadingSpinner from "../../../components/ui/jungeun/LoadingSpinner";

// 알림 설정을 정적으로 생성하는 함수 (백엔드 API 호출 없이)
const createAlertSettingsFromAuthority = (authorityList) => {
  if (!authorityList || !Array.isArray(authorityList)) {
    return [];
  }

  // 매핑 가능한 권한만 필터링
  const mappableAuthorities = authorityList.filter(auth => {
    const { programIndex } = auth;
    return [8, 10, 38, 9, 25, 26, 33].includes(programIndex);
  });

  if (mappableAuthorities.length === 0) {
    return [];
  }

  // 알림 타입 매핑 객체
  const alarmTypeMapping = {
    8: { alarmTypesId: 1, label: "권한 변경 알림" },
    10: { alarmTypesId: 2, label: "관리자 추가/삭제 알림" },
    38: { alarmTypesId: 3, label: "월 CM 한도 변경 알림" },
    9: { alarmTypesId: 4, label: "중개수수료율 변경 알림" },
    25: { alarmTypesId: 5, label: "공지사항 등록 알림" },
    26: { alarmTypesId: 6, label: "신규 Q&A 문의 알림" },
    33: { alarmTypesId: 8, label: "신규 가맹점 신청 알림" }
  };

  // 권한에 따라 기본 설정 생성 (모든 설정을 ON으로 초기화)
  return mappableAuthorities.map(auth => {
    const { programIndex, menuIndex } = auth;
    const mapping = alarmTypeMapping[programIndex];
    
    if (!mapping) return null;

    return {
      key: mapping.alarmTypesId,
      label: mapping.label,
      active: 0, // 기본값: ON (알림 활성화)
      programIndex: programIndex,
      menuIndex: menuIndex,
      alarmTypesId: mapping.alarmTypesId,
    };
  }).filter(result => result !== null);
};

export default function AlertPage() {
  const [settings, setSettings] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState(null);
  const [notificationsLoaded, setNotificationsLoaded] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState(false);

  // 전역 상태에서 알림 데이터 가져오기
  const {
    notifications,
    setNotifications,
    markAsRead: markAsReadGlobal,
  } = useNotificationStore();

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("admin-info"));
    const adminTypeIndex = userInfo?.admin_type_index;

    // 전체 페이지 로딩 처리
    const loadPageData = async () => {
      try {
        setPageLoading(true);
        setPageError(null);
        
        // 사용자 정보 미리 가져오기
        const userInfo = JSON.parse(localStorage.getItem("admin-info"));
        const userIndex = userInfo?.user_index;

        if (!userIndex) {
          throw new Error("사용자 정보를 찾을 수 없습니다.");
        }

        // 1. 권한 조회와 알림 내역을 병렬로 실행
        const [authorityResponse, alarmResponse] = await Promise.all([
          menuAuthority(adminTypeIndex),
          getMyAlarmHistory(userIndex)
        ]);

        // 2. 알림 내역 설정
        if (
          alarmResponse &&
          alarmResponse.data &&
          alarmResponse.data.data &&
          Array.isArray(alarmResponse.data.data)
        ) {
          setNotifications(alarmResponse.data.data);
        } else {
          setNotifications([]);
        }

        // 3. 권한 기반 알림 설정 즉시 생성 (API 호출 없이)
        const authorityList = authorityResponse.data.data;
        const alertSettings = createAlertSettingsFromAuthority(authorityList);
        setSettings(alertSettings);
        setSettingsLoaded(true);
        setNotificationsLoaded(true);

      } catch (error) {
        console.error("페이지 데이터 로드 실패:", error);
        setPageError("데이터를 불러오는데 실패했습니다.");
      } finally {
        setPageLoading(false);
      }
    };
    
    loadPageData();
  }, [setNotifications]);

  // 읽음/안읽음 분리 (isRead 기준) - 배열인지 확인 후 필터링
  const newNotifications = Array.isArray(notifications)
    ? notifications.filter((n) => n.isRead === 0)
    : [];
  const pastNotifications = Array.isArray(notifications)
    ? notifications.filter((n) => n.isRead === 1)
    : [];

  // 배열 기반 토글 (0=ON, 1=OFF) - 백엔드에 저장
  const handleSettingChange = async (key) => {
    try {
      // 사용자 정보 가져오기
      const userInfo = JSON.parse(localStorage.getItem("admin-info"));
      const userIndex = userInfo?.user_index;

      if (!userIndex) {
        console.error("사용자 정보를 찾을 수 없습니다.");
        return;
      }

      // 현재 설정 찾기
      const currentSetting = settings.find((item) => item.key === key);
      if (!currentSetting) {
        console.error("설정을 찾을 수 없습니다.");
        return;
      }

      // 새로운 상태 계산 (0=ON, 1=OFF)
      const newActive = currentSetting.active === 0 ? 1 : 0;

      // 즉시 UI 업데이트 (사용자 경험 개선)
      setSettings((prev) =>
        prev.map((item) =>
          item.key === key ? { ...item, active: newActive } : item
        )
      );

      // 백엔드에 업데이트 요청 (백그라운드에서 실행)
      try {
        const response = await updateUserAlarmSetting(userIndex, key, newActive);
        if (!response.data.success) {
          // 실패 시 원래 상태로 되돌리기
          setSettings((prev) =>
            prev.map((item) =>
              item.key === key ? { ...item, active: currentSetting.active } : item
            )
          );
        }
      } catch (error) {
        console.error("알림 설정 업데이트 실패:", error);
        // 실패 시 원래 상태로 되돌리기
        setSettings((prev) =>
          prev.map((item) =>
            item.key === key ? { ...item, active: currentSetting.active } : item
          )
        );
      }
    } catch (error) {
      console.error("알림 설정 변경 중 오류:", error);
    }
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
  const NotificationSettings = ({ settings, onSettingChange, expanded, onToggle }) => {
    return (
      <div className="alert-settings-container">
        <div 
          className="alert-settings-header"
          onClick={onToggle}
          style={{ cursor: 'pointer' }}
        >
          <div className="header-content">
            <span className="settings-toggle-icon">
              {expanded ? '▼' : '▶'}
            </span>
            <h2 className="alert-section-title">알림 설정</h2>
          </div>
        </div>
        {expanded && (
          <div className="alert-settings-grid">
            <div className="alert-settings-column">
              {settings.slice(0, 4).map((setting) => (
                <div key={setting.key} className="alert-setting-item">
                  <span className="alert-setting-label">• {setting.label}</span>
                  <ToggleSwitch
                    checked={setting.active === 0}
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
                    checked={setting.active === 0}
                    onChange={() => onSettingChange(setting.key)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
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
        return new Date(
          year,
          month - 1,
          day,
          hour,
          minute,
          second
        ).toLocaleString("ko-KR");
      } else if (createdAt) {
        return new Date(createdAt).toLocaleString("ko-KR");
      }
      return "날짜 없음";
    };

    // 알림 클릭 핸들러 (읽음 처리)
    const handleNotificationClick = async (notification) => {
      try {
        // 읽음 처리 API 호출
        await markAsRead(notification.alarmId);

        // 전역 상태 업데이트 (Popover도 함께 업데이트됨)
        markAsReadGlobal(notification.alarmId);
      } catch (error) {
        console.error("알림 읽음 처리 실패:", error);
      }
    };

    return (
      <tr
        className={rowClassName || "alert-notification-row"}
        onClick={() => handleNotificationClick(notification)}
        style={{ cursor: "pointer" }}
      >
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
  const newCount =
    newNotifications.length > 100 ? "100+" : newNotifications.length;
  const pastCount =
    pastNotifications.length > 100 ? "100+" : pastNotifications.length;

  // 전체 페이지 로딩 상태
  if (pageLoading) {
    return (
      <div className="alert-root-container">
        <LoadingSpinner 
          size="large"
          text="알림 내역 불러오는 중..."
          fullScreen={false}
          className="alert-loading-spinner"
        />
      </div>
    );
  }

  // 전체 페이지 에러 상태
  if (pageError) {
    return (
      <div className="alert-root-container">
        <div className="content">
          <div className="alert-error">
            <p>{pageError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
          <div className="alert-root-container">
        <div className="content">
          {/* 알림 설정 섹션 */}
          <NotificationSettings
            settings={settings}
            onSettingChange={handleSettingChange}
            expanded={settingsExpanded}
            onToggle={() => setSettingsExpanded(!settingsExpanded)}
          />
          {/* 새로운 알림 섹션 */}
          <div className="notification-section">
            <div className="section-header">
              <div>
                <h2 className="alert-section-title">새로운 알림</h2>
                <p className="alert-section-description">
                  클릭 시 읽음 처리됩니다
                </p>
              </div>
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
