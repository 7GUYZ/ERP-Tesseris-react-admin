import { Routes, Route } from 'react-router-dom';
import JungeunRoute from './JungeunRoute';
import TestLayout from '../components/layout/jungeun/TestLayout';
import DabinRoute from './DabinRoute';
import DeokkyuRoute from './DeokkyuRoute';
import JihunRoute from './JihunRoute';
import JiyoonRoute from './JiyoonRoute';
import SichanRoute from './SichanRoute';
import TaekjunRoute from './TaekjunRoute';
function AppRoutes() {
    return (
        <Routes>
            <Route element={<TestLayout />}> {/* 임시Layout(임시Header+임시Navi) */}
                {/* 팀원들 Routes */}
                {DabinRoute()}
                {DeokkyuRoute()}
                {JihunRoute()}
                {JiyoonRoute()}
                {JungeunRoute()}
                {SichanRoute()}
                {TaekjunRoute()}
            </Route>
        </Routes>
    );
}

export default AppRoutes;