"use client"

import { Bell, BellRing, MessageCircle, AlertCircle } from "lucide-react"

const NotificationVariants = () => {
  return (
    <div className="notification-variants">
      <h3>알림 아이콘 버전들</h3>

      {/* 버전 1: 기본 Bell */}
      <div className="variant-item">
        <button className="notification-button variant-1">
          <Bell size={18} />
          <span className="notification-dot"></span>
        </button>
        <span>기본 Bell</span>
      </div>

      {/* 버전 2: BellRing (움직이는 효과) */}
      <div className="variant-item">
        <button className="notification-button variant-2">
          <BellRing size={18} />
          <span className="notification-dot"></span>
        </button>
        <span>BellRing</span>
      </div>

      {/* 버전 3: 커스텀 SVG Bell */}
      <div className="variant-item">
        <button className="notification-button variant-3">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="notification-dot"></span>
        </button>
        <span>커스텀 SVG</span>
      </div>

      {/* 버전 4: 둥근 알림 */}
      <div className="variant-item">
        <button className="notification-button variant-4">
          <div className="round-notification">
            <span>4</span>
          </div>
        </button>
        <span>둥근 숫자</span>
      </div>

      {/* 버전 5: 메시지 스타일 */}
      <div className="variant-item">
        <button className="notification-button variant-5">
          <MessageCircle size={18} />
          <span className="notification-badge">4</span>
        </button>
        <span>메시지 스타일</span>
      </div>

      {/* 버전 6: 경고 스타일 */}
      <div className="variant-item">
        <button className="notification-button variant-6">
          <AlertCircle size={18} />
          <span className="notification-pulse"></span>
        </button>
        <span>경고 스타일</span>
      </div>

      <style jsx>{`
        .notification-variants {
          padding: 2rem;
          background: white;
          border-radius: 0.75rem;
          margin: 2rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .notification-variants h3 {
          margin-bottom: 2rem;
          color: #333;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .variant-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding: 1rem;
          border: 1px solid #f0f0f0;
          border-radius: 0.5rem;
        }

        .notification-button {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2.5rem;
          height: 2.5rem;
          background: none;
          border: none;
          border-radius: 50%;
          color: #666;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .notification-button:hover {
          background-color: #f5f5f5;
          color: #333;
        }

        .notification-dot {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          width: 0.5rem;
          height: 0.5rem;
          background-color: #3b82f6;
          border-radius: 50%;
          border: 2px solid white;
        }

        .notification-badge {
          position: absolute;
          top: -0.25rem;
          right: -0.25rem;
          background: #ef4444;
          color: white;
          border-radius: 50%;
          width: 1.25rem;
          height: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 600;
          border: 2px solid white;
        }

        .notification-pulse {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          width: 0.5rem;
          height: 0.5rem;
          background-color: #ef4444;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        .round-notification {
          width: 1.5rem;
          height: 1.5rem;
          background: #3b82f6;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .variant-2:hover {
          animation: ring 0.5s ease-in-out;
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          70% {
            transform: scale(1.4);
            opacity: 0;
          }
          100% {
            transform: scale(1.4);
            opacity: 0;
          }
        }

        @keyframes ring {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-10deg); }
          75% { transform: rotate(10deg); }
        }
      `}</style>
    </div>
  )
}

export default NotificationVariants
