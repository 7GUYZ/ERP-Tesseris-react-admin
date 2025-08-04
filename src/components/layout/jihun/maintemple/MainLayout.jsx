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
            </div>
          </div>
        </main>
      </div>
      
      {/* 실시간 채팅 컴포넌트를 content-area 밖으로 이동 */}
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        pointerEvents: 'none',
        zIndex: 1000 
      }}>
        <WebSocketChatProvider>
          <RealTimeChat /> 
        </WebSocketChatProvider>
      </div>
    </div>
  );
};

export default MainLayout; 