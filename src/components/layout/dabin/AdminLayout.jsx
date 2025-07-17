"use client"

import Sidebar from "./Sidebar"
import Header from "./Header"

const AdminLayout = ({ children }) => {
  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#f9fafb" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Header />
        <main style={{ flex: 1, overflow: "auto" }}>{children}</main>
      </div>
    </div>
  )
}

export default AdminLayout
