"use client"

import { useState } from "react"
import "../../../styles/jungeun/testSidebar.css"

const Sidebar = () => {
    const [expandedMenus, setExpandedMenus] = useState({
        analysis: true,
    })

    const handleLogout = async (e) => {
        e.preventDefault()

        try {
            const response = await logout();
            if (response.data.status === "success") {
                useAuthStore.getState().zu_logout();
                localStorage.removeItem("access-token");
                localStorage.removeItem("user-info");
                // 홈으로 이동
                window.location.href = "/";

            }
        } catch (error) {

        }
    }

    const toggleMenu = (menuKey) => {
        setExpandedMenus((prev) => ({
            ...prev,
            [menuKey]: !prev[menuKey],
        }))
    }

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h2 className="logo">CMBarter</h2>
                <button className="logout-btn" onClick={handleLogout}>로그아웃</button>
                <div className="user-info">
                    <span className="user-badge">전산간부</span>
                    <span className="username">yeomkh</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                <div className="nav-item">
                    <span className="nav-icon">📊</span>
                    <span>대시 보드</span>
                </div>

                <div className="nav-item">
                    <span className="nav-icon">👤</span>
                    <span>마이페이지</span>
                </div>

                <div className="nav-group">
                    <div className="nav-item expandable active" onClick={() => toggleMenu("analysis")}>
                        <span className="nav-icon">📈</span>
                        <span>분석 관리</span>
                        <span className={`expand-icon ${expandedMenus.analysis ? "expanded" : ""}`}>▼</span>
                    </div>

                    {expandedMenus.analysis && (
                        <div className="sub-menu">
                            <div className="sub-nav-item">구분 관리</div>
                            <div className="sub-nav-item">중개수수료율 설정</div>
                            <div className="sub-nav-item">CMS 관리자 명단</div>
                            <div className="sub-nav-item">권한 관리</div>
                            <div className="sub-nav-item active">월 CM사용한도</div>
                            <div className="sub-nav-item">정회원단계별 CM설정</div>
                        </div>
                    )}
                </div>

                <div className="nav-group">
                    <div className="nav-item expandable">
                        <span className="nav-icon">📋</span>
                        <span>회원 관리</span>
                        <span className="expand-icon">▼</span>
                    </div>
                </div>

                <div className="nav-group">
                    <div className="nav-item expandable">
                        <span className="nav-icon">👥</span>
                        <span>사업자 관리</span>
                        <span className="expand-icon">▼</span>
                    </div>
                </div>

                <div className="nav-group">
                    <div className="nav-item expandable">
                        <span className="nav-icon">💰</span>
                        <span>가맹점 관리</span>
                        <span className="expand-icon">▼</span>
                    </div>
                </div>

                <div className="nav-group">
                    <div className="nav-item expandable">
                        <span className="nav-icon">📢</span>
                        <span>홍보 관리</span>
                        <span className="expand-icon">▼</span>
                    </div>
                </div>

                <div className="nav-group">
                    <div className="nav-item expandable">
                        <span className="nav-icon">🏢</span>
                        <span>고객센터</span>
                        <span className="expand-icon">▼</span>
                    </div>
                </div>

                <div className="nav-group">
                    <div className="nav-item expandable">
                        <span className="nav-icon">📊</span>
                        <span>로그 관리</span>
                        <span className="expand-icon">▼</span>
                    </div>
                </div>
            </nav>
        </div>
    )
}

export default Sidebar
