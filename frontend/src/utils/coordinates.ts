import { Coordinates } from '../types';

/**
 * Calculate the distance between two coordinates using the Haversine formula
 * @param coord1 - First coordinate point
 * @param coord2 - Second coordinate point
 * @returns Distance in kilometers
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(coord2.latitude - coord1.latitude);
  const dLng = toRadians(coord2.longitude - coord1.longitude);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.latitude)) * Math.cos(toRadians(coord2.latitude)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Convert degrees to radians
 * @param degrees - Angle in degrees
 * @returns Angle in radians
 */
export function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 * @param radians - Angle in radians
 * @returns Angle in degrees
 */
export function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Validate coordinate values
 * @param coordinates - Coordinate object to validate
 * @returns Boolean indicating if coordinates are valid
 */
export function isValidCoordinates(coordinates: Coordinates): boolean {
  const { latitude, longitude } = coordinates;
  
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180 &&
    !isNaN(latitude) &&
    !isNaN(longitude)
  );
}

/**
 * Format coordinates for display
 * @param coordinates - Coordinate object
 * @param precision - Number of decimal places (default: 4)
 * @returns Formatted coordinate string
 */
export function formatCoordinates(coordinates: Coordinates, precision: number = 4): string {
  if (!isValidCoordinates(coordinates)) {
    return 'Invalid coordinates';
  }
  
  const { latitude, longitude } = coordinates;
  const latStr = latitude.toFixed(precision);
  const lngStr = longitude.toFixed(precision);
  const latDir = latitude >= 0 ? 'N' : 'S';
  const lngDir = longitude >= 0 ? 'E' : 'W';
  
  return `${Math.abs(parseFloat(latStr))}°${latDir}, ${Math.abs(parseFloat(lngStr))}°${lngDir}`;
}

/**
 * Calculate bounding box for a center point and radius
 * @param center - Center coordinates
 * @param radiusKm - Radius in kilometers
 * @returns Bounding box coordinates
 */
export function calculateBoundingBox(center: Coordinates, radiusKm: number): {
  northeast: Coordinates;
  southwest: Coordinates;
} {
  const earthRadius = 6371; // Earth's radius in kilometers
  const latRad = toRadians(center.latitude);
  const lngRad = toRadians(center.longitude);
  const radiusRad = radiusKm / earthRadius;

  const minLat = latRad - radiusRad;
  const maxLat = latRad + radiusRad;

  const deltaLng = Math.asin(Math.sin(radiusRad) / Math.cos(latRad));
  const minLng = lngRad - deltaLng;
  const maxLng = lngRad + deltaLng;

  return {
    southwest: {
      latitude: toDegrees(minLat),
      longitude: toDegrees(minLng),
    },
    northeast: {
      latitude: toDegrees(maxLat),
      longitude: toDegrees(maxLng),
    },
  };
}

/**
 * Check if coordinates are within a bounding box
 * @param coordinates - Coordinates to check
 * @param bounds - Bounding box
 * @returns Boolean indicating if coordinates are within bounds
 */
export function isWithinBounds(
  coordinates: Coordinates,
  bounds: { northeast: Coordinates; southwest: Coordinates }
): boolean {
  return (
    coordinates.latitude >= bounds.southwest.latitude &&
    coordinates.latitude <= bounds.northeast.latitude &&
    coordinates.longitude >= bounds.southwest.longitude &&
    coordinates.longitude <= bounds.northeast.longitude
  );
}

/**
 * Parse coordinate string (e.g., "40.7128° N, 74.0060° W") into Coordinates object
 * @param coordinateString - String representation of coordinates
 * @returns Parsed coordinates or null if invalid
 */
export function parseCoordinateString(coordinateString: string): Coordinates | null {
  const regex = /(\d+(?:\.\d+)?)\s*°?\s*([NS])\s*,?\s*(\d+(?:\.\d+)?)\s*°?\s*([EW])/i;
  const match = coordinateString.match(regex);
  
  if (!match) {
    return null;
  }
  
  const [, latStr, latDir, lngStr, lngDir] = match;
  const lat = parseFloat(latStr) * (latDir.toUpperCase() === 'S' ? -1 : 1);
  const lng = parseFloat(lngStr) * (lngDir.toUpperCase() === 'W' ? -1 : 1);
  
  const coordinates = { latitude: lat, longitude: lng };
  
  return isValidCoordinates(coordinates) ? coordinates : null;
}