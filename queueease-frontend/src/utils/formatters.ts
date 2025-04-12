import { TIMEZONE, formatTimeString, stripTimezoneDesignator } from './timezoneUtils';

export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  
  const date = new Date(stripTimezoneDesignator(dateString));
  return date.toLocaleDateString('en-IE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatTime = (timeString: string): string => {
  return formatTimeString(timeString);
};

export const formatQueueStatus = (status: string): string => {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const formatDateTime = (dateString: string, timeString: string): string => {
  if (!dateString || !timeString) return '';
  
  const date = new Date(stripTimezoneDesignator(`${dateString}T${timeString}`));
  
  return date.toLocaleString('en-IE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};