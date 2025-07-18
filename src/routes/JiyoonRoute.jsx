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
        <Route path="/CmsAccessLog" element={<CmsAccessLog />} />
        <Route path="/noticeList" element={<NoticeList />} />
        <Route path="/noticeUpdate" element={<NoticeUpdate />} />
        <Route path="/noticeWrite" element={<NoticeWrite />} />
        <Route path="/updateLog" element={<UpdateLog />} />
      </Route>
    </>
  );
}

export default JiyoonRoute;
