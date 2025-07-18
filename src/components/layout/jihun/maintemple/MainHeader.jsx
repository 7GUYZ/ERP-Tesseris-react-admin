import React from "react";
import { Bell } from "lucide-react";
import { logout } from "../../../../api/auth/JungeunAuth";
import useAuthStore from "../../../../store/jungeun/AuthStore";
import "../../../../styles/jihun/maintemple/maintempleside.css";

const MainHeader = () => {
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
            console.error("로그아웃 중 오류 발생:", error);
        }
    }

    return (
        <header className="comfortable-header">
            <div className="header-left">
                {/* <h1 className="dashboard-title"></h1> */}
            </div>
            <div className="header-right">
                <button className="notification-button">
                    <Bell size={20} />
                    <span className="notification-dot"></span>
                </button>
                <span className="logout-text" onClick={handleLogout}>
                    Logout
                </span>
            </div>
        </header>
    );
};

export default MainHeader; 