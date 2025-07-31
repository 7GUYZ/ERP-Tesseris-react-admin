import { useMemo } from 'react';

const useAuthorityMapping = (authorityList = []) => {
  const authorityMap = useMemo(() => {
    const map = new Map();
    
    authorityList.forEach(authority => {
      const key = `${authority.menuIndex}-${authority.programIndex}`;
      map.set(key, authority);
    });
    
    return map;
  }, [authorityList]);

  const hasPermission = (menuIndex, programIndex) => {
    const key = `${menuIndex}-${programIndex}`;
    return authorityMap.has(key);
  };

  const getPermission = (menuIndex, programIndex) => {
    const key = `${menuIndex}-${programIndex}`;
    return authorityMap.get(key);
  };

  const getAllPermissions = () => {
    return Array.from(authorityMap.values());
  };

  return {
    hasPermission,
    getPermission,
    getAllPermissions,
    authorityMap
  };
};

export default useAuthorityMapping; 