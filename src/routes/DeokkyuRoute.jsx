import { Route } from 'react-router-dom';
import ProtectedRoute from "./ProtectedRoute";
import StoreList from '../pages/deokkyu/store/StoreList';
import StoreCustomerList from '../pages/deokkyu/store/StoreCustomerList';
import StoreRegisterList from '../pages/deokkyu/store/StoreRegisterList';
import BusinessManAllowanceDetails from '../pages/deokkyu/businessman/BusinessManAllowanceDetails';
import BusinessManOrgChart from '../pages/deokkyu/businessman/BusinessManOrgChart';
import AdminList from '../pages/deokkyu/other/AdminList';
import WithdrawlList from '../pages/deokkyu/other/WithdrawlList';


function DeokkyuRoute() {
    return (
        <>
            {/* 무조건 ProtectedRoute 안에 Route 넣으세요 - 인증 및 보안 필요해서 */}
            <Route element={<ProtectedRoute />}>
                <Route path='/storelist' element={<StoreList />} />
                <Route path='/storecustomerlist' element={< StoreCustomerList/>} />
                <Route path='/storeregisterlist' element={< StoreRegisterList/>} />
                <Route path='/businessallowance' element={< BusinessManAllowanceDetails/>} />
                <Route path='/businessorgchart' element={< BusinessManOrgChart/>} />
                <Route path='/adminlist' element={< AdminList/>} />
                <Route path='/withdrawllist' element={< WithdrawlList/>} />
            </Route>
        </>
    );
}

export default DeokkyuRoute;