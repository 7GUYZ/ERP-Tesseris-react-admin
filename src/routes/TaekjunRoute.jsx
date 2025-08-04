import React from 'react';
import { Route } from 'react-router-dom';
import ProtectedRoute from "./ProtectedRoute";
import UserListPage from '../pages/taekjun/UserListPage';
import BusinessmanListPage from '../pages/taekjun/BusinessmanListPage';
import PermissionManagement from '../pages/taekjun/PermissionManagement';
import AdminMyPage from '../pages/taekjun/AdminMyPage';
import Dashboard from '../pages/taekjun/Dashboard';
import AdminTypeInsertPage from '../pages/taekjun/AdminTypeInsertPage';

function TaekjunRoute() {
  return (
    <>
      {/* 무조건 ProtectedRoute 안에 Route 넣으세요 - 인증 및 보안 필요해서 */}
      <Route element={<ProtectedRoute />}>
        <Route path="/userlist" element={<UserListPage />} />
        <Route path="/user-admin-list" element={<UserListPage />} />
        <Route path="/businessman-admin-list" element={<BusinessmanListPage />} />
        <Route path="/permissionmanagement" element={<PermissionManagement />} />
        <Route path="/adminmypage" element={<AdminMyPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin-type-insert" element={<AdminTypeInsertPage />} />
      </Route>
    </>
  );
}

export default TaekjunRoute;