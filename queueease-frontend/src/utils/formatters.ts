export const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  };
  
  export const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };
  
  export const formatQueueStatus = (status: string): string => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };