import { useState, useEffect } from "react";
import { getMyAlarmHistory, markAsRead } from "../../../api/auth/JiyoonAuth";
import "../../../styles/jiyun/alert/alert.css";
import {
  menuAuthority,
  getUserAlarmSetting,
  updateUserAlarmSetting,
} from "../../../api/auth/JungeunAuth";
import useNotificationStore from "../../../store/jiyun/NotificationStore";

// 알림 설정을 동적으로 생성하는 함수 (백엔드에서 설정 조회)
const createAlertSettingsFromAuthority = async (authorityList, userIndex) => {
  if (!authorityList || !Array.isArray(authorityList)) {
    return [];
  }

  const alertSettings = [];

  // 권한 목록을 순회하며 알림 설정 생성
  for (const auth of authorityList) {
    const { programIndex, menuIndex } = auth;

    // 특정 프로그램 인덱스에 따른 알림 설정 매핑
    let alarmTypesId = null;
    let label = "";

    switch (programIndex) {
      case 8: // 권한 관리
        alarmTypesId = 1;
        label = "권한 변경 알림";
        break;
      case 10: // CMS 관리자 명단
        alarmTypesId = 2;
        label = "관리자 추가/삭제 알림";
        break;
      case 38: // 월 CM 한도
        alarmTypesId = 3;
        label = "월 CM 한도 변경 알림";
        break;
      case 9: // 중개수수료율 관리
        alarmTypesId = 4;
        label = "중개수수료율 변경 알림";
        break;
      case 25: // 공지사항 관리
        alarmTypesId = 5;
        label = "공지사항 등록 알림";
        break;
      case 26: // Q&A 관리
        alarmTypesId = 6;
        label = "신규 Q&A 문의 알림";
        break;
      case 33: // 가맹점 신청 현황
        alarmTypesId = 8;
        label = "신규 가맹점 신청 알림";
        break;
      default:
        continue; // 매핑되지 않은 프로그램은 건너뛰기
    }

    try {
      // 백엔드에서 해당 알림 타입의 설정 조회
      const response = await getUserAlarmSetting(userIndex, alarmTypesId);
      const settingData = response.data;

      let active = 0; // 기본값: ON (알림 활성화)

      if (settingData.hasSetting) {
        // 설정이 있는 경우: 백엔드 값 사용
        active = settingData.isActive;
      }
      // 설정이 없는 경우: 기본값 0 (ON) 사용

      alertSettings.push({
        key: alarmTypesId,
        label: label,
        active: active,
        programIndex: programIndex,
        menuIndex: menuIndex,
        alarmTypesId: alarmTypesId,
      });
    } catch (error) {
      console.error(`알림 설정 조회 실패 - ${label}:`, error);

      // 에러 시 기본값으로 설정
      alertSettings.push({
        key: alarmTypesId,
        label: label,
        active: 0, // 기본값: ON (알림 활성화)
        programIndex: programIndex,
        menuIndex: menuIndex,
        alarmTypesId: alarmTypesId,
      });
    }
  }

  return alertSettings;
};

export default function AlertPage() {
  const [settings, setSettings] = useState([]);

  // 전역 상태에서 알림 데이터 가져오기
  const {
    notifications,
    loading,
    error,
    setNotifications,
    setLoading,
    setError,
    markAsRead: markAsReadGlobal,
  } = useNotificationStore();

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("user-info"));
    const adminTypeIndex = userInfo?.admin_type_index;

    // 특정 관리자 타입의 권한 조회
    const getAuthority = async (adminTypeIndex) => {
      try {
        const response = await menuAuthority(adminTypeIndex);

        // 사용자 정보 가져오기
        const userInfo = JSON.parse(localStorage.getItem("user-info"));
        const userIndex = userInfo?.user_index;

        if (!userIndex) {
          console.error("사용자 정보를 찾을 수 없습니다.");
          setSettings([]);
          return;
        }

        // 권한 조회 결과로 알림 설정 동적 생성 (백엔드에서 설정 조회)
        const authorityList = response.data.data;
        const alertSettings = await createAlertSettingsFromAuthority(
          authorityList,
          userIndex
        );
        setSettings(alertSettings);
      } catch (error) {
        console.error("권한 조회 실패:", error);
        // 권한 조회 실패 시 빈 배열로 설정
        setSettings([]);
      }
    };
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

        // 알림 내역만 로드 (통계는 프론트엔드에서 계산)
        const response = await getMyAlarmHistory(userIndex);

        if (
          response &&
          response.data &&
          response.data.data &&
          Array.isArray(response.data.data)
        ) {
          setNotifications(response.data.data);
        } else {
          setNotifications([]);
        }
      } catch (error) {
        console.error("알림 데이터 로드 실패:", error);
        setError("알림 내역을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };
    getAuthority(adminTypeIndex);
    getAlarmList();
  }, [setNotifications, setLoading, setError]);

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
      const userInfo = JSON.parse(localStorage.getItem("user-info"));
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

      // 백엔드에 업데이트 요청
      const response = await updateUserAlarmSetting(userIndex, key, newActive);

      if (response.data.success) {
        // 성공 시 로컬 상태 업데이트
        setSettings((prev) =>
          prev.map((item) =>
            item.key === key ? { ...item, active: newActive } : item
          )
        );
      }
    } catch (error) {
      // 에러 처리 (콘솔 로그 제거)
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
  const NotificationSettings = ({ settings, onSettingChange }) => {
    return (
      <div className="alert-settings-container">
        <div className="alert-settings-header">
          <h2 className="alert-section-title">알림 설정</h2>
        </div>
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
        <NotificationSettings
          settings={settings}
          onSettingChange={handleSettingChange}
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
