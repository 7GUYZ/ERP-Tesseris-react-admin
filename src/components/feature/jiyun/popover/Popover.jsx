import React, { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import '../../../../styles/jiyun/popover/popover.css';

const initialNotifications = [
  { idx: 1, content: '권한이 수정되었습니다', date: '2024-06-01' },
  { idx: 2, content: '새로운 공지가 등록되었습니다', date: '2024-06-02' },
  { idx: 3, content: '비밀번호가 변경되었습니다', date: '2024-06-03' },
  { idx: 4, content: '로그인이 감지되었습니다', date: '2024-06-04' },
  { idx: 5, content: '계정이 활성화되었습니다', date: '2024-06-05' },
];

const Popover = () => {
  const [showPopover, setShowPopover] = useState(false);
  const [notifications] = useState(initialNotifications);
  const bellRef = useRef(null);
  const popoverRef = useRef(null);

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

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button className="notification-button" onClick={handleBellClick} ref={bellRef} style={{ position: 'relative' }}>
        <Bell size={20} />
        {notifications.length > 0 && (
          <span className="notification-popover-badge" style={{ top: 2, right: 2, position: 'absolute' }}>
            {notifications.length}
          </span>
        )}
      </button>
      {showPopover && (
        <div style={{ position: 'absolute', top: '40px', right: 0, zIndex: 100 }} ref={popoverRef}>
          <div className="notification-popover-dropdown">
            <div className="notification-popover-header">
              <h3>알림</h3>
              <span className="notification-popover-count">{notifications.length}개</span>
            </div>
            <div className="notification-popover-list">
              {notifications.map((item) => (
                <div key={item.idx} className="notification-popover-item">
                  <div className="notification-popover-content">{item.content}</div>
                  <div className="notification-popover-date">{item.date}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Popover;
