import React, { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { getMyAlarmHistory } from "../../../../api/auth/JiyoonAuth";
import useNotificationStore from "../../../../store/jiyun/NotificationStore";
import '../../../../styles/jiyun/popover/popover.css';

const Popover = () => {
  const [showPopover, setShowPopover] = useState(false);
  const bellRef = useRef(null);
  const popoverRef = useRef(null);
  
  // 전역 상태에서 알림 데이터 가져오기
  const { notifications, loading, error, setNotifications, setLoading, setError } = useNotificationStore();

  // 알림 데이터 로드 (지연 로딩 추가)
  useEffect(() => {
    const getAlarmList = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 토큰 체크 추가
        const token = localStorage.getItem("access-token");
        if (!token) {
          console.log("Popover: 토큰이 없어서 알림 데이터를 불러오지 않습니다.");
          setNotifications([]);
          setLoading(false);
          return;
        }
        
        // localStorage에서 user_index 가져오기
        const userInfo = JSON.parse(localStorage.getItem("user-info"));
        const userIndex = userInfo?.user_index;

        if (!userIndex) {
          setError("사용자 정보를 찾을 수 없습니다.");
          return;
        }

        console.log("Popover 알림 데이터 로드 시작 - userIndex:", userIndex);
        console.log("Popover 토큰 확인:", token ? "토큰 있음" : "토큰 없음");
        
        const response = await getMyAlarmHistory(userIndex);
        
        console.log("Popover 알림 내역 응답:", response);
        console.log("전체 응답:", response);
        console.log("response.data:", response?.data);
        console.log("response.data.data:", response?.data?.data);
        console.log("response.data.data 타입:", typeof response?.data?.data);
        console.log("response.data.data가 배열인가?", Array.isArray(response?.data?.data));
        
        if (response && response.data && response.data.data && Array.isArray(response.data.data)) {
          console.log("Popover 알림 데이터 설정:", response.data.data);
          setNotifications(response.data.data);
        } else {
          console.log("Popover 알림 데이터가 없거나 배열이 아님, 빈 배열 설정");
          setNotifications([]);
        }
        
      } catch (error) {
        console.error("Popover 알림 데이터 로드 실패:", error);
        console.error("에러 상세 정보:", error.response?.data);
        setError("알림 내역을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    // 지연 로딩: 인터셉터가 완전히 설정될 때까지 대기
    const timer = setTimeout(() => {
      getAlarmList();
    }, 1000); // 1초 지연

    return () => clearTimeout(timer);
  }, [setNotifications, setLoading, setError]);

  // 신규 알림만 필터링 (isRead === 0)
  const newNotifications = Array.isArray(notifications) ? notifications.filter((n) => n.isRead === 0) : [];

  const handleBellClick = () => setShowPopover((prev) => !prev);

  useEffect(() => {
    if (!showPopover) return;
    function handleClickOutside(e) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        bellRef.current &&
        !bellRef.current.contains(e.target)
      ) {
        setShowPopover(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPopover]);

  // createdAt 배열을 Date 객체로 변환하는 함수
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
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button className="notification-button" onClick={handleBellClick} ref={bellRef} style={{ position: 'relative' }}>
        <Bell size={20} />
        {newNotifications.length > 0 && (
          <span className="notification-popover-badge" style={{ top: 2, right: 2, position: 'absolute' }}>
            {newNotifications.length > 100 ? "100+" : newNotifications.length}
          </span>
        )}
      </button>
      {showPopover && (
        <div style={{ position: 'absolute', top: '40px', right: 0, zIndex: 100 }} ref={popoverRef}>
          <div className="notification-popover-dropdown">
            <div className="notification-popover-header">
              <h3>알림</h3>
              <span className="notification-popover-count">
                {newNotifications.length > 100 ? "100+" : newNotifications.length}개
              </span>
            </div>
            <div className="notification-popover-list">
              {loading ? (
                <div className="notification-popover-item">
                  <div className="notification-popover-content">로딩 중...</div>
                </div>
              ) : error ? (
                <div className="notification-popover-item">
                  <div className="notification-popover-content">{error}</div>
                </div>
              ) : newNotifications.length === 0 ? (
                <div className="notification-popover-item">
                  <div className="notification-popover-content">새로운 알림이 없습니다</div>
                </div>
              ) : (
                newNotifications.map((notification) => (
                  <div key={notification.alarmId} className="notification-popover-item">
                    <div className="notification-popover-content">{notification.message}</div>
                    <div className="notification-popover-date">
                      {formatCreatedAt(notification.createdAt)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Popover;
