import React from "react";
import { Outlet } from "react-router-dom";
import MainHeader from "./MainHeader";
import MainNavi from "./MainNavi";
import "../../../../styles/jihun/maintemple/maintempleside.css";
import RealTimeChat from '../../../chat/RealTimeChat';
import WebSocketChatProvider from "../../../chat/WebSocketConfig";
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
              {/* 실시간 채팅 컴포넌트 추가덕 */}
              <WebSocketChatProvider>
              <RealTimeChat /> 
              </WebSocketChatProvider>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout; 