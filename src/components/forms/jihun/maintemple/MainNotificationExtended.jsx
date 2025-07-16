"use client"

import { Bell, BellRing, MessageCircle, Mail, Zap } from "lucide-react"

const NotificationVariantsExtended = () => {
  return (
    <div className="notification-variants">
      <h3>알림 아이콘 다양한 버전들</h3>

      <div className="variants-grid">
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

        {/* 버전 4: 플랫 디자인 Bell */}
        <div className="variant-item">
          <button className="notification-button variant-4">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 19V20H3V19L5 17V11C5 7.9 7.03 5.17 10 4.29C10 4.19 10 4.1 10 4C10 2.9 10.9 2 12 2S14 2.9 14 4C14 4.1 14 4.19 14 4.29C16.97 5.17 19 7.9 19 11V17L21 19ZM12 22C13.11 22 14 21.11 14 20H10C10 21.11 10.89 22 12 22Z" />
            </svg>
            <span className="notification-dot"></span>
          </button>
          <span>플랫 디자인</span>
        </div>

        {/* 버전 5: 둥근 알림 */}
        <div className="variant-item">
          <button className="notification-button variant-5">
            <div className="round-notification">
              <span>4</span>
            </div>
          </button>
          <span>둥근 숫자</span>
        </div>

        {/* 버전 6: 메시지 스타일 */}
        <div className="variant-item">
          <button className="notification-button variant-6">
            <MessageCircle size={18} />
            <span className="notification-badge">4</span>
          </button>
          <span>메시지 스타일</span>
        </div>

        {/* 버전 7: 메일 스타일 */}
        <div className="variant-item">
          <button className="notification-button variant-7">
            <Mail size={18} />
            <span className="notification-badge">12</span>
          </button>
          <span>메일 스타일</span>
        </div>

        {/* 버전 8: 번개 스타일 */}
        <div className="variant-item">
          <button className="notification-button variant-8">
            <Zap size={18} />
            <span className="notification-pulse"></span>
          </button>
          <span>번개 스타일</span>
        </div>

        {/* 버전 9: 미니멀 도트 */}
        <div className="variant-item">
          <button className="notification-button variant-9">
            <div className="minimal-bell">
              <div className="bell-body"></div>
              <div className="bell-handle"></div>
            </div>
            <span className="notification-dot"></span>
          </button>
          <span>미니멀 도트</span>
        </div>

        {/* 버전 10: 그라데이션 Bell */}
        <div className="variant-item">
          <button className="notification-button variant-10">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="url(#gradient)" stroke="none">
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 19V20H3V19L5 17V11C5 7.9 7.03 5.17 10 4.29C10 4.19 10 4.1 10 4C10 2.9 10.9 2 12 2S14 2.9 14 4C14 4.1 14 4.19 14 4.29C16.97 5.17 19 7.9 19 11V17L21 19ZM12 22C13.11 22 14 21.11 14 20H10C10 21.11 10.89 22 12 22Z" />
            </svg>
            <span className="notification-glow"></span>
          </button>
          <span>그라데이션</span>
        </div>

        {/* 버전 11: 3D 스타일 */}
        <div className="variant-item">
          <button className="notification-button variant-11">
            <div className="bell-3d">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 19V20H3V19L5 17V11C5 7.9 7.03 5.17 10 4.29C10 4.19 10 4.1 10 4C10 2.9 10.9 2 12 2S14 2.9 14 4C14 4.1 14 4.19 14 4.29C16.97 5.17 19 7.9 19 11V17L21 19ZM12 22C13.11 22 14 21.11 14 20H10C10 21.11 10.89 22 12 22Z" />
              </svg>
            </div>
            <span className="notification-bounce">!</span>
          </button>
          <span>3D 스타일</span>
        </div>

        {/* 버전 12: 네온 스타일 */}
        <div className="variant-item">
          <button className="notification-button variant-12">
            <div className="neon-bell">
              <Bell size={18} />
            </div>
            <span className="notification-neon"></span>
          </button>
          <span>네온 스타일</span>
        </div>
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

        .variants-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
        }

        .variant-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem;
          border: 1px solid #f0f0f0;
          border-radius: 0.5rem;
          transition: all 0.2s ease;
        }

        .variant-item:hover {
          border-color: #3b82f6;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
        }

        .notification-button {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 3rem;
          height: 3rem;
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
          transform: scale(1.1);
        }

        .notification-dot {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          width: 0.5rem;
          height: 0.5rem;
          background-color: #3b82f6;
          border-radius: 50%;
          border: 2px solid white;
        }

        .notification-badge {
          position: absolute;
          top: 0.25rem;
          right: 0.25rem;
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
          top: 0.75rem;
          right: 0.75rem;
          width: 0.5rem;
          height: 0.5rem;
          background-color: #ef4444;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        .notification-glow {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          width: 0.5rem;
          height: 0.5rem;
          background-color: #8b5cf6;
          border-radius: 50%;
          box-shadow: 0 0 10px #8b5cf6;
          animation: glow 2s infinite alternate;
        }

        .notification-bounce {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          background: #f59e0b;
          color: white;
          border-radius: 50%;
          width: 1rem;
          height: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: bold;
          animation: bounce 1s infinite;
        }

        .notification-neon {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          width: 0.5rem;
          height: 0.5rem;
          background-color: #00ff88;
          border-radius: 50%;
          box-shadow: 0 0 5px #00ff88, 0 0 10px #00ff88, 0 0 15px #00ff88;
          animation: neon 1.5s infinite alternate;
        }

        .round-notification {
          width: 2rem;
          height: 2rem;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 0.875rem;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .minimal-bell {
          position: relative;
          width: 18px;
          height: 18px;
        }

        .bell-body {
          width: 14px;
          height: 14px;
          border: 2px solid currentColor;
          border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
          position: absolute;
          top: 2px;
          left: 2px;
        }

        .bell-handle {
          width: 4px;
          height: 4px;
          border: 2px solid currentColor;
          border-radius: 50%;
          position: absolute;
          top: 0;
          left: 7px;
        }

        .bell-3d {
          filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3));
          color: #3b82f6;
        }

        .neon-bell {
          color: #00ff88;
          filter: drop-shadow(0 0 5px #00ff88);
        }

        .variant-2:hover {
          animation: ring 0.5s ease-in-out;
        }

        .variant-8:hover {
          animation: flash 0.3s ease-in-out;
        }

        .variant-12:hover .neon-bell {
          animation: neonFlicker 0.5s ease-in-out;
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

        @keyframes glow {
          0% {
            box-shadow: 0 0 5px #8b5cf6;
          }
          100% {
            box-shadow: 0 0 20px #8b5cf6, 0 0 30px #8b5cf6;
          }
        }

        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-10px);
          }
          60% {
            transform: translateY(-5px);
          }
        }

        @keyframes neon {
          0% {
            box-shadow: 0 0 5px #00ff88, 0 0 10px #00ff88;
          }
          100% {
            box-shadow: 0 0 10px #00ff88, 0 0 20px #00ff88, 0 0 30px #00ff88;
          }
        }

        @keyframes ring {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-15deg); }
          75% { transform: rotate(15deg); }
        }

        @keyframes flash {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        @keyframes neonFlicker {
          0%, 100% { filter: drop-shadow(0 0 5px #00ff88); }
          50% { filter: drop-shadow(0 0 15px #00ff88) drop-shadow(0 0 25px #00ff88); }
        }
      `}</style>
    </div>
  )
}

export default NotificationVariantsExtended
