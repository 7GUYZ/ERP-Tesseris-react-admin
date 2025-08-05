import { Route } from 'react-router-dom';
import TestMain from "../pages/jungeun/TestMain";
import ProtectedRoute from "./ProtectedRoute";
import MonthlyTsLimitPage from '../pages/jungeun/MonthlyTsLimitPage';

function JungeunRoute() {
    return (
        <>
            {/* 무조건 ProtectedRoute 안에 Route 넣으세요 - 인증 및 보안 필요해서 */}
            <Route element={<ProtectedRoute />}>
                <Route path='/TestMain' element={<TestMain />} />
                <Route path='/MonthlyTsLimit' element={<MonthlyTsLimitPage />} />
            </Route>
        </>
    );
}

export default JungeunRoute;