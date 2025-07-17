"use client"

import { useState } from "react"
import MemberAssetSearchIcon from "../ui/MemberAssetSearchIcon.jsx"
import MemberAssetSearchMenuItem from "../ui/MemberAssetSearchMenuItem.jsx"

const MemberAssetSearchSidebar = ({ onPageChange, onToggle }) => {
  const [collapsed, setCollapsed] = useState(false)
  const [activeItem, setActiveItem] = useState("dashboard")

  const toggleSidebar = () => {
    const newCollapsed = !collapsed
    setCollapsed(newCollapsed)
    if (onToggle) {
      onToggle(newCollapsed)
    }
  }

  const handleMenuClick = (itemId) => {
    setActiveItem(itemId)
    if (onPageChange) {
      onPageChange(itemId)
    }
  }

  const menuItems = [
    {
      section: "Main",
      items: [
        {
          id: "dashboard",
          icon: "dashboard",
          text: "Dashboard",
          active: activeItem === "dashboard",
        },
        {
          id: "analytics",
          icon: "analytics",
          text: "Analytics",
          badge: "Pro",
          active: activeItem === "analytics",
        },
      ],
    },
    {
      section: "회원 관리",
      items: [
        {
          id: "users",
          icon: "users",
          text: "회원 정보",
          active: activeItem === "users",
          children: [
            { text: "전체 회원", active: false },
            { text: "회원 등록", active: false },
            { text: "회원 등급", active: true },
          ],
        },
        {
          id: "member-asset",
          icon: "finance",
          text: "회원 자산 관리",
          active: activeItem === "member-asset" || activeItem === "member-asset-search",
          children: [
            {
              text: "회원 자산 내역",
              active: activeItem === "member-asset-search",
              onClick: () => handleMenuClick("member-asset-search"),
            },
            { text: "자산 통계", active: false },
            { text: "거래 내역", active: false },
          ],
        },
      ],
    },
    {
      section: "상품 관리",
      items: [
        {
          id: "products",
          icon: "products",
          text: "상품",
          badge: "24",
          active: activeItem === "products",
          children: [
            { text: "전체 상품", active: false },
            { text: "상품 등록", active: false },
            { text: "카테고리", active: false },
            { text: "재고 관리", active: false },
          ],
        },
        {
          id: "orders",
          icon: "orders",
          text: "주문 관리",
          badge: "12",
          active: activeItem === "orders",
        },
      ],
    },
    {
      section: "시스템",
      items: [
        {
          id: "reports",
          icon: "reports",
          text: "리포트",
          active: activeItem === "reports",
        },
        {
          id: "settings",
          icon: "settings",
          text: "설정",
          active: activeItem === "settings",
        },
        {
          id: "help",
          icon: "help",
          text: "도움말",
          active: activeItem === "help",
        },
      ],
    },
  ]

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">AK</div>
        <div className="sidebar-title">AdminKit</div>
      </div>

      <button className="sidebar-toggle" onClick={toggleSidebar}>
        <MemberAssetSearchIcon name="chevronLeft" size={14} />
      </button>

      <div className="sidebar-content">
        {menuItems.map((section, sectionIndex) => (
          <div key={sectionIndex} className="sidebar-section">
            <div className="sidebar-section-title">{section.section}</div>
            <ul className="sidebar-menu">
              {section.items.map((item) => (
                <MemberAssetSearchMenuItem
                  key={item.id}
                  icon={item.icon}
                  text={item.text}
                  badge={item.badge}
                  active={item.active}
                  collapsed={collapsed}
                  onClick={() => handleMenuClick(item.id)}
                  children={item.children}
                />
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <a href="#" className="sidebar-user">
          <div className="sidebar-user-avatar">JD</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">John Doe</div>
            <div className="sidebar-user-role">Administrator</div>
          </div>
        </a>
      </div>
    </aside>
  )
}

export default MemberAssetSearchSidebar
