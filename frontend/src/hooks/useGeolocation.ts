import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getCurrentPosition,
  watchPosition,
  clearWatch,
  isGeolocationSupported,
  getGeolocationErrorMessage,
  GeolocationOptions,
  GeolocationResult,
  GeolocationError,
} from '../services/geolocation';
import { Coordinates } from '../types';

/**
 * Geolocation hook state
 */
interface GeolocationState {
  coordinates: Coordinates | null;
  accuracy: number | null;
  isLoading: boolean;
  error: string | null;
  isSupported: boolean;
  lastUpdated: number | null;
}

/**
 * Geolocation hook options
 */
interface UseGeolocationOptions extends GeolocationOptions {
  watch?: boolean;
  immediate?: boolean;
}

/**
 * Geolocation hook return type
 */
interface UseGeolocationReturn extends GeolocationState {
  getCurrentLocation: () => Promise<void>;
  clearError: () => void;
  refresh: () => Promise<void>;
}

/**
 * Custom hook for geolocation functionality
 * @param options - Geolocation options
 * @returns Geolocation state and control functions
 */
export function useGeolocation(options: UseGeolocationOptions = {}): UseGeolocationReturn {
  const {
    watch = false,
    immediate = true,
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 300000,
  } = options;

  const [state, setState] = useState<GeolocationState>({
    coordinates: null,
    accuracy: null,
    isLoading: false,
    error: null,
    isSupported: isGeolocationSupported(),
    lastUpdated: null,
  });

  const watchIdRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  // Handle successful position update
  const handleSuccess = useCallback((result: GeolocationResult) => {
    if (!isMountedRef.current) return;

    setState(prev => ({
      ...prev,
      coordinates: result.coordinates,
      accuracy: result.accuracy,
      isLoading: false,
      error: null,
      lastUpdated: result.timestamp,
    }));
  }, []);

  // Handle geolocation error
  const handleError = useCallback((error: GeolocationError) => {
    if (!isMountedRef.current) return;

    setState(prev => ({
      ...prev,
      isLoading: false,
      error: getGeolocationErrorMessage(error),
    }));
  }, []);

  // Get current location
  const getCurrentLocation = useCallback(async (): Promise<void> => {
    const isSupported = isGeolocationSupported();
    console.log('getCurrentLocation called, isSupported:', isSupported);
    
    if (!isSupported) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by this browser',
      }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    console.log('Starting geolocation request...');

    try {
      const result = await getCurrentPosition({
        enableHighAccuracy,
        timeout,
        maximumAge,
      });
      console.log('Geolocation success:', result);
      handleSuccess(result);
    } catch (error) {
      console.log('Geolocation error:', error);
      handleError(error as GeolocationError);
    }
  }, [enableHighAccuracy, timeout, maximumAge, handleSuccess, handleError]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Refresh location (alias for getCurrentLocation)
  const refresh = useCallback(() => getCurrentLocation(), [getCurrentLocation]);

  // Start watching position
  const startWatching = useCallback(() => {
    if (!state.isSupported || watchIdRef.current !== null) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    watchIdRef.current = watchPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
      }
    );
  }, [state.isSupported, handleSuccess, handleError, enableHighAccuracy, timeout, maximumAge]);

  // Stop watching position
  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setState(prev => ({ ...prev, isLoading: false }));
  }, []);

  // Effect for immediate location request
  useEffect(() => {
    if (immediate && state.isSupported && !state.isLoading && !state.coordinates) {
      console.log('Triggering immediate location request');
      getCurrentLocation();
    }
  }, [immediate, state.isSupported, state.isLoading, state.coordinates, getCurrentLocation]);

  // Effect for watching position
  useEffect(() => {
    if (watch && state.isSupported) {
      startWatching();
    } else {
      stopWatching();
    }

    return () => {
      stopWatching();
    };
  }, [watch, state.isSupported, startWatching, stopWatching]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      stopWatching();
    };
  }, [stopWatching]);

  return {
    ...state,
    getCurrentLocation,
    clearError,
    refresh,
  };
}