import React from "react";
import { Outlet } from "react-router-dom";
import Header2 from "./TestHeader2";


const Layout = () => {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", width:"100vw"}}>
      <Header2 />
      <main style={{ display:"flex", flex: 1, justifyContent:"center", alignItems:"center", margin:"0 auto"}}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
