interface GeolocationResult {
  location: { latitude: number; longitude: number } | null;
  error: string | null;
  fallbackUsed: boolean;
}

export const geolocationHelper = {
  // Check if geolocation is supported
  isSupported(): boolean {
    return 'geolocation' in navigator;
  },

  // Get current position with enhanced error handling
  async getCurrentPosition(fallbackCoords?: { latitude: number; longitude: number }): Promise<GeolocationResult> {
    // Check if permission is already denied
    if (navigator.permissions) {
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        if (permissionStatus.state === 'denied') {
          return {
            location: fallbackCoords || null,
            error: 'Location permission is denied. Please update your browser settings to allow location access.',
            fallbackUsed: !!fallbackCoords
          };
        }
      } catch (err) {
        console.warn('Permission API not fully supported:', err);
      }
    }

    // If geolocation is not supported at all
    if (!this.isSupported()) {
      return {
        location: fallbackCoords || null,
        error: 'Geolocation is not supported by your browser',
        fallbackUsed: !!fallbackCoords
      };
    }

    // Try to get the position with a promise wrapper
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            location: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            },
            error: null,
            fallbackUsed: false
          });
        },
        (error) => {
          let errorMsg = 'Unknown error getting location';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMsg = 'Location permission denied. To enable location services, please update your browser settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMsg = 'Location information is unavailable. Please try again later.';
              break;
            case error.TIMEOUT:
              errorMsg = 'The request to get location timed out. Please try again.';
              break;
          }
          
          resolve({
            location: fallbackCoords || null,
            error: errorMsg,
            fallbackUsed: !!fallbackCoords
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  },

  // Handle permission management with a more user-friendly approach
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      return false;
    }
    
    try {
      if (navigator.permissions) {
        const permissionStatus = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        
        if (permissionStatus.state === 'granted') {
          return true;
        }
        
        if (permissionStatus.state === 'prompt') {
          // Trigger permission prompt
          const result = await this.getCurrentPosition();
          return result.error === null;
        }
        
        if (permissionStatus.state === 'denied') {
          return false;
        }
      } else {
        // Fallback for browsers that don't support Permissions API
        const result = await this.getCurrentPosition();
        return result.error === null;
      }
    } catch (err) {
      console.error('Error requesting permission:', err);
      return false;
    }
    
    return false;
  }
};