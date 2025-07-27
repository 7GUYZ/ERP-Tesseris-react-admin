import { Route } from 'react-router-dom';
import ProtectedRoute from "./ProtectedRoute";
import CouponAdminPage from '../pages/dabin/CouponAdminPage';
import SalesPerformancePage from '../pages/dabin/SalesPerformancePage';
import MemberRecommendationPage from '../pages/dabin/MemberRecommendationPage';
import CommissionPaymentPage from '../pages/dabin/CommissionPaymentPage';
import AdvertisementListPage from '../pages/dabin/AdvertisementListPage';
import AdvertisementCreatePage from '../pages/dabin/AdvertisementCreatePage';
import AdvertisementEditPage from '../pages/dabin/AdvertisementEditPage';
import AdvertisementDetailPage from '../pages/dabin/AdvertisementDetailPage';
import BannerListPage from '../pages/dabin/BannerListPage';
import BannerCreatePage from '../pages/dabin/BannerCreatePage';
import BannerEditPage from '../pages/dabin/BannerEditPage';
import BannerDetailPage from '../pages/dabin/BannerDetailPage';

function DabinRoute() {
    return (
        <>
            {/* 무조건 ProtectedRoute 안에 Route 넣으세요 - 인증 및 보안 필요해서 */}
            <Route element={<ProtectedRoute />}>
                <Route path='/coupon' element={<CouponAdminPage />} />
                <Route path='/sales-performance' element={<SalesPerformancePage />} />
                <Route path='/member-recommendation' element={<MemberRecommendationPage />} />
                <Route path='/commission-payment' element={<CommissionPaymentPage />} />
                
                {/* 광고 관리 페이지들 */}
                <Route path='/advertisement/list' element={<AdvertisementListPage />} />
                <Route path='/advertisement/create' element={<AdvertisementCreatePage />} />
                <Route path='/advertisement/edit/:advertisementIndex' element={<AdvertisementEditPage />} />
                <Route path='/advertisement/detail/:advertisementIndex' element={<AdvertisementDetailPage />} />
                
                {/* 배너 관리 페이지들 */}
                <Route path='/banner/list' element={<BannerListPage />} />
                <Route path='/banner/create' element={<BannerCreatePage />} />
                <Route path='/banner/edit/:bannerIndex' element={<BannerEditPage />} />
                <Route path='/banner/detail/:bannerIndex' element={<BannerDetailPage />} />
            </Route>
        </>
    );
}

export default DabinRoute;