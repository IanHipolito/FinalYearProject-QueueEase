import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/MainPage.styles';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MapIcon from '@mui/icons-material/Map';

const MainPage: React.FC = () => {
  const navigate = useNavigate();

  const words = ['QUEUING', 'MADE', 'EASIER'];
  const [displayText, setDisplayText] = useState(words[0]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % words.length);
    }, 700);
    setDisplayText(words[index]);
    return () => clearInterval(interval);
  }, [index]);

  return (
    <div style={styles.container as React.CSSProperties}>
      <header style={styles.header as React.CSSProperties}>
        <div>
          <h1 style={styles.titleText as React.CSSProperties}>QueueEase</h1>
          {/* <IconButton aria-label="menu">
            <MenuIcon style={{ color: '#fff' }} />
          </IconButton> */}
        </div>
      </header>

      <div style={styles.banner as React.CSSProperties}>
        <h2>{displayText}</h2>
      </div>

      <div style={styles.buttonContainer as React.CSSProperties}>
        <div
          style={styles.iconButtonWrapper as React.CSSProperties}
          onClick={() => navigate('/QRScanner')}
        >
          <QrCodeScannerIcon fontSize="large" />
          <p style={styles.buttonLabel as React.CSSProperties}>Scan QR</p>
        </div>
        <div
          style={styles.iconButtonWrapper as React.CSSProperties}
          onClick={() => navigate('/Appointment')}
        >
          <CalendarTodayIcon fontSize="large" />
          <p style={styles.buttonLabel as React.CSSProperties}>
            Appointment Details
          </p>
        </div>
        <div
          style={styles.iconButtonWrapper as React.CSSProperties}
          onClick={() => navigate('/MapProximity')}
        >
          <MapIcon fontSize="large" />
          <p style={styles.buttonLabel as React.CSSProperties}>
            Map Proximity
          </p>
        </div>
      </div>
    </div>
  );
};

export default MainPage;
