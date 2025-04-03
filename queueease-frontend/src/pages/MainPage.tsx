import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import Header from '../components/landing/Header';
import HeroSection from '../components/landing/HeroSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import HowItWorksSection from '../components/landing/HowItWorksSection';
import CallToAction from '../components/landing/CallToAction';
import Footer from '../components/landing/Footer';

const MainPage: React.FC = () => {
  const words = ['QUEUING', 'WAITING', 'LINES'];
  const [displayText, setDisplayText] = useState(words[0]);
  const [index, setIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);

  useEffect(() => {
    const wordInterval = setInterval(() => {
      setFadeIn(false);
      setTimeout(() => {
        setIndex((prevIndex) => (prevIndex + 1) % words.length);
        setDisplayText(words[(index + 1) % words.length]);
        setFadeIn(true);
      }, 500);
    }, 2500);
    
    return () => clearInterval(wordInterval);
  }, [index]);

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: '#f5f7fb',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Header />
      <HeroSection displayText={displayText} fadeIn={fadeIn} />
      <FeaturesSection />
      <HowItWorksSection />
      <CallToAction />
      <Footer />
    </Box>
  );
};

export default MainPage;