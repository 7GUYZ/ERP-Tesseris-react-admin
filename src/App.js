import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MemberAssetSearch from './pages/jihun/MemberAssetSearch';
import "./styles/jihun/MemberAssetSearchVariables.css";
function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MemberAssetSearch />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
