import "./App.css";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import NoticeList from "./pages/jiyun/notice/NoticeList";
import NoticeWrite from "./pages/jiyun/notice/NoticeWrite";
import NoticeUpdate from "./pages/jiyun/notice/NoticeUpdate";
import CommissionSetting from "./pages/jiyun/commission-setting/CommissionSetting";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/notice" element={<NoticeList />} />
        <Route path="/notice/write" element={<NoticeWrite />} />
        <Route path="/notice/update/:noticeIndex" element={<NoticeUpdate />} />
        <Route path="/commission-setting" element={<CommissionSetting />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
