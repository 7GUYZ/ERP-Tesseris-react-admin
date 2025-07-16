"use client"

import { useState } from "react"
import {
  Users,
  ShoppingCart,
  DollarSign,
  Menu,
  Settings,
  Home,
  Package,
  ChevronDown,
  MessageSquare,
  Bell,
} from "lucide-react"
import MemberAssetDetails from "./member-asset-details"
import "../style/dashboard.css"

const MainDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeMenu, setActiveMenu] = useState("member-assets")
  const [expandedMenus, setExpandedMenus] = useState([])

  const toggleMenu = (menuId) => {
    setExpandedMenus((prev) => {
      // 이미 열려있는 메뉴를 클릭하면 닫기
      if (prev.includes(menuId)) {
        return prev.filter((id) => id !== menuId)
      }
      // 새로운 메뉴를 클릭하면 다른 메뉴는 모두 닫고 해당 메뉴만 열기
      return [menuId]
    })
  }

  const menuItems = [
    {
      id: "dashboard",
      label: "대시 보드",
      icon: Home,
      submenu: [
        { id: "main-dashboard", label: "메인 대시보드" },
        { id: "analytics-dashboard", label: "분석 대시보드" },
        { id: "reports-dashboard", label: "리포트 대시보드" },
      ],
    },
    {
      id: "mypage",
      label: "마이페이지",
      icon: Users,
      submenu: [
        { id: "profile", label: "프로필 관리" },
        { id: "account-settings", label: "계정 설정" },
        { id: "preferences", label: "환경 설정" },
      ],
    },
    {
      id: "personal-management",
      label: "본인 관리",
      icon: Users,
      submenu: [
        { id: "personal-list", label: "본인 리스트" },
        { id: "member-assets", label: "회원 자산 내역" },
        { id: "personal-approval", label: "본인 승인 현황" },
        { id: "personal-withdrawal", label: "본인 출금 현황" },
        { id: "personal-deposit", label: "본인 지급 내역" },
      ],
    },
    {
      id: "business-management",
      label: "사업자 관리",
      icon: Package,
      submenu: [
        { id: "business-list", label: "사업자 리스트" },
        { id: "business-approval", label: "사업자 승인" },
        { id: "business-documents", label: "사업자 서류" },
        { id: "business-status", label: "사업자 현황" },
      ],
    },
    {
      id: "franchise-management",
      label: "가맹점 관리",
      icon: ShoppingCart,
      submenu: [
        { id: "franchise-list", label: "가맹점 리스트" },
        { id: "franchise-registration", label: "가맹점 등록" },
        { id: "franchise-settlement", label: "가맹점 정산" },
        { id: "franchise-support", label: "가맹점 지원" },
      ],
    },
    {
      id: "withdrawal-management",
      label: "출금 관리",
      icon: DollarSign,
      submenu: [
        { id: "withdrawal-requests", label: "출금 요청" },
        { id: "withdrawal-approval", label: "출금 승인" },
        { id: "withdrawal-history", label: "출금 내역" },
        { id: "withdrawal-limits", label: "출금 한도" },
      ],
    },
    {
      id: "communication",
      label: "커뮤니케이션",
      icon: MessageSquare,
      submenu: [
        { id: "chat-rooms", label: "채팅방 관리" },
        { id: "announcements", label: "공지사항" },
        { id: "message-center", label: "메시지 센터" },
        { id: "customer-support", label: "고객 지원" },
        { id: "live-chat", label: "실시간 채팅" },
        { id: "notification-settings", label: "알림 설정" },
      ],
    },
    {
      id: "hog-management",
      label: "호그 관리",
      icon: Settings,
      submenu: [
        { id: "hog-list", label: "호그 리스트" },
        { id: "hog-settings", label: "호그 설정" },
        { id: "hog-monitoring", label: "호그 모니터링" },
        { id: "hog-reports", label: "호그 리포트" },
      ],
    },
  ]

  const renderContent = () => {
    switch (activeMenu) {
      case "member-assets":
        return <MemberAssetDetails />
      case "chat-rooms":
        return (
          <div className="content-area">
            <div className="dashboard-welcome">
              <h1>채팅방 관리</h1>
              <p>실시간 채팅방을 관리하고 모니터링할 수 있습니다.</p>
              <div className="chat-management-preview">
                <div className="chat-stats">
                  <div className="stat-card">
                    <h3>활성 채팅방</h3>
                    <p className="stat-number">24</p>
                  </div>
                  <div className="stat-card">
                    <h3>온라인 사용자</h3>
                    <p className="stat-number">156</p>
                  </div>
                  <div className="stat-card">
                    <h3>오늘 메시지</h3>
                    <p className="stat-number">1,247</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      case "announcements":
        return (
          <div className="content-area">
            <div className="dashboard-welcome">
              <h1>공지사항</h1>
              <p>시스템 공지사항과 중요 알림을 관리합니다.</p>
            </div>
          </div>
        )
      case "message-center":
        return (
          <div className="content-area">
            <div className="dashboard-welcome">
              <h1>메시지 센터</h1>
              <p>사용자 간 메시지 전송 및 관리 기능을 제공합니다.</p>
            </div>
          </div>
        )
      case "customer-support":
        return (
          <div className="content-area">
            <div className="dashboard-welcome">
              <h1>고객 지원</h1>
              <p>고객 문의 및 지원 요청을 처리합니다.</p>
            </div>
          </div>
        )
      case "live-chat":
        return (
          <div className="content-area">
            <div className="dashboard-welcome">
              <h1>실시간 채팅</h1>
              <p>고객과의 실시간 채팅 상담을 진행합니다.</p>
            </div>
          </div>
        )
      case "notification-settings":
        return (
          <div className="content-area">
            <div className="dashboard-welcome">
              <h1>알림 설정</h1>
              <p>시스템 알림 및 푸시 알림을 설정합니다.</p>
            </div>
          </div>
        )
      default:
        return (
          <div className="content-area">
            <div className="dashboard-welcome">
              <h1>대시보드</h1>
              <p>CMBarter 관리자 대시보드에 오신 것을 환영합니다.</p>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
        <div className="sidebar-header">
          <div className={`logo ${sidebarOpen ? "show" : "hide"}`}>CMBarter</div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="menu-toggle">
            <Menu size={20} />
          </button>
        </div>

        <div className={`user-info ${sidebarOpen ? "show" : "hide"}`}>
          <div className="user-avatar">Y</div>
          <div className="user-details">
            <div className="user-name">yeomkh</div>
            <div className="user-role">관리자</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <div key={item.id} className="nav-item">
              <button
                onClick={() => {
                  setActiveMenu(item.id)
                  if (item.submenu) {
                    toggleMenu(item.id)
                  }
                }}
                className={`nav-button ${
                  activeMenu === item.id || (item.submenu && item.submenu.some((sub) => sub.id === activeMenu))
                    ? "active"
                    : ""
                } ${!sidebarOpen ? "centered" : ""}`}
              >
                <div className="nav-button-content">
                  <item.icon size={20} />
                  {sidebarOpen && <span className="nav-label">{item.label}</span>}
                </div>
                {sidebarOpen && item.submenu && (
                  <ChevronDown
                    size={16}
                    className={`submenu-arrow ${expandedMenus.includes(item.id) ? "expanded" : ""}`}
                  />
                )}
              </button>

              {sidebarOpen && item.submenu && expandedMenus.includes(item.id) && (
                <div className="submenu">
                  {item.submenu.map((subItem) => (
                    <button
                      key={subItem.id}
                      onClick={() => setActiveMenu(subItem.id)}
                      className={`submenu-button ${activeMenu === subItem.id ? "active" : ""}`}
                    >
                      {subItem.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Fixed Header */}
        
        <main className="dashboard-main">{renderContent()}</main>
      </div>
    </div>
  )
}

export default MainDashboard
