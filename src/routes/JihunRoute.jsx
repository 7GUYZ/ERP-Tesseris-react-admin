import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from "./ProtectedRoute";
import MemberAssetSearch from '../pages/jihun/memberaccount/MemberAssetSearch';

function JihunRoute() {
    return (
        <>
            {/* 무조건 ProtectedRoute 안에 Route 넣으세요 - 인증 및 보안 필요해서 */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/memberaccount" element={<MemberAssetSearch />} />
                </Route>
        </>
    );
}

export default JihunRoute;