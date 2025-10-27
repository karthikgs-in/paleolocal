# Debug and Development Configuration

This document explains how to configure debug and development features in the PaleoLocal frontend application.

## Configuration File

The debug configuration is managed in `/src/config/dev.ts`.

## Available Settings

### `SHOW_DEBUG_FEATURES`
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Master switch for all debug features. Must be `true` and application must be in development mode for any debug features to appear.

### `SHOW_MARKER_TEST`
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Shows the "Marker Test" page in the navigation. Useful for testing marker functionality in isolation.

### `SHOW_DEBUG_PANELS`
- **Type**: `boolean`
- **Default**: `true`
- **Description**: Shows debug information panels on the map (e.g., component state, marker count, etc.).

### `ENABLE_DEBUG_LOGGING`
- **Type**: `boolean`
- **Default**: `true`
- **Description**: Enables console logging for debugging map interactions, site clicks, etc.

### `USE_MOCK_DATA`
- **Type**: `boolean`
- **Default**: `true`
- **Description**: Uses hardcoded mock data instead of API calls for site information.

### `API_BASE_URL`
- **Type**: `string`
- **Default**: `http://localhost:8000`
- **Description**: Base URL for API calls. Can be overridden with `VITE_API_URL` environment variable.

## How to Enable Debug Features

1. **Open** `/src/config/dev.ts`
2. **Set** `SHOW_DEBUG_FEATURES: true`
3. **Set** any specific feature flags you want (e.g., `SHOW_MARKER_TEST: true`)
4. **Save** the file - Vite will automatically reload the application

## Examples

### Enable Marker Test Page
```typescript
export const DEV_CONFIG = {
  SHOW_DEBUG_FEATURES: true,  // Enable debug mode
  SHOW_MARKER_TEST: true,     // Show marker test page
  // ... other settings
} as const;
```

### Disable All Debug Output
```typescript
export const DEV_CONFIG = {
  SHOW_DEBUG_FEATURES: false,
  SHOW_DEBUG_PANELS: false,
  ENABLE_DEBUG_LOGGING: false,
  // ... other settings
} as const;
```

## Production Safety

- Debug features are **automatically disabled** in production builds
- The `shouldShowDebugFeatures()` function checks both the config flag AND development mode
- Even if `SHOW_DEBUG_FEATURES` is `true`, debug features won't appear in production

## Current Default State

By default, the application shows:
- ✅ Main Map page only
- ❌ No Marker Test page
- ❌ No debug panels (they're hidden)
- ❌ No debug console logging

This provides a clean, production-ready interface while keeping debug features easily accessible for development.