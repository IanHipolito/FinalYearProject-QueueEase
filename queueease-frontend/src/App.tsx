import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainPage from './pages/MainPage';
import SignupPage from './pages/Signup';
import LoginPage from './pages/Login';
import QRScanner from './pages/QRScanner';
import GuestSignup from './pages/GuestSignup';
import SuccessPage from './pages/SuccessPage';
import MapProximity from './pages/MapProximity';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/main" element={<MainPage />} />
        <Route path="/guest" element={<GuestSignup />} />
        <Route path="/qrscanner" element={<QRScanner />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/MapProximity" element={<MapProximity />} />
      </Routes>
    </Router>
  );
};

export default App;
