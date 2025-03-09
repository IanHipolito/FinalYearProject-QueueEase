// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, onMessage, getToken } from 'firebase/messaging';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const analytics = getAnalytics(app);
const messaging = getMessaging(app);

export { messaging, onMessage, getToken };