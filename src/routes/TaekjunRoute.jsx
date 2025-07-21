import { Route } from 'react-router-dom';
import ProtectedRoute from "./ProtectedRoute";
import PermissionManagement from '../pages/taekjun/PermissionManagement.jsx';
import AdminMyPage from '../pages/taekjun/AdminMyPage.jsx';

function TaekjunRoute() {
    return (
        <>
            {/* 무조건 ProtectedRoute 안에 Route 넣으세요 - 인증 및 보안 필요해서 */}
            <Route element={<ProtectedRoute />}>
                <Route path='/PermissionManagement' element={<PermissionManagement/>} />
                <Route path='/adminmypage' element={<AdminMyPage/>} />
            </Route>
        </>
    );
}

export default TaekjunRoute;