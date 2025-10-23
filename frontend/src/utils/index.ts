// Re-export from specialized utility modules
export * from './coordinates';
export * from './validation';
export * from './errorHandling';

// General utility functions
import { Coordinates } from '../types';

/**
 * Get default map center from environment variables
 * @returns Default center coordinates
 */
export function getDefaultMapCenter(): Coordinates {
  const lat = parseFloat(import.meta.env.VITE_DEFAULT_MAP_CENTER_LAT || '39.8283');
  const lng = parseFloat(import.meta.env.VITE_DEFAULT_MAP_CENTER_LNG || '-98.5795');
  
  return {
    latitude: isNaN(lat) ? 39.8283 : lat,
    longitude: isNaN(lng) ? -98.5795 : lng,
  };
}

/**
 * Get default map zoom level from environment variables
 * @returns Default zoom level
 */
export function getDefaultMapZoom(): number {
  const zoom = parseInt(import.meta.env.VITE_DEFAULT_MAP_ZOOM || '4');
  return isNaN(zoom) ? 4 : Math.max(1, Math.min(18, zoom));
}

/**
 * Get default search radius from environment variables
 * @returns Default search radius in kilometers
 */
export function getDefaultSearchRadius(): number {
  const radius = parseInt(import.meta.env.VITE_DEFAULT_SEARCH_RADIUS || '50');
  return isNaN(radius) ? 50 : Math.max(1, Math.min(1000, radius));
}

/**
 * Debounce function for search input
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = window.setTimeout(later, wait);
  };
}

/**
 * Format distance for display
 * @param distance - Distance in kilometers
 * @returns Formatted distance string
 */
export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`;
  } else if (distance < 10) {
    return `${distance.toFixed(1)} km`;
  } else {
    return `${Math.round(distance)} km`;
  }
}

/**
 * Generate a simple hash for caching purposes
 * @param str - String to hash
 * @returns Simple hash number
 */
export function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash;
}