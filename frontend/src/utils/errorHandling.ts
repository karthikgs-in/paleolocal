import { ApiError } from '../types';

/**
 * Error severity levels
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Enhanced error information
 */
export interface EnhancedError extends ApiError {
  severity: ErrorSeverity;
  userMessage: string;
  timestamp: Date;
  context?: Record<string, any>;
}

/**
 * Error type classifications
 */
export enum ErrorType {
  NETWORK = 'NETWORK',
  API = 'API',
  VALIDATION = 'VALIDATION',
  PERMISSION = 'PERMISSION',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT = 'RATE_LIMIT',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Convert API error to user-friendly message
 * @param error - API error object
 * @returns User-friendly error message
 */
export function getErrorMessage(error: ApiError): string {
  // Handle specific error codes
  switch (error.code) {
    case 'NETWORK_ERROR':
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    case 'TIMEOUT':
      return 'The request took too long to complete. Please try again.';
    case '400':
      return 'Invalid request. Please check your search parameters and try again.';
    case '401':
      return 'Authentication required. Please log in and try again.';
    case '403':
      return 'You don\'t have permission to access this resource.';
    case '404':
      return 'The requested resource was not found.';
    case '429':
      return 'Too many requests. Please wait a moment and try again.';
    case '500':
      return 'Server error occurred. Please try again later.';
    case '503':
      return 'Service temporarily unavailable. Please try again later.';
    default:
      break;
  }
  
  // Handle specific error messages
  if (error.message) {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('connection')) {
      return 'Network connection error. Please check your internet connection.';
    }
    
    if (message.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }
    
    if (message.includes('not found')) {
      return 'The requested information could not be found.';
    }
    
    if (message.includes('coordinates') || message.includes('location')) {
      return 'Invalid location. Please check your coordinates and try again.';
    }
    
    if (message.includes('radius')) {
      return 'Invalid search radius. Please enter a value between 1 and 1000 kilometers.';
    }
  }
  
  // Fallback to generic message
  return error.message || 'An unexpected error occurred. Please try again.';
}

/**
 * Determine error severity based on error type and code
 * @param error - API error object
 * @returns Error severity level
 */
export function getErrorSeverity(error: ApiError): ErrorSeverity {
  const code = error.code;
  
  // Critical errors that prevent app functionality
  if (['500', '503', 'NETWORK_ERROR'].includes(code || '')) {
    return 'critical';
  }
  
  // High severity errors that significantly impact user experience
  if (['401', '403', '429'].includes(code || '')) {
    return 'high';
  }
  
  // Medium severity errors that partially impact functionality
  if (['400', '404', 'TIMEOUT'].includes(code || '')) {
    return 'medium';
  }
  
  // Low severity errors that have minimal impact
  return 'low';
}

/**
 * Classify error type based on error properties
 * @param error - API error object
 * @returns Error type classification
 */
export function classifyError(error: ApiError): ErrorType {
  const code = error.code;
  const message = error.message?.toLowerCase() || '';
  
  if (code === 'NETWORK_ERROR' || message.includes('network') || message.includes('connection')) {
    return ErrorType.NETWORK;
  }
  
  if (['400', '422'].includes(code || '') || message.includes('validation') || message.includes('invalid')) {
    return ErrorType.VALIDATION;
  }
  
  if (['401', '403'].includes(code || '') || message.includes('permission') || message.includes('unauthorized')) {
    return ErrorType.PERMISSION;
  }
  
  if (code === '404' || message.includes('not found')) {
    return ErrorType.NOT_FOUND;
  }
  
  if (code === '429' || message.includes('rate limit') || message.includes('too many')) {
    return ErrorType.RATE_LIMIT;
  }
  
  if (['500', '502', '503', '504'].includes(code || '')) {
    return ErrorType.API;
  }
  
  return ErrorType.UNKNOWN;
}

/**
 * Create enhanced error object with additional context
 * @param error - Original API error
 * @param context - Additional context information
 * @returns Enhanced error object
 */
export function enhanceError(error: ApiError, context?: Record<string, any>): EnhancedError {
  return {
    ...error,
    severity: getErrorSeverity(error),
    userMessage: getErrorMessage(error),
    timestamp: new Date(),
    context,
  };
}

/**
 * Check if error is retryable
 * @param error - Error to check
 * @returns Boolean indicating if retry is recommended
 */
export function isRetryableError(error: ApiError): boolean {
  const retryableCodes = ['NETWORK_ERROR', 'TIMEOUT', '500', '502', '503', '504', '429'];
  return retryableCodes.includes(error.code || '');
}

/**
 * Get suggested retry delay based on error type
 * @param error - Error object
 * @param attemptCount - Number of previous attempts
 * @returns Suggested delay in milliseconds
 */
export function getRetryDelay(error: ApiError, attemptCount: number): number {
  const baseDelay = 1000; // 1 second
  const maxDelay = 30000; // 30 seconds
  
  // Exponential backoff with jitter
  let delay = Math.min(baseDelay * Math.pow(2, attemptCount), maxDelay);
  
  // Add random jitter (±25%)
  const jitter = delay * 0.25 * (Math.random() * 2 - 1);
  delay = Math.round(delay + jitter);
  
  // Special cases
  if (error.code === '429') {
    // Rate limit errors should wait longer
    delay = Math.max(delay, 5000);
  }
  
  return Math.max(delay, 500); // Minimum 500ms delay
}

/**
 * Log error for debugging (development only)
 * @param error - Error to log
 * @param context - Additional context
 */
export function logError(error: ApiError | EnhancedError, context?: Record<string, any>): void {
  if (import.meta.env.VITE_DEV_MODE !== 'true') {
    return;
  }
  
  const errorInfo = {
    error,
    context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
  };
  
  console.group('🚨 Error Details');
  console.error('Error:', error);
  if (context) {
    console.log('Context:', context);
  }
  console.log('Full Error Info:', errorInfo);
  console.groupEnd();
}

/**
 * Create error from unknown source (useful for try-catch blocks)
 * @param error - Unknown error
 * @returns Standardized API error
 */
export function createErrorFromUnknown(error: unknown): ApiError {
  if (error && typeof error === 'object' && 'message' in error) {
    return {
      message: (error as Error).message,
      code: 'UNKNOWN',
      details: error instanceof Error ? error.stack : undefined,
    };
  }
  
  return {
    message: 'An unknown error occurred',
    code: 'UNKNOWN',
    details: String(error),
  };
}

/**
 * Error boundary helper for React components
 * @param error - Error that occurred
 * @param errorInfo - React error info
 * @returns User-friendly error state
 */
export function handleComponentError(error: Error, errorInfo?: { componentStack: string }) {
  const apiError: ApiError = {
    message: 'A component error occurred',
    code: 'COMPONENT_ERROR',
    details: `${error.message}\n${error.stack}\n${errorInfo?.componentStack}`,
  };
  
  logError(apiError, { componentStack: errorInfo?.componentStack });
  
  return enhanceError(apiError);
}