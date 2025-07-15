"use client"
import { useState } from "react"
import { Paper, List, ListItem, ListItemIcon, ListItemText, Typography, Box, Collapse, Button } from "@mui/material"
import {
  Dashboard,
  Person, // General person icon for management
  KeyboardArrowDown,
  KeyboardArrowUp,
  Store, // Business/Franchise icon
  Campaign, // Promotion icon
  SupportAgent, // Customer Service icon
  Description, // Log icon
  AccountBalanceWallet, // Withdrawal icon
  LocalOffer, // Special Sales Dept. icon
  Logout, // Logout icon
} from "@mui/icons-material"

const menuItems = [
  { id: "dashboard", label: "대시 보드", icon: Dashboard, href: "/dashboard" },
  { id: "mypage", label: "마이페이지", icon: Person, href: "/mypage" },
  {
    id: "headquarters",
    label: "본사 관리",
    icon: Person,
    children: [
      { id: "coupon", label: "쿠폰 관리", href: "/coupons", active: true }, // active prop on child
      { id: "brokerage", label: "중개수수료율 설정", href: "/brokerage" },
      { id: "cmsAdmin", label: "CMS 관리자 명단", href: "/cms-admin" },
      { id: "permission", label: "권한 관리", href: "/permission" },
      { id: "cmLimit", label: "월 CM사용 한도", href: "/cm-limit" },
      { id: "cmSetting", label: "정회원단계별 CM설정", href: "/cm-setting" },
    ],
  },
  { id: "member", label: "회원 관리", icon: Person, href: "/members" },
  { id: "business", label: "사업자 관리", icon: Store, href: "/businesses" },
  { id: "franchise", label: "가맹점 관리", icon: Store, href: "/franchises" },
  { id: "salesPerformance", label: "영업실적 현황", icon: LocalOffer, href: "/sales-performance" },
  { id: "promotion", label: "홍보 관리", icon: Campaign, href: "/promotions" },
  { id: "customerService", label: "고객센터", icon: SupportAgent, href: "/customer-service" },
  { id: "log", label: "로그 관리", icon: Description, href: "/logs" },
  { id: "withdrawal", label: "출금 관리", icon: AccountBalanceWallet, href: "/withdrawals" },
]

const Sidebar = () => {
  // '본사 관리'가 현재 활성화된 하위 메뉴를 가지고 있다고 가정하여 기본적으로 열림
  const [openSections, setOpenSections] = useState({ headquarters: true })

  const handleClick = (id) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const renderMenuItem = (item) => {
    const Icon = item.icon

    // Determine if the current route matches this item or any of its children
    // For demo purposes, 'coupon' child is hardcoded as active for 'headquarters'
    const isCurrentActive =
      (item.id === "coupon" && item.active) || (item.children && item.children.some((child) => child.active))

    if (item.children) {
      return (
        <div key={item.id}>
          <ListItem
            component="div"
            role="button"
            tabIndex={0}
            onClick={() => handleClick(item.id)}
            style={{
              borderRadius: "4px", // Adjusted border radius slightly
              marginBottom: "4px",
              // Background for parent item does not turn blue when expanded, only hover
              backgroundColor: "transparent",
              color: "#cbd5e1", // Default text color
              display: "flex",
              alignItems: "center",
              padding: "8px 16px",
              textDecoration: "none",
              transition: "background-color 0.2s, color 0.2s",
              cursor: "pointer",
              "&:hover": {
                backgroundColor: "#334155", // Hover color for parent
                color: "white",
              },
            }}
          >
            <ListItemIcon style={{ color: "inherit", minWidth: "40px" }}>
              <Icon />
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                fontSize: "14px",
                fontWeight: 500,
              }}
            />
            {openSections[item.id] ? (
              <KeyboardArrowUp style={{ color: "inherit" }} />
            ) : (
              <KeyboardArrowDown style={{ color: "inherit" }} />
            )}
          </ListItem>
          <Collapse in={openSections[item.id]} timeout="auto" unmountOnExit>
            <List component="div" disablePadding style={{ paddingLeft: "24px" }}>
              {item.children.map((child) => (
                <ListItem
                  key={child.id}
                  component="a"
                  href={child.href}
                  style={{
                    borderRadius: "4px", // Adjusted border radius slightly
                    marginBottom: "4px",
                    // Apply blue background only to the active child
                    backgroundColor: child.active ? "#2563eb" : "transparent",
                    color: child.active ? "white" : "#cbd5e1",
                    display: "flex",
                    alignItems: "center",
                    padding: "8px 16px",
                    textDecoration: "none",
                    transition: "background-color 0.2s, color 0.2s",
                    "&:hover": {
                      backgroundColor: child.active ? "#2563eb" : "#334155", // Hover for active/inactive child
                      color: "white",
                    },
                  }}
                >
                  <ListItemText
                    primary={child.label}
                    primaryTypographyProps={{
                      fontSize: "14px",
                      fontWeight: child.active ? 500 : 400,
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Collapse>
        </div>
      )
    } else {
      return (
        <ListItem
          key={item.id}
          component="a"
          href={item.href}
          style={{
            borderRadius: "4px", // Adjusted border radius slightly
            marginBottom: "4px",
            // Apply blue background only to the active top-level item
            backgroundColor: isCurrentActive ? "#2563eb" : "transparent",
            color: isCurrentActive ? "white" : "#cbd5e1",
            display: "flex",
            alignItems: "center",
            padding: "8px 16px",
            textDecoration: "none",
            transition: "background-color 0.2s, color 0.2s",
            "&:hover": {
              backgroundColor: isCurrentActive ? "#2563eb" : "#334155",
              color: "white",
            },
          }}
        >
          <ListItemIcon style={{ color: "inherit", minWidth: "40px" }}>
            <Icon />
          </ListItemIcon>
          <ListItemText
            primary={item.label}
            primaryTypographyProps={{
              fontSize: "14px",
              fontWeight: isCurrentActive ? 500 : 400,
            }}
          />
        </ListItem>
      )
    }
  }

  return (
    <Paper
      elevation={0}
      style={{
        width: "260px", // Fixed width
        backgroundColor: "#1e293b",
        color: "white",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflowY: "auto",
        boxSizing: "border-box", // Ensure padding doesn't affect width
      }}
    >
      {/* Logo and Logout */}
      <Box
        style={{
          padding: "24px",
          borderBottom: "1px solid #334155",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h5" style={{ fontWeight: "bold", color: "white" }}>
          CMBarter
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Logout />}
          style={{
            color: "white",
            borderColor: "white",
            textTransform: "none",
            fontSize: "12px",
            padding: "4px 8px",
          }}
        >
          로그아웃
        </Button>
      </Box>

      {/* User Info */}
      <Box style={{ padding: "16px", borderBottom: "1px solid #334155" }}>
        <Box style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Box
            style={{
              backgroundColor: "#3b82f6",
              borderRadius: "4px",
              padding: "4px 8px",
              color: "white",
              fontSize: "12px",
              fontWeight: 500,
            }}
          >
            전산간부
          </Box>
          <Typography variant="body2" style={{ fontWeight: 500, color: "white" }}>
            yeonkh
          </Typography>
        </Box>
      </Box>

      {/* Navigation */}
      <Box style={{ flex: 1, padding: "16px" }}>
        <List style={{ padding: 0 }}>{menuItems.map(renderMenuItem)}</List>
      </Box>
    </Paper>
  )
}

export default Sidebar
