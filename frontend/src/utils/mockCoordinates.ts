import { Coordinates } from '../types';

/**
 * Mock coordinates from seed_places.csv for testing
 * Using Grand Canyon as the mock user location (corrected positive latitude)
 */
export const MOCK_COORDINATES: Coordinates = {
  latitude: 36.1069,  // Corrected to positive (Northern Hemisphere)
  longitude: -112.1129
};

/**
 * Alternative mock locations from seed data for testing
 */
export const MOCK_LOCATIONS = {
  MORRISON_FORMATION: { latitude: 39.0, longitude: -105.5 },
  GRAND_CANYON: { latitude: 36.1069, longitude: -112.1129 },
  BURGESS_SHALE: { latitude: 51.4969, longitude: -116.2125 },
  SOLNHOFEN: { latitude: 48.8667, longitude: 11.3333 },
  WHITE_CLIFFS_DOVER: { latitude: 51.1279, longitude: 1.3216 },
  GRAND_STAIRCASE: { latitude: 37.5, longitude: -112.5 },
} as const;

/**
 * Get a random mock location for testing variety
 */
export function getRandomMockLocation(): Coordinates {
  const locations = Object.values(MOCK_LOCATIONS);
  return locations[Math.floor(Math.random() * locations.length)];
}