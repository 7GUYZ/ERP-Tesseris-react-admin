import React from 'react';
import { Route } from 'react-router-dom';
import ProtectedRoute from "./ProtectedRoute";
import UserListPage from '../pages/taekjun/UserListPage';
import BusinessmanListPage from '../pages/taekjun/BusinessmanListPage';
import PermissionManagement from '../pages/taekjun/PermissionManagement';
import AdminMyPage from '../pages/taekjun/AdminMyPage';
import Dashboard from '../pages/taekjun/Dashboard';

const TaekjunRoute = () => {
  return (
    <>
      {/* 무조건 ProtectedRoute 안에 Route 넣으세요 - 인증 및 보안 필요해서 */}
      <Route element={<ProtectedRoute />}>
        <Route path="/user-list" element={<UserListPage />} />
        <Route path="/businessman-list" element={<BusinessmanListPage />} />
        <Route path="/permission-management" element={<PermissionManagement />} />
        <Route path="/admin-mypage" element={<AdminMyPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>
    </>
  );
};

export default TaekjunRoute;