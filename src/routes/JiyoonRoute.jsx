import { Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import CommissionSetting from "../pages/jiyun/commission-setting/CommissionSetting";
import CmsAccessLog from "../pages/jiyun/cmsAccessLog/CmsAccessLog";
import NoticeList from "../pages/jiyun/notice/NoticeList";
import NoticeUpdate from "../pages/jiyun/notice/NoticeUpdate";
import NoticeWrite from "../pages/jiyun/notice/NoticeWrite";
import UpdateLog from "../pages/jiyun/updateLog/UpdateLog";

function JiyoonRoute() {
  return (
    <>
      {/* 무조건 ProtectedRoute 안에 Route 넣으세요 - 인증 및 보안 필요해서 */}
      <Route element={<ProtectedRoute />}>
        <Route path="/commissionSetting" element={<CommissionSetting />} />
        <Route path="/cmsAccessLog" element={<CmsAccessLog />} />
        <Route path="/notice/list" element={<NoticeList />} />
        <Route path="/notice/update/:noticeIndex" element={<NoticeUpdate />} />
        <Route path="/notice/write" element={<NoticeWrite />} />
        <Route path="/updateLog" element={<UpdateLog />} />
      </Route>
    </>
  );
}

export default JiyoonRoute;
