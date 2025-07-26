import { useNavigate } from "react-router-dom";
import { logout } from "../../../../api/auth/JungeunAuth";
import useAuthStore from "../../../../store/jungeun/AuthStore";
import { clearAuthorityCache } from "../../../../utils/authorityUtils";
import Popover from "../../../../components/feature/jiyun/popover/Popover";
import "../../../../styles/jihun/maintemple/maintempleside.css";

const MainHeader = () => {
  const navigate = useNavigate();
  const handleLogout = async (e) => {
    e.preventDefault();

        try {
            const response = await logout();
            console.log("로그아웃 응답:", response);
            
            // 응답 상태와 관계없이 로컬 정리 수행
            useAuthStore.getState().zu_logout();
            localStorage.removeItem("access-token");
            localStorage.removeItem("user-info");
            // 권한 캐시 클리어
            clearAuthorityCache();
            // 홈으로 이동
            navigate("/");
            
        } catch (error) {
            console.error("로그아웃 중 오류 발생:", error);
            // 에러가 발생해도 로컬 정리 수행
            useAuthStore.getState().zu_logout();
            localStorage.removeItem("access-token");
            localStorage.removeItem("user-info");
            clearAuthorityCache();
            navigate("/");
        }
    }

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
