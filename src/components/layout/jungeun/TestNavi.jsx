import React from "react";

const TestNavi = () => {
  return (
    <nav
      style={{
        width: "200px",
        height: "100vh", // 브라우저 전체 높이
        backgroundColor: "#1A1F36",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        padding: "20px 0",
        position: "fixed",
        left: 0,
        top: 0,
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: "40px" }}>메뉴</h2>
      <a href="/TestMain" style={menuStyle}>대시보드</a>
      <a href="/TestMain" style={menuStyle}>회원 관리</a>
      <a href="/TestMain" style={menuStyle}>결제 내역</a>
      <a href="/TestMain" style={menuStyle}>환경 설정</a>
      <a href="/MonthlyCmLimit" style={menuStyle}>월 CM 한도</a>
    </nav>
  );
};

const menuStyle = {
  padding: "12px 20px",
  color: "#fff",
  textDecoration: "none",
  fontWeight: "500",
  transition: "background 0.2s",
  marginBottom: "4px",
};

export default TestNavi;
