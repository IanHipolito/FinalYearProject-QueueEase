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
  
  const notificationTitle = payload.notification.title || 'QueueEase';
  const notificationOptions = {
    body: payload.notification.body || '',
    icon: '/logo192.png',
    badge: '/logo192.png',
    data: payload.data || {}
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  const rootUrl = self.location.origin;
  let urlToOpen = rootUrl;
  
  if (event.notification.data && event.notification.data.url) {
    urlToOpen = event.notification.data.url.startsWith('http') 
      ? event.notification.data.url 
      : rootUrl + event.notification.data.url;
  }
  
  if (event.notification.data && event.notification.data.type === 'queue_update') {
    const queueId = event.notification.data.queue_id;
    if (queueId) {
      urlToOpen = `${rootUrl}/success/${queueId}`;
    }
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});