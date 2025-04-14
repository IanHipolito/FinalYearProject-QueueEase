export const TIMEZONE = 'Europe/Dublin';

//Removes any timezone designator from date strings to prevent UTC interpretation
export const stripTimezoneDesignator = (dateStr: string): string => {
  return dateStr;
};
// Format a time string (HH:MM) to 12-hour format

export const formatTimeString = (timeString: string): string => {
  if (!timeString) return '';
  
  try {
    // Remove any timezone info first
    const cleanTime = stripTimezoneDesignator(timeString);
    
    // Parse the time string
    const timeParts = cleanTime.split(':');
    if (timeParts.length < 2) return timeString;
    
    let hour = parseInt(timeParts[0], 10);
    const minute = parseInt(timeParts[1], 10);
    
    // Convert to 12-hour format
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12; // Convert 0 to 12
    
    return `${hour}:${minute.toString().padStart(2, '0')} ${ampm}`;
  } catch (e) {
    console.error('Error formatting time:', e);
    return timeString;
  }
};

// Gets the current date and time in Irish timezone
export const getCurrentIrishTime = (): Date => {
  return new Date();
};

// Formats a date in Irish format
export const formatIrishDate = (date: Date | string): string => {
  const parsedDate = typeof date === 'string' ? new Date(stripTimezoneDesignator(date)) : date;
  
  return parsedDate.toLocaleDateString('en-IE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

// Creates a Date object from a date string and time string without timezone complications
export const createDateFromStrings = (dateString: string, timeString: string): Date => {
  // Ensure we strip any timezone designators first
  const cleanDate = stripTimezoneDesignator(dateString);
  const cleanTime = stripTimezoneDesignator(timeString);
  
  return new Date(`${cleanDate}T${cleanTime}`);
};

//  Get hour difference between two dates
export const getHoursDifference = (date1: Date, date2: Date): number => {
  const timeDifference = date1.getTime() - date2.getTime();
  return timeDifference / (1000 * 60 * 60);
};

// Format a date to ISO format (YYYY-MM-DD)
export const formatToISODate = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Format time to ISO format (HH:MM)
export const formatToISOTime = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Calculates the remaining time until a given date/time and returns a readable string
export const getTimeUntil = (targetDatetime: string | Date): string => {
  const now = new Date();
  const target = typeof targetDatetime === 'string' 
    ? new Date(stripTimezoneDesignator(targetDatetime))
    : targetDatetime;
  
  // If the target time has passed, return "0 minutes"
  if (now >= target) {
    return "0 minutes";
  }
  
  // Calculate difference in milliseconds
  const diffMs = target.getTime() - now.getTime();
  
  // Convert to days, hours, minutes
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHrs = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMins = Math.round((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  // Format the output
  if (diffDays > 0) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''}, ${diffHrs} hour${diffHrs !== 1 ? 's' : ''}`;
  } else if (diffHrs > 0) {
    return `${diffHrs} hour${diffHrs !== 1 ? 's' : ''}, ${diffMins} minute${diffMins !== 1 ? 's' : ''}`;
  } else {
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''}`;
  }
};