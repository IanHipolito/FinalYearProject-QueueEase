import React from 'react';
import { useLocation } from 'react-router-dom';

const SuccessPage: React.FC = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const queueInfo = queryParams.get('queueInfo');

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Scan Successful!</h1>
      <p>Queue Information:</p>
      <p>{queueInfo}</p>
      <button onClick={() => (window.location.href = '/main')}>Back to Main</button>
    </div>
  );
};

export default SuccessPage;
