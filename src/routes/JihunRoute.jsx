import { Route} from 'react-router-dom';
import ProtectedRoute from "./ProtectedRoute";
import MemberAssetSearch from '../pages/jihun/memberaccount/MemberAssetSearch';
import MemberAssetDetails from '../pages/jihun/memberassetdetails/MemberAssetDetails';

function JihunRoute() {
    return (
        <>
            {/* 무조건 ProtectedRoute 안에 Route 넣으세요 - 인증 및 보안 필요해서 */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/memberaccount" element={<MemberAssetSearch />} />
                    <Route path="/memberassetdetails" element={<MemberAssetDetails />} />
                </Route>
        </>
    );
}

export default JihunRoute;