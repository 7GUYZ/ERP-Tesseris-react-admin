import { useNavigate } from "react-router-dom";
import { logout } from "../../../../api/auth/JungeunAuth";
import useAuthStore from "../../../../store/jungeun/AuthStore";
import Popover from "../../../../components/feature/jiyun/popover/Popover";
import "../../../../styles/jihun/maintemple/maintempleside.css";

const MainHeader = () => {
  const navigate = useNavigate();
  const handleLogout = async (e) => {
    e.preventDefault();

    try {
      const response = await logout();
      if (response.data.status === "success") {
        useAuthStore.getState().zu_logout();
        localStorage.removeItem("access-token");
        localStorage.removeItem("user-info");
        // 홈으로 이동
        navigate("/");
      }
    } catch (error) {
      console.error("로그아웃 중 오류 발생:", error);
    }
  };

  return (
    <header className="comfortable-header">
      <div className="header-left">
        {/* <h1 className="dashboard-title"></h1> */}
      </div>
      <div className="header-right">
        <Popover />
        <span className="logout-text" onClick={handleLogout}>
          Logout
        </span>
      </div>
    </header>
  );
};

export default MainHeader;
