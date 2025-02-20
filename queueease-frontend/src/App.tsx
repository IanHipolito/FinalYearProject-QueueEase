import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainPage from './pages/MainPage';
import SignupPage from './pages/Signup';
import LoginPage from './pages/Login';
import QRScanner from './pages/QRScanner';
import QRCodeScreenWrapper from './pages/QRCodeScreenWrapper';
import GuestSignup from './pages/GuestSignup';
import SuccessPage from './pages/SuccessPage';
import MapProximity from './pages/MapProximity';
import AppointmentsList from './pages/AppointmentsList';
import AppointmentDetail from './pages/AppointmentDetail';
import OrderIDInput from './pages/OrderIDInput';
import AddAppointment from './pages/AddAppointment';
import { AuthProvider, useAuth } from './pages/AuthContext';
import ServiceSelection from './pages/ServiceSelection';

// const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const { user } = useAuth();
//   return user ? <>{children}</> : <Navigate to="/login" />;
// };

// const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   // Temporarily bypass authentication for testing
//   // return <>{children}</>;
//   const { user } = useAuth();
//   console.log("User in PrivateRoute:", user);
//   return user ? <>{children}</> : <Navigate to="/login" />;
// };

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return user ? <>{children}</> : <Navigate to="/login" />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes: accessible without login */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/guest" element={<GuestSignup />} />

          {/* Protected routes: user must be logged in */}
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <Routes>
                  <Route path="/" element={<Navigate to="/main" />} />
                  <Route path="/main" element={<MainPage />} />
                  <Route path="/qrscanner" element={<QRScanner />} />
                  <Route path="/qrcodescreen/:queueId" element={<QRCodeScreenWrapper />} />
                  <Route path="/success" element={<SuccessPage />} />
                  <Route path="/MapProximity" element={<MapProximity />} />
                  <Route path="/appointments" element={<AppointmentsList />} />
                  <Route path="/appointment/:orderId" element={<AppointmentDetail />} />
                  <Route path="/input-order" element={<OrderIDInput />} />
                  <Route path="/add-appointment" element={<AddAppointment />} />
                  <Route path="/services" element={<ServiceSelection />} />
                </Routes>
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
