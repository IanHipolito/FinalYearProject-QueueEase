// import React from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import LoginPage from './pages/Login';
// import SignupPage from './pages/Signup';
// import MainPage from './pages/MainPage';

// const App: React.FC = () => {
//   // Check if the user is authenticated
//   const isAuthenticated = localStorage.getItem('authToken'); // Replace with proper auth logic

//   return (
//     <Router>
//       <Routes>
//         <Route path="/" element={<Navigate to="/login" />} />
//         <Route path="/login" element={<LoginPage />} />
//         <Route path="/signup" element={<SignupPage />} />
//         <Route
//           path="/main"
//           element={isAuthenticated ? <MainPage /> : <Navigate to="/login" />}
//         />
//       </Routes>
//     </Router>
//   );
// };

// export default App;

import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import MainPage from './pages/MainPage';

const App: React.FC = () => {
  // Wrap MainPage with Router for testing
  return (
    <Router>
      <MainPage />
    </Router>
  );
};

export default App;
