import React, { useEffect, useState } from 'react';
import { messaging, getToken, onMessage, VAPID_KEY } from '../firebase/firebaseConfig';
import { useAuth } from '../pages/AuthContext';
import { Snackbar, Alert } from '@mui/material';
import { API } from '../services/api';

const FBCloudMessaging: React.FC = () => {
    const { user } = useAuth();
    const [notification, setNotification] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'info' | 'warning' | 'error';
    }>({
        open: false,
        message: '',
        severity: 'info'
    });

    // Save token to backend
    const saveTokenToServer = async (token: string) => {
        if (!user?.id) return;
        
        try {
            const response = await API.auth.saveFcmToken(user.id, token);
            
            if (response.ok) {
                console.log('FCM token saved to server');
            } else {
                console.error('Failed to save FCM token to server');
            }
        } catch (error) {
            console.error('Error saving FCM token:', error);
        }
    };

    useEffect(() => {
        // Platform compatibility checks
        if (!('serviceWorker' in navigator)) {
            console.log("Service Workers are not supported in this browser.");
            return;
        }
        if (!('Notification' in window)) {
            console.log("Notifications API not supported.");
            return;
        }

        // Platform specific handling
        const userAgent = window.navigator.userAgent;
        const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
        const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        
        // Check if iOS PWA or standard browser
        if (isIOS && isSafari && !isStandalone) {
            console.log("For iOS Safari, please install this app as a PWA (Add to Home Screen) to receive push notifications.");
            setNotification({
                open: true,
                message: 'Install this app to your home screen for notifications to work properly.',
                severity: 'info'
            });
            return;
        }

        // Only request permission if user is logged in
        if (user?.id) {
            // Check current permission status
            if (Notification.permission === 'default') {
                // Request permission
                Notification.requestPermission().then((permission) => {
                    if (permission === 'granted') {
                        setupFCM();
                    }
                });
            } else if (Notification.permission === 'granted') {
                // Permission already granted
                setupFCM();
            }
        }
        
        // Cleanup
        return () => {
            // Any cleanup needed
        };
    }, [user]);

    const setupFCM = () => {
        getToken(messaging, { 
            vapidKey: VAPID_KEY 
        }).then((token) => {
            if (token) {
                console.log('FCM Token:', token);
                // Save token to localStorage for persistence
                localStorage.setItem('fcmToken', token);
                // Send to backend if user is logged in
                if (user?.id) {
                    saveTokenToServer(token);
                }
            } else {
                console.log('No token received');
            }
        }).catch((err) => {
            console.error('Error getting token:', err);
        });

        // Handle foreground messages
        const unsubscribe = onMessage(messaging, (payload) => {
            console.log('Message received in foreground:', payload);
            
            if (payload.notification) {
                // Show toast notification for foreground messages
                setNotification({
                    open: true,
                    message: payload.notification.body || 'New notification',
                    severity: 'info'
                });
                
                // Play notification sound if available
                if ((payload.notification as any).sound) {
                    const audio = new Audio((payload.notification as any).sound);
                    audio.play().catch(e => console.error('Could not play notification sound', e));
                }
            }
        });

        return unsubscribe;
    };

    const handleCloseNotification = () => {
        setNotification({...notification, open: false});
    };

    return (
        <Snackbar
            open={notification.open}
            autoHideDuration={6000}
            onClose={handleCloseNotification}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
            <Alert 
                onClose={handleCloseNotification} 
                severity={notification.severity}
                sx={{ width: '100%' }}
            >
                {notification.message}
            </Alert>
        </Snackbar>
    );
};

export default FBCloudMessaging;