import { BrowserRouter, Route, Routes } from 'react-router-dom';
import LoginPage from "./pages/jungeun/LoginPage";
import { ToastProvider } from "./context/jungeun/ToastContext";
import { useEffect } from 'react';
import useAuthStore from './store/jungeun/AuthStore';
import { setupInterceptors } from './api/auth/JungeunAuth';
import AppRoutes from './routes/AppRoutes';

function App() {
  return <div>App Loaded</div>;
}

export default App;
