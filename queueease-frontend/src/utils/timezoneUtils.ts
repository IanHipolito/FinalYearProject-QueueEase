/**
 * Timezone utilities using native JavaScript
 * No external dependencies required
 */

// The Irish timezone
export const TIMEZONE = 'Europe/Dublin';

/**
 * Removes any 'Z' suffix from date strings to prevent UTC interpretation
 */
export const stripTimezoneDesignator = (dateTimeString: string | null | undefined): string => {
  if (!dateTimeString) return '';
  return dateTimeString.replace('Z', '');
};

/**
 * Format a time string (HH:MM) to 12-hour format
 */
export const formatTimeString = (timeString: string): string => {
  if (!timeString) return '';
  
  try {
    // Parse the time string
    const [hours, minutes] = timeString.split(':');
    let hour = parseInt(hours, 10);
    const minute = parseInt(minutes, 10);
    
    // Convert to 12-hour format
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12; // Convert 0 to 12
    
    return `${hour}:${minute.toString().padStart(2, '0')} ${ampm}`;
  } catch (e) {
    console.error('Error formatting time:', e);
    return timeString;
  }
};

/**
 * Gets the current date and time (intended to be used as local time)
 */
export const getCurrentIrishTime = (): Date => {
  return new Date();
};

/**
 * Formats a date in Irish format
 */
export const formatIrishDate = (date: Date | string): string => {
  const parsedDate = typeof date === 'string' ? new Date(stripTimezoneDesignator(date)) : date;
  
  return parsedDate.toLocaleDateString('en-IE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

/**
 * Creates a Date object from a date string and time string
 * without timezone complications
 */
export const createDateFromStrings = (dateString: string, timeString: string): Date => {
  return new Date(stripTimezoneDesignator(`${dateString}T${timeString}`));
};

/**
 * Get hour difference between two dates
 */
export const getHoursDifference = (date1: Date, date2: Date): number => {
  const timeDifference = date1.getTime() - date2.getTime();
  return timeDifference / (1000 * 60 * 60);
};

/**
 * Format a date string in the specified format
 */
export const formatDate = (dateString: string, formatOptions?: Intl.DateTimeFormatOptions): string => {
  const date = new Date(stripTimezoneDesignator(dateString));
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  return date.toLocaleDateString('en-IE', formatOptions || defaultOptions);
};

/**
 * Format a date to ISO format (YYYY-MM-DD)
 */
export const formatToISODate = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Format time to ISO format (HH:MM)
 */
export const formatToISOTime = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};