import React from "react";
import { Outlet } from "react-router-dom";
import MainHeader from "./MainHeader";
import MainNavi from "./MainNavi";
import "../../../../styles/jihun/maintemple/maintempleside.css";

const MainLayout = () => {
  return (
    <div className="dashboard-container">
      <MainNavi />
      <div className="main-content">
        <MainHeader />
        <main className="dashboard-main">
          <div className="dashboard-content">
            <div className="content-area">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout; 