import React from "react";
import { Outlet } from "react-router-dom";
import TestHeader from "./TestHeader";
import TestNavi from "./TestNavi";

const TestLayout = () => {
  return (
    <div style={{ display: "flex" }}>
      <TestNavi />
      <div style={{ marginLeft: "200px", width: "100%"}}>
        <TestHeader />
        <main style={{ padding: "20px" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default TestLayout;