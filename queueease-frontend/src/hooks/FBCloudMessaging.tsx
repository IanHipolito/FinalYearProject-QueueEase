import React, { useEffect } from 'react';
import { messaging, getToken, onMessage } from '../firebase/firebaseConfig';

const FBCloudMessaging: React.FC = () => {
    useEffect(() => {
        // Check if serviceWorker and Notification API are available
        if (!('serviceWorker' in navigator)) {
            console.log("Service Workers are not supported in this browser.");
            return;
        }
        if (!('Notification' in window)) {
            console.log("Notifications API not supported.");
            return;
        }

        // iOS requires the app to be installed as a PWA (via Add to Home Screen)
        const userAgent = window.navigator.userAgent;
        const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
        const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
        if (isIOS && isSafari) {
            console.log("For iOS Safari, please install this app as a PWA (Add to Home Screen) to receive push notifications.");
            return;
        }

        // Request notification permission
        Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
                getToken(messaging, { vapidKey: 'YOUR_PUBLIC_VAPID_KEY' })
                    .then((currentToken) => {
                        if (currentToken) {
                            console.log('FCM registration token:', currentToken);
                            // Here you can send the token to your backend to store with the user
                        } else {
                            console.log('No registration token available.');
                        }
                    })
                    .catch((err) => {
                        console.log('Error retrieving token: ', err);
                    });
            } else {
                console.log('Notification permission not granted.');
            }
        });

        // Listen for foreground messages
        onMessage(messaging, (payload) => {
            console.log('Message received in foreground: ', payload);
            // You may display a toast or custom UI notification here
        });
    }, []);

    return null;
};

export default FBCloudMessaging;