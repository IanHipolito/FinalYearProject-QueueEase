import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainPage from './pages/MainPage';
import UserMainPage from './pages/UserMainPage';
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
import AdminLayout from './components/AdminLayout';
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import QueuesPage from './pages/QueuesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import NotificationsPage from './pages/NotificationsPage';
import SettingsPage from './pages/SettingsPage';

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
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/guest" element={<GuestSignup />} />
          <Route path="/main" element={<MainPage />} />

          {/* Admin routes: Wrapped in AdminLayout */}
          <Route
            path="/admin/*"
            element={
              <PrivateRoute>
                <AdminLayout>
                  <Routes>
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="customers" element={<CustomersPage />} />
                    <Route path="queues" element={<QueuesPage />} />
                    <Route path="analytics" element={<AnalyticsPage />} />
                    <Route path="notifications" element={<NotificationsPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="*" element={<Navigate to="dashboard" replace />} />
                  </Routes>
                </AdminLayout>
              </PrivateRoute>
            }
          />

          {/* Regular authenticated user routes */}
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <Routes>
                  <Route path="/" element={<Navigate to="/main" replace />} />
                  <Route path="/usermainpage" element={<UserMainPage />} />
                  <Route path="/qrscanner" element={<QRScanner />} />
                  <Route path="/qrcodescreen/:queueId" element={<QRCodeScreenWrapper />} />
                  <Route path="/success/:queueId" element={<SuccessPage />} />
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
