import React from 'react';
import { usePermission } from '../../hooks/usePermission';
import LoadingSpinner from '../ui/jungeun/LoadingSpinner';

const PermissionGuard = ({ children }) => {
  const { isLoading, hasAccess } = usePermission();

  if (isLoading) {
    return <LoadingSpinner text="권한 확인 중..." />;
  }

  return hasAccess ? children : null;
};

export default PermissionGuard; 