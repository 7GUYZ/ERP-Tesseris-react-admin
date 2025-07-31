import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  getCurrentPermissionContext, 
  validatePermissionContext,
  checkButtonPermission,
  setCurrentPermissionContext
} from '../utils/authorityUtils';

export const usePermission = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [permissionInfo, setPermissionInfo] = useState(null);

  // 권한 컨텍스트 유효성 검사
  useEffect(() => {
    const checkPermission = async () => {
      setIsLoading(true);
      
      try {
        const isValid = await validatePermissionContext();
        
        if (!isValid) {
          console.log('권한이 없거나 만료됨');
          setHasAccess(false);
          // 권한이 없으면 이전 페이지로 이동 (대시보드로 강제 이동하지 않음)
          // navigate('/dashboard');
        } else {
          setHasAccess(true);
          const context = getCurrentPermissionContext();
          setPermissionInfo(context);
        }
      } catch (error) {
        console.error('권한 체크 실패:', error);
        setHasAccess(false);
        navigate('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    checkPermission();
  }, [location.pathname, navigate]);

  // 버튼 권한 체크 함수
  const checkButtonPermissionAsync = async (action) => {
    return await checkButtonPermission(action);
  };

  // 권한 컨텍스트 설정 함수
  const setPermissionContext = (menuIndex, programIndex) => {
    setCurrentPermissionContext(menuIndex, programIndex, location.pathname);
  };

  return { 
    isLoading, 
    hasAccess, 
    permissionInfo, 
    checkButtonPermission: checkButtonPermissionAsync,
    setPermissionContext
  };
}; 