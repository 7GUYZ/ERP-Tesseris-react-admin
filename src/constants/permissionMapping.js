// 메뉴별 권한 매핑 (menuIndex, programIndex)
export const MENU_PERMISSION_MAPPING = {
  // 회원관리
  '/userlist': { menuIndex: 1, programIndex: 1, name: '회원관리' },
  '/user-admin-list': { menuIndex: 1, programIndex: 1, name: '회원관리' },
  
  // 권한관리
  '/permissionmanagement': { menuIndex: 1, programIndex: 8, name: '권한관리' },
  
  // 사업자관리
  '/businessman-admin-list': { menuIndex: 2, programIndex: 17, name: '사업자관리' },
  
  // 공지사항
  '/notice/list': { menuIndex: 3, programIndex: 1, name: '공지사항' },
  '/notice/write': { menuIndex: 3, programIndex: 1, name: '공지사항' },
  '/notice/update': { menuIndex: 3, programIndex: 1, name: '공지사항' },
  
  // 대시보드
  '/dashboard': { menuIndex: 0, programIndex: 0, name: '대시보드' },
  
  // 관리자 마이페이지
  '/adminmypage': { menuIndex: 4, programIndex: 1, name: '관리자마이페이지' },
  
  // 가맹점 관리
  '/storelist': { menuIndex: 5, programIndex: 1, name: '가맹점관리' },
  '/storecustomerlist': { menuIndex: 5, programIndex: 2, name: '가맹점고객현황' },
  '/storeregisterlist': { menuIndex: 5, programIndex: 3, name: '가맹점신청현황' },
  
  // 사업자 수당
  '/businessallowance': { menuIndex: 6, programIndex: 1, name: '사업자수당' },
  '/businessorgchart': { menuIndex: 6, programIndex: 2, name: '사업자조직도' },
  
  // 관리자 리스트
  '/adminlist': { menuIndex: 7, programIndex: 1, name: '관리자리스트' },
  '/withdrawllist': { menuIndex: 7, programIndex: 2, name: '출금관리' },
  
  // 회원 자산 관리
  '/memberaccount': { menuIndex: 8, programIndex: 1, name: '회원자산관리' },
  '/memberassetdetails': { menuIndex: 8, programIndex: 2, name: '회원자산상세' },
  
  // 수수료 설정
  '/commissionSetting': { menuIndex: 9, programIndex: 1, name: '수수료설정' },
  
  // CMS 접근 로그
  '/cmsAccessLog': { menuIndex: 10, programIndex: 1, name: 'CMS접근로그' },
  
  // 업데이트 로그
  '/updateLog': { menuIndex: 11, programIndex: 1, name: '업데이트로그' },
  
  // 알림 설정
  '/alert': { menuIndex: 12, programIndex: 1, name: '알림설정' },
  
  // 광고 관리
  '/advertisement/list': { menuIndex: 13, programIndex: 1, name: '광고관리' },
  '/advertisement/create': { menuIndex: 13, programIndex: 1, name: '광고관리' },
  '/advertisement/edit': { menuIndex: 13, programIndex: 1, name: '광고관리' },
  '/advertisement/detail': { menuIndex: 13, programIndex: 1, name: '광고관리' },
  
  // 배너 관리
  '/banner/list': { menuIndex: 14, programIndex: 1, name: '배너관리' },
  '/banner/create': { menuIndex: 14, programIndex: 1, name: '배너관리' },
  '/banner/edit': { menuIndex: 14, programIndex: 1, name: '배너관리' },
  '/banner/detail': { menuIndex: 14, programIndex: 1, name: '배너관리' },
  
  // 쿠폰 관리
  '/coupon': { menuIndex: 15, programIndex: 1, name: '쿠폰관리' },
  
  // 회원 추천 관리
  '/member-recommendation': { menuIndex: 16, programIndex: 1, name: '회원추천관리' },
  
  // 매출 실적
  '/sales-performance': { menuIndex: 17, programIndex: 1, name: '매출실적' },
  
  // 수수료 지급
  '/commission-payment': { menuIndex: 18, programIndex: 1, name: '수수료지급' },
 

  // 권한 타입 관리
  '/admin-type-insert': { menuIndex: 1, programIndex: 40, name: '권한 타입 관리' }
};

// URL 패턴 매칭 함수
export const getPermissionByPath = (pathname) => {
  // 정확한 매칭 먼저 시도
  if (MENU_PERMISSION_MAPPING[pathname]) {
    return MENU_PERMISSION_MAPPING[pathname];
  }
  
  // 패턴 매칭 (동적 라우트)
  for (const [pattern, permission] of Object.entries(MENU_PERMISSION_MAPPING)) {
    if (pattern.includes(':')) {
      const regexPattern = pattern.replace(/:[^/]+/g, '[^/]+');
      const regex = new RegExp(`^${regexPattern}$`);
      if (regex.test(pathname)) {
        return permission;
      }
    }
  }
  
  // 부분 매칭 (경로가 포함된 경우)
  for (const [pattern, permission] of Object.entries(MENU_PERMISSION_MAPPING)) {
    if (pathname.startsWith(pattern)) {
      return permission;
    }
  }
  
  return null;
}; 