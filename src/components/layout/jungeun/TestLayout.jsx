import React from "react";
import Header from "./TestHeader";
import { Outlet } from "react-router-dom";

const Layout = () => {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", width:"100vw"}}>
      <Header />
      <main style={{ display:"flex", flex: 1, justifyContent:"center", alignItems:"center", margin:"0 auto"}}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
