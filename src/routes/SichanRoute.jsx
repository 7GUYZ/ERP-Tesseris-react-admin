import { Route } from 'react-router-dom';
import ProtectedRoute from "./ProtectedRoute";
import AdminQnaListPage from '../pages/sichan/AdminQnaListPage';
import AdminQnaDetailPage from '../pages/sichan/AdminQnaDetailPage';

function SichanRoute() {
    return (
        <>
            {/* 무조건 ProtectedRoute 안에 Route 넣으세요 - 인증 및 보안 필요해서 */}
            <Route element={<ProtectedRoute />}>
                <Route path='admin/sichan/qna/list' element={<AdminQnaListPage />} />
                <Route path='admin/sichan/qna/detail/:qnaIndex' element={<AdminQnaDetailPage />} />
            </Route>
        </>
    );
}

export default SichanRoute;