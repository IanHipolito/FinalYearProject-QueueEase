import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainPage from './pages/MainPage';
import UserMainPage from './pages/UserMainPage';
import SignupPage from './pages/Signup';
import LoginPage from './pages/Login';
import QRScanner from './pages/QRScanner';
import QRCodeScreenWrapper from './pages/QRCodeScreenWrapper';
import SuccessPage from './pages/SuccessPage';
import MapProximity from './pages/MapProximity';
import AppointmentsList from './pages/AppointmentsList';
import AppointmentDetail from './pages/AppointmentDetail';
import ServiceSelection from './pages/ServiceSelection';
import AdminLayout from './components/Layout/AdminLayout';
import FBCloudMessaging from './hooks/FBCloudMessaging';
import BookAppointment from './pages/BookAppointment';
import QueueHistory from 'pages/QueueHistory';
import AdminLogin from './pages/AdminLogin';
import AdminSignup from './pages/AdminSignup';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/Layout/PrivateRoute';
import IOSInstallGuide from './components/common/IOSInstallGuide';
import FeedbackPage from './pages/FeedbackPage';
import UserAnalyticsPage from './pages/UserAnalyticsPage';

const App: React.FC = () => {
  return (
    <AuthProvider>
      {/* Include FCM component so notifications are initialised */}
      <FBCloudMessaging />
      <IOSInstallGuide />
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/main" element={<MainPage />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin-signup" element={<AdminSignup />} />
          <Route path="/" element={<Navigate to="/main" />} />

          {/* Protected routes */}
          <Route path="/usermainpage" element={
            <PrivateRoute>
              <UserMainPage />
            </PrivateRoute>
          } />
          <Route path="/qrscanner" element={
            <PrivateRoute>
              <QRScanner />
            </PrivateRoute>
          } />
          <Route path="/analytics" element={
            <PrivateRoute>
              <UserAnalyticsPage />
            </PrivateRoute>
          } />
          <Route path="/success/:queueId" element={<SuccessPage />} />
          <Route path="/mapproximity" element={<MapProximity />} />
          <Route path="/history" element={<QueueHistory />} />
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route path="/appointments" element={
            <PrivateRoute>
              <AppointmentsList />
            </PrivateRoute>
          } />
          <Route path="/appointment/:orderId" element={
            <PrivateRoute>
              <AppointmentDetail />
            </PrivateRoute>
          } />
          <Route path="/services" element={<ServiceSelection />} />
          <Route path="/book-appointment/:serviceId" element={
            <PrivateRoute>
              <BookAppointment />
            </PrivateRoute>
          } />
          <Route path="/qrcodescreen/:queueId" element={<QRCodeScreenWrapper />} />

          {/* Admin routes */}
          <Route path="/admin/*" element={
            <PrivateRoute adminOnly>
              <AdminLayout />
            </PrivateRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;