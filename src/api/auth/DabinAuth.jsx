import { api } from "../Http";


// 관리자 쿠폰 관리
export const getCouponIssuanceStatus = (params) => {
    const accessToken = localStorage.getItem("access-token");
    return api.get("/coupons/status/issuance", {
      headers: {
        Authorization: accessToken
      }
    });
  };
  export const getCouponProvidedStatus = (params) => {
    const accessToken = localStorage.getItem("access-token");
    return api.get("/coupons/status/provided", {
      headers: {
        Authorization: accessToken
      }
    });
  };
export const searchCoupons = (params) => {
  const accessToken = localStorage.getItem("access-token");
  return api.post("/coupons/search", params, {
    headers: {
      Authorization: accessToken
    }
  });
};



// 영업실적 관련 API
export const getBusinessGradeList = () => {
  const accessToken = localStorage.getItem("access-token");
  return api.get("/sales-performance/grade", {
    headers: {
      Authorization: accessToken
    }
  });
};

export const getStoreRequestStatusList = () => {
  const accessToken = localStorage.getItem("access-token");
  return api.get("/sales-performance/store-request-status", {
    headers: {
      Authorization: accessToken
    }
  });
};

export const searchSalesPerformance = (params) => {
  const accessToken = localStorage.getItem("access-token");
  return api.post("/sales-performance/search", params, {
    headers: {
      Authorization: accessToken
    }
  });
};

// 회원 추천현황 관련 API
export const getUserRoles = () => {
  const accessToken = localStorage.getItem("access-token");
  return api.get("/member-recommendation/user-roles", {
    headers: {
      Authorization: accessToken
    }
  });
};

export const searchMemberRecommendations = (params) => {
  const accessToken = localStorage.getItem("access-token");
  return api.post("/member-recommendation/search", params, {
    headers: {
      Authorization: accessToken
    }
  });
};

// 수당 지급 내역 관련 API
export const searchCommissionPayments = (params) => {
  const accessToken = localStorage.getItem("access-token");
  console.log("=== API 요청 상세 ===");
  console.log("API 요청 파라미터:", params);
      console.log("추천인 등급 값:", params.userRoleIndex);
  console.log("API 요청 토큰:", accessToken);
  
  return api.post("/dabin/commission-payment/search", params, {
    headers: {
      Authorization: accessToken.startsWith("Bearer ") ? accessToken : `Bearer ${accessToken}`
    }
  }).then(response => {
    console.log("API 응답 전체:", response);
    return response;
  }).catch(error => {
    console.error("API 요청 실패:", error);
    throw error;
  });
};

// 광고 관리 관련 API
export const getAdvertisementList = () => {
  const accessToken = localStorage.getItem("access-token");
  return api.get("/dabin/advertisement/list", {
    headers: {
      Authorization: accessToken.startsWith("Bearer ") ? accessToken : `Bearer ${accessToken}`
    }
  });
};

export const getAdvertisement = (advertisementIndex) => {
  const accessToken = localStorage.getItem("access-token");
  return api.get(`/dabin/advertisement/${advertisementIndex}`, {
    headers: {
      Authorization: accessToken.startsWith("Bearer ") ? accessToken : `Bearer ${accessToken}`
    }
  });
};

export const createAdvertisement = (formData) => {
  const accessToken = localStorage.getItem("access-token");
  return api.post("/dabin/advertisement/create", formData, {
    headers: {
      Authorization: accessToken.startsWith("Bearer ") ? accessToken : `Bearer ${accessToken}`,
      'Content-Type': 'multipart/form-data',
    },
    timeout: 30000 // 30초 타임아웃
  });
};

export const updateAdvertisement = (advertisementIndex, formData) => {
  const accessToken = localStorage.getItem("access-token");
  return api.put(`/dabin/advertisement/${advertisementIndex}`, formData, {
    headers: {
      Authorization: accessToken.startsWith("Bearer ") ? accessToken : `Bearer ${accessToken}`,
      'Content-Type': 'multipart/form-data',
    }
  });
};

export const deleteAdvertisement = (advertisementIndex) => {
  const accessToken = localStorage.getItem("access-token");
  return api.delete(`/dabin/advertisement/${advertisementIndex}`, {
    headers: {
      Authorization: accessToken.startsWith("Bearer ") ? accessToken : `Bearer ${accessToken}`
    }
  });
};

// presigned URL 받아오기
export const getPresignedUrl = async (fileKey) => {
  const accessToken = localStorage.getItem("access-token");
  try {
    const response = await api.get(`/store/images/presigned`, {
      params: { fileKey },
      headers: {
        Authorization: accessToken.startsWith("Bearer ") ? accessToken : `Bearer ${accessToken}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching presigned url:', error);
    throw error;
  }
};

// 배너 관리 관련 API
export const getBannerList = () => {
  const accessToken = localStorage.getItem("access-token");
  return api.get("/dabin/banner/list", {
    headers: {
      Authorization: accessToken.startsWith("Bearer ") ? accessToken : `Bearer ${accessToken}`
    }
  });
};

export const getBanner = (bannerIndex) => {
  const accessToken = localStorage.getItem("access-token");
  return api.get(`/dabin/banner/${bannerIndex}`, {
    headers: {
      Authorization: accessToken.startsWith("Bearer ") ? accessToken : `Bearer ${accessToken}`
    }
  });
};

export const createBanner = (formData) => {
  const accessToken = localStorage.getItem("access-token");
  return api.post("/dabin/banner/create", formData, {
    headers: {
      Authorization: accessToken.startsWith("Bearer ") ? accessToken : `Bearer ${accessToken}`,
      'Content-Type': 'multipart/form-data',
    }
  });
};

export const updateBanner = (bannerIndex, formData) => {
  const accessToken = localStorage.getItem("access-token");
  return api.put(`/dabin/banner/${bannerIndex}`, formData, {
    headers: {
      Authorization: accessToken.startsWith("Bearer ") ? accessToken : `Bearer ${accessToken}`,
      'Content-Type': 'multipart/form-data',
    }
  });
};

export const deleteBanner = (bannerIndex) => {
  const accessToken = localStorage.getItem("access-token");
  return api.delete(`/dabin/banner/${bannerIndex}`, {
    headers: {
      Authorization: accessToken.startsWith("Bearer ") ? accessToken : `Bearer ${accessToken}`
    }
  });
};

