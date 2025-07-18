import { Route } from 'react-router-dom';
import ProtectedRoute from "./ProtectedRoute";
import StoreList from '../pages/deokkyu/store/StoreList';
import StoreCustomerList from '../pages/deokkyu/store/StoreCustomerList';
import StoreRegisterList from '../pages/deokkyu/store/StoreRegisterList';

function DeokkyuRoute() {
    return (
        <>
            {/* 무조건 ProtectedRoute 안에 Route 넣으세요 - 인증 및 보안 필요해서 */}
            <Route element={<ProtectedRoute />}>
                <Route path='/storelist' element={<StoreList />} />
                <Route path='/storecustomerlist' element={< StoreCustomerList/>} />
                <Route path='/storeregisterlist' element={< StoreRegisterList/>} />
            </Route>
        </>
    );
}

export default DeokkyuRoute;