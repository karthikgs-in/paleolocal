import { Coordinates } from '../types';
import { isValidCoordinates } from './coordinates';

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate search radius value
 * @param radius - Radius value to validate
 * @returns Validation result
 */
export function validateRadius(radius: number): ValidationResult {
  const errors: string[] = [];
  
  if (typeof radius !== 'number' || isNaN(radius)) {
    errors.push('Radius must be a valid number');
  } else {
    if (radius <= 0) {
      errors.push('Radius must be greater than 0');
    }
    if (radius > 1000) {
      errors.push('Radius cannot exceed 1000 kilometers');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate coordinates input
 * @param coordinates - Coordinates to validate
 * @returns Validation result
 */
export function validateCoordinates(coordinates: Coordinates): ValidationResult {
  const errors: string[] = [];
  
  if (!coordinates) {
    errors.push('Coordinates are required');
    return { isValid: false, errors };
  }
  
  if (typeof coordinates.latitude !== 'number' || isNaN(coordinates.latitude)) {
    errors.push('Latitude must be a valid number');
  } else if (coordinates.latitude < -90 || coordinates.latitude > 90) {
    errors.push('Latitude must be between -90 and 90 degrees');
  }
  
  if (typeof coordinates.longitude !== 'number' || isNaN(coordinates.longitude)) {
    errors.push('Longitude must be a valid number');
  } else if (coordinates.longitude < -180 || coordinates.longitude > 180) {
    errors.push('Longitude must be between -180 and 180 degrees');
  }
  
  return {
    isValid: errors.length === 0 && isValidCoordinates(coordinates),
    errors,
  };
}

/**
 * Validate search query string
 * @param query - Search query to validate
 * @returns Validation result
 */
export function validateSearchQuery(query: string): ValidationResult {
  const errors: string[] = [];
  
  if (typeof query !== 'string') {
    errors.push('Search query must be a string');
    return { isValid: false, errors };
  }
  
  // Allow empty queries for location-based searches
  if (query.length === 0) {
    return { isValid: true, errors: [] };
  }
  
  if (query.length > 200) {
    errors.push('Search query cannot exceed 200 characters');
  }
  
  // Check for potentially harmful patterns
  const harmfulPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
  ];
  
  for (const pattern of harmfulPatterns) {
    if (pattern.test(query)) {
      errors.push('Search query contains invalid characters');
      break;
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate zoom level for map
 * @param zoom - Zoom level to validate
 * @returns Validation result
 */
export function validateZoomLevel(zoom: number): ValidationResult {
  const errors: string[] = [];
  
  if (typeof zoom !== 'number' || isNaN(zoom)) {
    errors.push('Zoom level must be a valid number');
  } else {
    if (zoom < 1) {
      errors.push('Zoom level must be at least 1');
    }
    if (zoom > 18) {
      errors.push('Zoom level cannot exceed 18');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate filter values
 * @param filters - Filter object to validate
 * @returns Validation result
 */
export function validateFilters(filters: Record<string, string>): ValidationResult {
  const errors: string[] = [];
  
  if (typeof filters !== 'object' || filters === null) {
    errors.push('Filters must be a valid object');
    return { isValid: false, errors };
  }
  
  // Validate each filter value
  for (const [key, value] of Object.entries(filters)) {
    if (typeof value !== 'string') {
      errors.push(`Filter '${key}' must be a string`);
      continue;
    }
    
    if (value.length > 100) {
      errors.push(`Filter '${key}' cannot exceed 100 characters`);
    }
    
    // Sanitize filter values
    if (/<|>|&|"|'/.test(value)) {
      errors.push(`Filter '${key}' contains invalid characters`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize string input to prevent XSS
 * @param input - String to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate and sanitize user input for search
 * @param input - User input to validate and sanitize
 * @returns Validated and sanitized input or null if invalid
 */
export function validateAndSanitizeInput(input: string): string | null {
  const validation = validateSearchQuery(input);
  
  if (!validation.isValid) {
    return null;
  }
  
  return sanitizeString(input.trim());
}

/**
 * Check if a number is within a valid range
 * @param value - Number to check
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Boolean indicating if value is in range
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return typeof value === 'number' && !isNaN(value) && value >= min && value <= max;
}