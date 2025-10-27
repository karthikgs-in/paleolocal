// Development and debug configuration
export const DEV_CONFIG = {
  // Show debug/test features in the UI
  SHOW_DEBUG_FEATURES: false, // Set to true during development to enable test pages
  
  // Show marker test page
  SHOW_MARKER_TEST: false,
  
  // Show debug panels on map
  SHOW_DEBUG_PANELS: true,
  
  // Enable console logging
  ENABLE_DEBUG_LOGGING: true,
  
  // Mock data settings
  USE_MOCK_DATA: true,
  
  // API settings
  API_BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
} as const;

// Helper function to check if we're in development mode
export const isDevelopment = () => import.meta.env.DEV;

// Helper function to check if debug features should be shown
export const shouldShowDebugFeatures = () => DEV_CONFIG.SHOW_DEBUG_FEATURES && isDevelopment();