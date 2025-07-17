import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  Users,
  Store,
  ShoppingCart,
  DollarSign,
  MessageSquare,
  ChevronDown,
  Menu,
  UserCircleIcon,
  Building2Icon
} from "lucide-react";
import "../../../../styles/jihun/maintemple/maintempleside.css";

const MainNavi = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState([]);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [activeSubMenuId, setActiveSubMenuId] = useState(null);

  // 반응형을 위한 화면 크기 감지
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    // 초기 화면 크기 체크
    handleResize();

    // 리사이즈 이벤트 리스너 추가
    window.addEventListener('resize', handleResize);

    // 클린업
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // 메뉴 설정 - 커스텀마이징이 쉬운 구조
  const menuConfig = {
    // 메인 메뉴 아이템들
    // 각 메뉴 아이템 속성 설명:
    // - id: 메뉴 고유 식별자 (라우팅이나 상태 관리에 사용)
    // - label: 화면에 표시될 메뉴 이름
    // - icon: lucide-react 아이콘 컴포넌트
    // - type: 메뉴 타입 ("link": 페이지 이동, "expand": 확장 메뉴, "action": 액션 실행)
    // - href: 페이지 이동 시 사용할 경로 (type이 "link"일 때만)
    // - action: 클릭 시 실행할 함수 (type이 "list" 또는 "action"일 때만)
    // - submenu: 하위 메뉴 배열 (type이 "expand"일 때만)
    items: [
      {
        id: "dashboard",
        label: "대시 보드",
        icon: Home,
        type: "link", // link: 페이지 이동, expand: 확장 메뉴, action: 액션 실행
        href: "/TestMain"
      },
      {
        id: "mypage",
        label: "마이페이지",
        icon: UserCircleIcon,
        type: "link",
        href: "/TestMain"
      },
      {
        id: "Headquarters-Management",
        label: "본사 관리",
        icon: Building2Icon,
        type: "expand", // 확장 메뉴
        submenu: [
          {
            id: "permission-management",
            label: "권한 관리",
            type: "link", 
            href: "/PermissionManagement"
          },
        ]
      },
      {
        id: "personal-management",
        label: "택준이는 바보다?",
        icon: Users,
        type: "expand", // 확장 메뉴
        submenu: [
          {
            id: "personal-list",
            label: "본인 리스트",
            type: "list", // list: 리스트 박스 (링크 없음)
            action: () => console.log("본인 리스트 클릭") // 클릭 시 실행할 함수
          },
          {
            id: "member-assets",
            label: "회원 자산 내역",
            type: "link",
            href: "/memberaccount"
          },
          {
            id: "personal-approval",
            label: "본인 승인 현황",
            type: "list",
            action: () => console.log("본인 승인 현황 클릭")
          },
          {
            id: "personal-withdrawal",
            label: "본인 출금 현황",
            type: "list",
            action: () => console.log("본인 출금 현황 클릭")
          },
          {
            id: "personal-deposit",
            label: "본인 지급 내역",
            type: "list",
            action: () => console.log("본인 지급 내역 클릭")
          },
          {
            id: "taekjun-babo",
            label: "바보인거 확인할려면 클릭 ㄱㄱ",
            type: "link",
            href: "/",
          }
        ]
      },
      {
        id: "business-management",
        label: "사업자 관리",
        icon: Store,
        type: "expand",
        submenu: [
          {
            id: "business-list",
            label: "사업자 리스트",
            type: "list",
            action: () => console.log("사업자 리스트 클릭")
          },
          {
            id: "business-approval",
            label: "사업자 승인",
            type: "list",
            action: () => console.log("사업자 승인 클릭")
          }
        ]
      },
      {
        id: "franchise-management",
        label: "가맹점 관리",
        icon: ShoppingCart,
        type: "expand",
        submenu: [
          {
            id: "franchise-list",
            label: "가맹점 리스트",
            type: "list",
            action: () => console.log("가맹점 리스트 클릭")
          },
          {
            id: "franchise-registration",
            label: "가맹점 등록",
            type: "list",
            action: () => console.log("가맹점 등록 클릭")
          }
        ]
      },
      {
        id: "withdrawal-management",
        label: "출금 관리",
        icon: DollarSign,
        type: "expand",
        submenu: [
          {
            id: "withdrawal-requests",
            label: "출금 요청",
            type: "list",
            action: () => console.log("출금 요청 클릭")
          },
          {
            id: "withdrawal-approval",
            label: "출금 승인",
            type: "list",
            action: () => console.log("출금 승인 클릭")
          }
        ]
      },
      {
        id: "communication",
        label: "커뮤니케이션",
        icon: MessageSquare,
        type: "expand",
        submenu: [
          {
            id: "chat-rooms",
            label: "채팅방 관리",
            type: "list",
            action: () => console.log("채팅방 관리 클릭")
          },
          {
            id: "announcements",
            label: "공지사항",
            type: "list",
            action: () => console.log("공지사항 클릭")
          },
          {
            id: "customer-support",
            label: "고객 지원",
            type: "list",
            action: () => console.log("고객 지원 클릭")
          }
        ]
      }
    ],

    // 스타일 설정
    styles: {
      sidebar: {
        backgroundColor: "#222e3c",
        width: {
          open: "250px",
          closed: "70px"
        }
      },
      menu: {
        hoverColor: "#4a5568",
        textColor: "#cbd5e0",
        activeColor: "#3b7ddd"
      }
    }
  };

  const handleMenuClick = (item) => {
    switch (item.type) {
      case "link":
        // 페이지 이동
        setActiveMenuId(item.id);
        setActiveSubMenuId(null);
        navigate(item.href);
        break;
      case "expand":
        // 서브메뉴 확장/축소 - 토글 형식
        const isCurrentlyExpanded = expandedMenus.includes(item.id);
        if (isCurrentlyExpanded) {
          // 현재 열린 메뉴를 닫기
          setExpandedMenus(prev => prev.filter(id => id !== item.id));
          setActiveMenuId(null);
          setActiveSubMenuId(null);
        } else {
          // 다른 메뉴는 모두 닫고 해당 메뉴만 열기
          setExpandedMenus([item.id]);
          setActiveMenuId(item.id);
          setActiveSubMenuId(null);
        }
        break;
      case "action":
        // 액션 실행
        if (item.action) {
          item.action();
        }
        break;
      default:
        break;
    }
  };

  const handleSubMenuClick = (subItem, e) => {
    e.stopPropagation();

    switch (subItem.type) {
      case "link":
        setActiveSubMenuId(subItem.id);
        navigate(subItem.href);
        break;
      case "list":
        // 리스트 박스 - 액션 실행
        setActiveSubMenuId(subItem.id);
        if (subItem.action) {
          subItem.action();
        }
        break;
      case "action":
        // 액션 실행
        setActiveSubMenuId(subItem.id);
        if (subItem.action) {
          subItem.action();
        }
        break;
      default:
        break;
    }
  };

  const renderMenuItem = (item) => {
    const Icon = item.icon;
    const isActive = activeMenuId === item.id || (item.submenu && item.submenu.some(sub => sub.id === activeSubMenuId));

    return (
      <div key={item.id} className="nav-item">
        <button
          onClick={() => handleMenuClick(item)}
          className={`nav-button ${!sidebarOpen ? "centered" : ""} ${isActive ? "active" : ""}`}
        >
          <div className="nav-button-content">
            <Icon size={20} />
            {sidebarOpen && <span className="nav-label">{item.label}</span>}
          </div>
          {sidebarOpen && item.type === "expand" && (
            <ChevronDown
              size={16}
              className={`submenu-arrow ${expandedMenus.includes(item.id) ? "expanded" : ""}`}
            />
          )}
        </button>

        {sidebarOpen && item.type === "expand" && expandedMenus.includes(item.id) && (
          <div className={`submenu ${expandedMenus.includes(item.id) ? "open" : ""}`}>
            {item.submenu.map((subItem) => (
              <button
                key={subItem.id}
                onClick={(e) => handleSubMenuClick(subItem, e)}
                className={`submenu-button ${activeSubMenuId === subItem.id ? "active" : ""} ${subItem.type === "list" ? "list-item" : ""}`}
                title={subItem.type === "list" ? "리스트 박스" : ""}
              >
                {subItem.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`sidebar ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      <div className="sidebar-header">
        <div className={`logo ${sidebarOpen ? "show" : "hide"}`}>Tesseris</div>
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
        {menuConfig.items.map(renderMenuItem)}
      </nav>
    </div>
  );
};

export default MainNavi; 