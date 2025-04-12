import { useNavigate } from 'react-router-dom';

export const handlePushNotification = (notification: any, navigate: any) => {
  // Extract the notification data
  const { data } = notification;
  
  if (!data || !data.type) {
    console.warn('Received notification without type:', notification);
    return;
  }
  
  // Handle different notification types
  switch (data.type) {
    case 'queue_update':
      // Handle queue updates
      console.log('Queue update notification:', data);
      if (data.url) {
        navigate(data.url);
      }
      break;
      
    case 'queue_almost_ready':
      // Handle almost ready notifications
      console.log('Queue almost ready notification:', data);
      if (data.url) {
        navigate(data.url);
      }
      break;
      
    case 'appointment_delay':
      // Handle appointment delay notifications
      console.log('Appointment delay notification:', data);
      if (data.url) {
        navigate(data.url);
      }
      break;
      
    case 'appointment_reminder':
      // Handle appointment reminder notifications
      console.log('Appointment reminder notification:', data);
      if (data.url) {
        navigate(data.url);
      }
      break;
      
    default:
      console.log('Unknown notification type:', data.type);
  }
};

export const useNotificationHandler = () => {
  const navigate = useNavigate();
  
  return (notification: any) => {
    handlePushNotification(notification, navigate);
  };
};