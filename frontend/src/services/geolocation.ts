import { Coordinates } from '../types';

/**
 * Geolocation service options
 */
export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

/**
 * Geolocation result
 */
export interface GeolocationResult {
  coordinates: Coordinates;
  accuracy: number;
  timestamp: number;
}

/**
 * Geolocation error types
 */
export enum GeolocationErrorType {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  POSITION_UNAVAILABLE = 'POSITION_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  NOT_SUPPORTED = 'NOT_SUPPORTED',
}

/**
 * Geolocation error
 */
export interface GeolocationError {
  type: GeolocationErrorType;
  message: string;
  code?: number;
}

/**
 * Default geolocation options
 */
const DEFAULT_OPTIONS: GeolocationOptions = {
  enableHighAccuracy: true,
  timeout: 10000, // 10 seconds
  maximumAge: 300000, // 5 minutes
};

/**
 * Check if geolocation is supported in the current browser
 * @returns Boolean indicating if geolocation is available
 */
export function isGeolocationSupported(): boolean {
  return 'geolocation' in navigator && typeof navigator.geolocation.getCurrentPosition === 'function';
}

/**
 * Get current position using browser geolocation API
 * @param options - Geolocation options
 * @returns Promise resolving to current coordinates
 */
export function getCurrentPosition(options: GeolocationOptions = {}): Promise<GeolocationResult> {
  return new Promise((resolve, reject) => {
    if (!isGeolocationSupported()) {
      reject({
        type: GeolocationErrorType.NOT_SUPPORTED,
        message: 'Geolocation is not supported by this browser',
      } as GeolocationError);
      return;
    }

    const config = { ...DEFAULT_OPTIONS, ...options };
    console.log('getCurrentPosition called with config:', config);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('Geolocation success:', position);
        const result: GeolocationResult = {
          coordinates: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };
        resolve(result);
      },
      (error) => {
        console.log('Geolocation error:', error);
        let errorType: GeolocationErrorType;
        let message: string;

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorType = GeolocationErrorType.PERMISSION_DENIED;
            message = 'User denied the request for geolocation';
            break;
          case error.POSITION_UNAVAILABLE:
            errorType = GeolocationErrorType.POSITION_UNAVAILABLE;
            message = 'Location information is unavailable';
            break;
          case error.TIMEOUT:
            errorType = GeolocationErrorType.TIMEOUT;
            message = 'The request to get user location timed out';
            break;
          default:
            errorType = GeolocationErrorType.POSITION_UNAVAILABLE;
            message = 'An unknown error occurred while retrieving location';
            break;
        }

        reject({
          type: errorType,
          message: error.message || message,
          code: error.code,
        } as GeolocationError);
      },
      config
    );
  });
}

/**
 * Watch position changes (for continuous location tracking)
 * @param callback - Function called when position changes
 * @param errorCallback - Function called when errors occur
 * @param options - Geolocation options
 * @returns Watch ID that can be used to clear the watch
 */
export function watchPosition(
  callback: (result: GeolocationResult) => void,
  errorCallback: (error: GeolocationError) => void,
  options: GeolocationOptions = {}
): number | null {
  if (!isGeolocationSupported()) {
    errorCallback({
      type: GeolocationErrorType.NOT_SUPPORTED,
      message: 'Geolocation is not supported by this browser',
    });
    return null;
  }

  const config = { ...DEFAULT_OPTIONS, ...options };

  return navigator.geolocation.watchPosition(
    (position) => {
      const result: GeolocationResult = {
        coordinates: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        },
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      };
      callback(result);
    },
    (error) => {
      let errorType: GeolocationErrorType;
      let message: string;

      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorType = GeolocationErrorType.PERMISSION_DENIED;
          message = 'User denied the request for geolocation';
          break;
        case error.POSITION_UNAVAILABLE:
          errorType = GeolocationErrorType.POSITION_UNAVAILABLE;
          message = 'Location information is unavailable';
          break;
        case error.TIMEOUT:
          errorType = GeolocationErrorType.TIMEOUT;
          message = 'The request to get user location timed out';
          break;
        default:
          errorType = GeolocationErrorType.POSITION_UNAVAILABLE;
          message = 'An unknown error occurred while retrieving location';
          break;
      }

      errorCallback({
        type: errorType,
        message: error.message || message,
        code: error.code,
      });
    },
    config
  );
}

/**
 * Clear position watch
 * @param watchId - Watch ID returned by watchPosition
 */
export function clearWatch(watchId: number): void {
  if (isGeolocationSupported()) {
    navigator.geolocation.clearWatch(watchId);
  }
}

/**
 * Get user-friendly error message for geolocation errors
 * @param error - Geolocation error
 * @returns User-friendly error message
 */
export function getGeolocationErrorMessage(error: GeolocationError): string {
  switch (error.type) {
    case GeolocationErrorType.PERMISSION_DENIED:
      return 'Location access was denied. Please enable location permissions to see sites near you.';
    case GeolocationErrorType.POSITION_UNAVAILABLE:
      return 'Your location could not be determined. Please try again or enter a location manually.';
    case GeolocationErrorType.TIMEOUT:
      return 'Location request timed out. Please try again.';
    case GeolocationErrorType.NOT_SUPPORTED:
      return 'Location services are not supported by your browser.';
    default:
      return 'Unable to get your location. Please try again or enter a location manually.';
  }
}