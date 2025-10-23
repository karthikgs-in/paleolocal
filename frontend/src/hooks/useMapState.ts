import { useState, useCallback, useRef, useEffect } from 'react';
import { Coordinates, MapViewState } from '../types';
import { getDefaultMapCenter, getDefaultMapZoom } from '../utils';
import { isValidCoordinates } from '../utils/coordinates';

/**
 * Map state hook configuration
 */
interface UseMapStateOptions {
  initialCenter?: Coordinates;
  initialZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  onViewChange?: (center: Coordinates, zoom: number) => void;
}

/**
 * Map bounds interface
 */
interface MapBounds {
  northeast: Coordinates;
  southwest: Coordinates;
}

/**
 * Map state hook return type
 */
interface UseMapStateReturn {
  mapView: MapViewState;
  center: Coordinates;
  zoom: number;
  bounds: MapBounds | null;
  isMoving: boolean;
  setCenter: (coordinates: Coordinates) => void;
  setZoom: (zoom: number) => void;
  setView: (center: Coordinates, zoom: number) => void;
  setBounds: (bounds: MapBounds) => void;
  flyTo: (coordinates: Coordinates, zoom?: number, duration?: number) => void;
  panTo: (coordinates: Coordinates) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  fitBounds: (bounds: MapBounds, padding?: number) => void;
  reset: () => void;
  setIsMoving: (moving: boolean) => void;
}

/**
 * Default map state options
 */
const DEFAULT_OPTIONS: Required<Omit<UseMapStateOptions, 'onViewChange'>> = {
  initialCenter: getDefaultMapCenter(),
  initialZoom: getDefaultMapZoom(),
  minZoom: 1,
  maxZoom: 18,
};

/**
 * Custom hook for managing map state and view operations
 * @param options - Map state configuration options
 * @returns Map state and control functions
 */
export function useMapState(options: UseMapStateOptions = {}): UseMapStateReturn {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  const [mapView, setMapView] = useState<MapViewState>({
    center: config.initialCenter,
    zoom: config.initialZoom,
  });

  const [bounds, setBoundsState] = useState<MapBounds | null>(null);
  const [isMoving, setIsMovingState] = useState(false);
  
  const onViewChangeRef = useRef(options.onViewChange);
  const mapViewRef = useRef(mapView);

  // Update refs when options change
  useEffect(() => {
    onViewChangeRef.current = options.onViewChange;
  }, [options.onViewChange]);

  // Update mapView ref
  useEffect(() => {
    mapViewRef.current = mapView;
  }, [mapView]);

  // Validate and clamp zoom level
  const validateZoom = useCallback((zoom: number): number => {
    return Math.max(config.minZoom, Math.min(config.maxZoom, zoom));
  }, [config.minZoom, config.maxZoom]);

  // Update map view and trigger callback
  const updateMapView = useCallback((newCenter: Coordinates, newZoom: number) => {
    if (!isValidCoordinates(newCenter)) {
      console.warn('Invalid coordinates provided to map state:', newCenter);
      return;
    }

    const validatedZoom = validateZoom(newZoom);
    
    setMapView(prev => {
      const newView = {
        center: newCenter,
        zoom: validatedZoom,
        bounds: prev.bounds,
      };
      
      // Trigger callback if provided
      if (onViewChangeRef.current) {
        onViewChangeRef.current(newCenter, validatedZoom);
      }
      
      return newView;
    });
  }, [validateZoom]);

  // Set center coordinates
  const setCenter = useCallback((coordinates: Coordinates) => {
    updateMapView(coordinates, mapViewRef.current.zoom);
  }, [updateMapView]);

  // Set zoom level
  const setZoom = useCallback((zoom: number) => {
    updateMapView(mapViewRef.current.center, zoom);
  }, [updateMapView]);

  // Set both center and zoom
  const setView = useCallback((center: Coordinates, zoom: number) => {
    updateMapView(center, zoom);
  }, [updateMapView]);

  // Set map bounds
  const setBounds = useCallback((newBounds: MapBounds) => {
    setBoundsState(newBounds);
    setMapView(prev => ({
      ...prev,
      bounds: newBounds,
    }));
  }, []);

  // Animated fly to location
  const flyTo = useCallback((coordinates: Coordinates, zoom?: number, duration?: number) => {
    const targetZoom = zoom !== undefined ? zoom : mapViewRef.current.zoom;
    
    // For now, we'll just update the view directly
    // The actual animation would be handled by the Leaflet map component
    updateMapView(coordinates, targetZoom);
    
    // Store animation metadata for potential use by map component
    if (duration !== undefined) {
      // This could be used by the map component to animate the transition
      console.debug(`Flying to ${coordinates.latitude}, ${coordinates.longitude} over ${duration}ms`);
    }
  }, [updateMapView]);

  // Pan to location (smooth movement)
  const panTo = useCallback((coordinates: Coordinates) => {
    updateMapView(coordinates, mapViewRef.current.zoom);
  }, [updateMapView]);

  // Zoom in by one level
  const zoomIn = useCallback(() => {
    const newZoom = validateZoom(mapViewRef.current.zoom + 1);
    updateMapView(mapViewRef.current.center, newZoom);
  }, [updateMapView, validateZoom]);

  // Zoom out by one level
  const zoomOut = useCallback(() => {
    const newZoom = validateZoom(mapViewRef.current.zoom - 1);
    updateMapView(mapViewRef.current.center, newZoom);
  }, [updateMapView, validateZoom]);

  // Fit map to bounds
  const fitBounds = useCallback((bounds: MapBounds, _padding: number = 20) => {
    // Calculate center point from bounds
    const centerLat = (bounds.northeast.latitude + bounds.southwest.latitude) / 2;
    const centerLng = (bounds.northeast.longitude + bounds.southwest.longitude) / 2;
    const center = { latitude: centerLat, longitude: centerLng };
    
    // Calculate appropriate zoom level based on bounds
    // This is a simplified calculation - real implementation would be more sophisticated
    const latDiff = Math.abs(bounds.northeast.latitude - bounds.southwest.latitude);
    const lngDiff = Math.abs(bounds.northeast.longitude - bounds.southwest.longitude);
    const maxDiff = Math.max(latDiff, lngDiff);
    
    // Rough zoom calculation (this could be improved)
    let zoom = config.maxZoom;
    if (maxDiff > 0.1) zoom = 10;
    if (maxDiff > 1) zoom = 8;
    if (maxDiff > 10) zoom = 6;
    if (maxDiff > 50) zoom = 4;
    if (maxDiff > 100) zoom = 2;
    
    zoom = validateZoom(zoom);
    
    setBounds(bounds);
    updateMapView(center, zoom);
  }, [setBounds, updateMapView, validateZoom, config.maxZoom]);

  // Reset to initial state
  const reset = useCallback(() => {
    setBoundsState(null);
    setIsMovingState(false);
    updateMapView(config.initialCenter, config.initialZoom);
  }, [updateMapView, config.initialCenter, config.initialZoom]);

  // Set moving state
  const setIsMoving = useCallback((moving: boolean) => {
    setIsMovingState(moving);
  }, []);

  return {
    mapView,
    center: mapView.center,
    zoom: mapView.zoom,
    bounds,
    isMoving,
    setCenter,
    setZoom,
    setView,
    setBounds,
    flyTo,
    panTo,
    zoomIn,
    zoomOut,
    fitBounds,
    reset,
    setIsMoving,
  };
}