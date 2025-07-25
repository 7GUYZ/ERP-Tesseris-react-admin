import React from 'react';
import { Routes, Route } from 'react-router-dom';
import UserListPage from '../pages/taekjun/UserListPage';
import BusinessmanListPage from '../pages/taekjun/BusinessmanListPage';
import PermissionManagement from '../pages/taekjun/PermissionManagement';
import AdminMyPage from '../pages/taekjun/AdminMyPage';
import Dashboard from '../pages/taekjun/Dashboard';

const TaekjunRoute = () => {
  return (
    <Routes>
      <Route path="/user-list" element={<UserListPage />} />
      <Route path="/businessman-list" element={<BusinessmanListPage />} />
      <Route path="/permission-management" element={<PermissionManagement />} />
      <Route path="/admin-mypage" element={<AdminMyPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
};

export default TaekjunRoute;