"use client"
import {
  AppBar,
  Toolbar,
  Typography,
  TextField,
  IconButton,
  Badge,
  Avatar,
  Button,
  Box,
  InputAdornment,
} from "@mui/material"
import { Notifications, Search, Person } from "@mui/icons-material"

const Header = () => {
  return (
    <AppBar
      position="static"
      elevation={0}
      style={{
        backgroundColor: "white",
        borderBottom: "1px solid #e5e7eb",
        color: "#111827",
      }}
    >
      <Toolbar style={{ justifyContent: "space-between", padding: "0 24px" }}>
        <Typography variant="h6" style={{ fontWeight: 600, color: "#111827" }}>
          
        </Typography>

        <Box style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          
          {/* Notifications */}
          <IconButton style={{ color: "#6b7280" }}>
            <Badge badgeContent={1} color="error">
              <Notifications />
            </Badge>
          </IconButton>

          {/* User Menu */}
          <Box style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Avatar style={{ backgroundColor: "#d1d5db", color: "#6b7280", width: 32, height: 32 }}>
              <Person />
            </Avatar>
            <Typography variant="body2" style={{ fontWeight: 500, color: "#374151" }}>
              관리자
            </Typography>
          </Box>

          {/* Action Buttons */}
          <Box style={{ display: "flex", gap: "8px" }}>

          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Header
