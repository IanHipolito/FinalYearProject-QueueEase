import { initializeApp } from "firebase/app";
import { getMessaging, onMessage, getToken } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyB1IESZz4KRIbpPoPEVPQ3vpH1aWMFPYU8",
  authDomain: "queueease-5945e.firebaseapp.com",
  projectId: "queueease-5945e",
  storageBucket: "queueease-5945e.firebasestorage.app",
  messagingSenderId: "753263402313",
  appId: "1:753263402313:web:d45c75cb68b0cb7f28ce98",
  measurementId: "G-6EE0WK7BKD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const VAPID_KEY = process.env.REACT_APP_VAPID_KEY || '';

export { messaging, onMessage, getToken };