// filepath: /c:/Final Year Project- QueueEase/queueease-frontend/public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyB1IESZz4KRIbpPoPEVPQ3vpH1aWMFPYU8",
    authDomain: "queueease-5945e.firebaseapp.com",
    projectId: "queueease-5945e",
    storageBucket: "queueease-5945e.firebasestorage.app",
    messagingSenderId: "753263402313",
    appId: "1:753263402313:web:d45c75cb68b0cb7f28ce98",
    measurementId: "G-6EE0WK7BKD"
  };

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});