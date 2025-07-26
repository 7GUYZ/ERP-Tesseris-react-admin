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
  Flag,
  Info,
  FileChartColumn,
  Bell,
} from "lucide-react";
import "../../../../styles/jihun/maintemple/maintempleside.css";
import "../../../../styles/jihun/maintemple/navigation-scrollbar.css";
import { menuAuthority } from "../../../../api/auth/JungeunAuth";
import { useToast } from "../../../../context/jungeun/ToastContext";

const MainNavi = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState([]);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [activeSubMenuId, setActiveSubMenuId] = useState(null);
  const [authorityList, setAuthorityList] = useState([]);
  const [submenuPosition, setSubmenuPosition] = useState({ top: 0, left: 0 });
  const { showToast } = useToast();
  const userInfo = JSON.parse(localStorage.getItem("user-info")) || {};
  const userName = userInfo.name || "";
  const adminType = userInfo.admin_type_name || "";
  useEffect(() => {
    // 1. 접속한 관리자의 권한 조회하고 오기
    const getAuthority = async () => {
      const userInfo = JSON.parse(localStorage.getItem("user-info"));
      const admin_type_index = userInfo?.admin_type_index;
      if (admin_type_index) {
        try {
          const response = await menuAuthority(admin_type_index);
          // eslint-disable-next-line no-console
          console.log(response);
          if (response.data.resultCode === 200) {
            setAuthorityList(response.data.data);
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.log("권한 조회 실패 : ", error);
          showToast("error", "메뉴를 불러올 수 없습니다.");
        }
      }
    };

    getAuthority();

    // 2. 반응형을 위한 화면 크기 감지
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
    window.addEventListener("resize", handleResize);

    // 클린업
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [showToast]);
  function filterMenuByAuthority(items, authorityList) {
    const allowed = new Set(
      authorityList.map((a) => `${a.menuIndex}-${a.programIndex}`)
    );

    return items
      .map((menu) => {
        if (!menu.menuIndex) return menu;
        const filteredSubmenu = (menu.submenu || []).filter((program) =>
          allowed.has(`${menu.menuIndex}-${program.programIndex}`)
        );
        if (filteredSubmenu.length > 0) {
          return { ...menu, submenu: filteredSubmenu };
        }
        return null;
      })
      .filter(Boolean);
  }
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
        href: "/dashboard",
      },
      {
        id: "mypage",
        label: "마이페이지",
        icon: UserCircleIcon,
        type: "link",
        href: "/adminmypage",
      },
      {
        id: "company-management",
        menuIndex: 1,
        label: "본사 관리",
        icon: Users,
        type: "expand", // 확장 메뉴
        submenu: [
          {
            id: "coupon-management",
            programIndex: 13,
            label: "쿠폰 관리",
            type: "link", // list: 리스트 박스 (링크 없음)
            href: "/coupon",
          },
          {
            id: "brokerage-fee-setting",
            programIndex: 9,
            label: "중개수수료율 설정",
            type: "link",
            href: "/commissionSetting",
          },
          {
            id: "admin-list",
            programIndex: 10,
            label: "CMS 관리자 명단",
            type: "list",
            action: () => console.log("본인 승인 현황 클릭"),
          },
          {
            id: "authority-management",
            programIndex: 8,
            label: "권한 관리",
            type: "link",
            href: "/PermissionManagement",
          },
          {
            id: "monthly-cm-limit",
            programIndex: 38,
            label: "월 CM사용한도",
            type: "link",
            href: "/MonthlyCmLimit",
          },
        ],
      },
      {
        id: "member-management",
        menuIndex: 9,
        label: "회원 관리",
        icon: Users,
        type: "expand", // 확장 메뉴
        submenu: [
          {
            id: "member-list",
            programIndex: 14,
            label: "회원 리스트",
            type: "link",
            href: "/user-admin-list",
          },
          {
            id: "member-assets",
            programIndex: 12,
            label: "회원 자산 내역",
            type: "link",
            href: "/memberaccount",
          },
          {
            id: "member-assets-status",
            programIndex: 11,
            label: "회원 자산 현황",
            type: "link",
            href: "/memberassetdetails",
          },
          {
            id: "member-referral-status",
            programIndex: 31,
            label: "회원 추천 현황",
            type: "link",
            href: "/member-recommendation"
          },
          {
            id: "member-payment-history",
            programIndex: 34,
            label: "정회원 결제내역",
            type: "list",
            action: () => console.log("본인 지급 내역 클릭"),
          },
          {
            id: "commision-history",
            programIndex: 35,
            label: "수당 지급 내역",
            type: "link",
            href: "/commission-payment",
          },
        ],
      },
      {
        id: "business-management",
        menuIndex: 2,
        label: "사업자 관리",
        icon: Store,
        type: "expand",
        submenu: [
          {
            id: "business-performance-overview",
            programIndex: 18,
            label: "영업 실적 현황",
            type: "link",
            href: "/sales-performance",
          },
          {
            id: "business-organization-chart",
            programIndex: 19,
            label: "사업자 조직도",
            type: "link",
            href: "/businessorgchart",
          },
          {
            id: "business-member-list",
            programIndex: 17,
            label: "사업자 회원 리스트",
            type: "link",
            href: "/businessman-admin-list"
          },
          {
            id: "business-commission-history",
            programIndex: 37,
            label: "사업자 수당 내역",
            type: "link",
            href: "/businessallowance",
          },
          {
            id: "commission-setting",
            programIndex: 36,
            label: "직급별 수당 설정",
            type: "list",
            action: () => console.log("사업자 승인 클릭"),
          },
        ],
      },
      {
        id: "franchise-management",
        menuIndex: 3,
        label: "가맹점 관리",
        icon: ShoppingCart,
        type: "expand",
        submenu: [
          {
            id: "franchise-member-list",
            programIndex: 20,
            label: "가맹점 회원 리스트",
            type: "link",
            href: "/storelist",
          },
          {
            id: "franchise-registration-status",
            programIndex: 33,
            label: "가맹점 신청 현황",
            type: "link",
            href: "/storeregisterlist",
          },
          {
            id: "franchise-customer-management",
            programIndex: 30,
            label: "가맹점 고객관리",
            type: "link",
            href: "/storecustomerlist",
          },
        ],
      },
      {
        id: "promotion-management",
        menuIndex: 4,
        label: "홍보 관리",
        icon: Flag,
        type: "expand",
        submenu: [
          {
            id: "advertisement-management",
            programIndex: 24,
            label: "광고 관리",
            type: "link",
            href: "/advertisement/list",
          },
          {
            id: "banner-management",
            programIndex: 23,
            label: "배너 관리",
            type: "list",
            action: () => console.log("출금 승인 클릭"),
          },
        ],
      },
      {
        id: "customer-service",
        menuIndex: 5,
        label: "고객센터",
        icon: Info,
        type: "expand",
        submenu: [
          {
            id: "qna-management",
            programIndex: 26,
            label: "QNA 관리",
            type: "list",
            action: () => console.log("출금 요청 클릭"),
          },
          {
            id: "notice-management",
            programIndex: 25,
            label: "공지사항 관리",
            type: "link",
            href: "/notice/list",
          },
        ],
      },
      {
        id: "log-management",
        menuIndex: 6,
        label: "로그 관리",
        icon: FileChartColumn,
        type: "expand",
        submenu: [
          {
            id: "account-modification-history",
            programIndex: 29,
            label: "계정 수정 기록",
            type: "link",
            href: "/updateLog",
          },
          {
            id: "cms-access-history",
            programIndex: 28,
            label: "CMS 접속 기록",
            type: "link",
            href: "/cmsAccessLog",
          },
        ],
      },
      {
        id: "withdrawal-management-top",
        menuIndex: 7,
        label: "출금 관리",
        icon: DollarSign,
        type: "expand",
        submenu: [
          {
            id: "withdrawal-history",
            programIndex: 15,
            label: "출금 조회",
            type: "list",
            action: () => console.log("출금 요청 클릭"),
          },
          {
            id: "withdrawal-management",
            programIndex: 16,
            label: "출금 관리",
            type: "list",
            action: () => console.log("출금 승인 클릭"),
          },
        ],
      },
      {
        id: "communication",
        menuIndex: 10, // DB menu 테이블에 신규 추가함(정은)
        label: "커뮤니케이션",
        icon: MessageSquare,
        type: "expand",
        submenu: [
          {
            id: "chat-rooms",
            programIndex: 40, // 달라질시에 꼭 정은에게 언급
            label: "채팅방 관리",
            type: "list",
            action: () => console.log("채팅방 관리 클릭"),
          },
        ],
      },
      {
        id: "alert",
        menuIndex: 11,
        label: "알림 관리",
        icon: Bell,
        type: "expand",
        submenu: [
          {
            id: "alert",
            programIndex: 41,
            label: "알림 내역 및 설정 관리",
            type: "link",
            href: "/alert",
          },
        ],
      },
    ],

    // 스타일 설정
    styles: {
      sidebar: {
        backgroundColor: "#222e3c",
        width: {
          open: "250px",
          closed: "70px",
        },
      },
      menu: {
        hoverColor: "#4a5568",
        textColor: "#cbd5e0",
        activeColor: "#3b7ddd",
      },
    },
  };

  const handleMenuClick = (item, event) => {
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
          setExpandedMenus((prev) => prev.filter((id) => id !== item.id));
          setActiveMenuId(null);
          setActiveSubMenuId(null);
        } else {
          // 다른 메뉴는 모두 닫고 해당 메뉴만 열기
          setExpandedMenus([item.id]);
          setActiveMenuId(item.id);
          setActiveSubMenuId(null);

          // 축소된 상태에서 하위 메뉴 위치 계산
          if (!sidebarOpen && event) {
            const rect = event.currentTarget.getBoundingClientRect();
            setSubmenuPosition({
              top: rect.top,
              left: rect.right + 10,
            });
          }
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

    // 축소된 상태에서 하위 메뉴 클릭 시 메뉴 닫기
    if (!sidebarOpen) {
      setExpandedMenus((prev) => prev.filter((id) => id !== activeMenuId));
      setActiveMenuId(null);
      setActiveSubMenuId(null);
    }

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
    const isActive =
      activeMenuId === item.id ||
      (item.submenu && item.submenu.some((sub) => sub.id === activeSubMenuId));

    return (
      <div key={item.id} className="nav-item">
        <button
          onClick={(e) => handleMenuClick(item, e)}
          className={`nav-button ${!sidebarOpen ? "centered" : ""} ${
            isActive ? "active" : ""
          }`}
          title={!sidebarOpen ? item.label : ""}
        >
          <div className="nav-button-content">
            <Icon size={20} />
            {sidebarOpen && <span className="nav-label">{item.label}</span>}
          </div>
          {sidebarOpen && item.type === "expand" && (
            <ChevronDown
              size={16}
              className={`submenu-arrow ${
                expandedMenus.includes(item.id) ? "expanded" : ""
              }`}
            />
          )}
        </button>

        {item.type === "expand" && expandedMenus.includes(item.id) && (
          <div
            className={`submenu ${
              expandedMenus.includes(item.id) ? "open" : ""
            } ${!sidebarOpen ? "submenu-collapsed" : ""}`}
            style={
              !sidebarOpen
                ? {
                    position: "fixed",
                    top: `${submenuPosition.top}px`,
                    left: `${submenuPosition.left}px`,
                    zIndex: 1000,
                  }
                : {}
            }
          >
            {item.submenu.map((subItem) => (
              <button
                key={subItem.id}
                onClick={(e) => handleSubMenuClick(subItem, e)}
                className={`submenu-button ${
                  activeSubMenuId === subItem.id ? "active" : ""
                } ${subItem.type === "list" ? "list-item" : ""}`}
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
    <div
      className={`sidebar sidebar-scrollbar ${
        sidebarOpen ? "sidebar-open" : "sidebar-closed"
      }`}
    >
      <div className="sidebar-header">
        <div className={`logo ${sidebarOpen ? "show" : "hide"}`}>Tesseris</div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="menu-toggle"
        >
          <Menu size={20} />
        </button>
      </div>

      <div className={`user-info ${sidebarOpen ? "show" : "hide"}`}>
        <div className="user-avatar">{userName ? userName[0] : ""}</div>
        <div className="user-details">
          <div className="user-name">{userName}</div>
          <div className="user-role">{adminType}</div>
        </div>
      </div>

      <nav className="sidebar-nav navigation-scrollbar">
      {/* 권한에 따라 메뉴 필터링 */}
      {filterMenuByAuthority(menuConfig.items, authorityList).map(renderMenuItem)}
      </nav>
    </div>
  );
};

export default MainNavi;
