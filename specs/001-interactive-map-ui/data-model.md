# Data Model: Interactive Map UI

**Feature**: Interactive Map UI  
**Created**: 2025-10-23  
**Phase**: 1 - Data Model & Entity Design

## Frontend Data Entities

### Site Entity
Represents a paleontological site displayed on the map.

```typescript
interface Site {
  id: string;                    // Unique identifier from backend
  name: string;                  // Display name of the site
  lat: number;                   // Latitude coordinate (WGS84)
  lon: number;                   // Longitude coordinate (WGS84)
  known_type: string;            // Site classification/type
  short_summary?: string;        // Brief description (optional)
}
```

**Validation Rules**:
- `id`: Required, non-empty string
- `name`: Required, non-empty string, max 200 characters
- `lat`: Required, numeric, range -90 to 90
- `lon`: Required, numeric, range -180 to 180
- `known_type`: Required, non-empty string
- `short_summary`: Optional, max 500 characters

**Relationships**: 
- One-to-one with SiteDetail (loaded separately)
- Many-to-one with MapView (multiple sites per view)

### SiteDetail Entity
Comprehensive information about a specific site.

```typescript
interface SiteDetail {
  place: {
    id: string;                  // Matches Site.id
    name: string;                // Site name
    lat: number;                 // Latitude
    lon: number;                 // Longitude
    known_type: string;          // Site classification
    seed_url?: string;           // Original data source URL
    [key: string]: any;          // Additional metadata
  };
  generated?: {
    summary?: string;            // AI-generated summary
    sources?: string[];          // Source URLs for summary
    ts?: number;                 // Timestamp of generation
  };
}
```

**Validation Rules**:
- `place`: Required, must match Site interface validation
- `generated.summary`: Optional, max 5000 characters
- `generated.sources`: Optional array, each URL max 500 characters
- `generated.ts`: Optional, valid Unix timestamp

**State Transitions**:
- `Loading`: Detail request initiated
- `Loaded`: Detail data received and validated
- `Error`: Request failed or data invalid
- `Cached`: Previously loaded, available for display

### MapView Entity
Current map display state and viewport.

```typescript
interface MapView {
  center: {
    lat: number;                 // Map center latitude
    lon: number;                 // Map center longitude
  };
  zoom: number;                  // Current zoom level
  radius: number;                // Search radius in kilometers
  bounds?: {                     // Current viewport bounds
    north: number;
    south: number;
    east: number;
    west: number;
  };
}
```

**Validation Rules**:
- `center.lat`: Required, range -90 to 90
- `center.lon`: Required, range -180 to 180
- `zoom`: Required, range 1 to 20
- `radius`: Required, one of [5, 10, 25, 50, 100]
- `bounds`: Optional, valid geographic bounds

**Relationships**:
- Contains multiple Site entities within viewport
- Drives SearchParameters for API queries

### SearchParameters Entity
Parameters for site search API calls.

```typescript
interface SearchParameters {
  lat: number;                   // Search center latitude
  lon: number;                   // Search center longitude
  radius_km: number;             // Search radius
}
```

**Validation Rules**:
- `lat`: Required, range -90 to 90
- `lon`: Required, range -180 to 180
- `radius_km`: Required, one of [5, 10, 25, 50, 100]

**Relationships**:
- Derived from MapView state
- Input to API search calls
- Produces array of Site entities

### UIState Entity
Application user interface state.

```typescript
interface UIState {
  selectedSiteId?: string;       // Currently selected site
  sidePanelOpen: boolean;        // Side panel visibility
  loading: {
    sites: boolean;              // Site search in progress
    details: boolean;            // Detail loading in progress
    location: boolean;           // Geolocation request active
  };
  error?: {
    type: 'network' | 'geolocation' | 'api' | 'validation';
    message: string;             // User-friendly error message
    retryable: boolean;          // Whether retry option available
    timestamp: number;           // When error occurred
  };
  geolocation: {
    available: boolean;          // Browser geolocation support
    permitted: boolean;          // User permission granted
    position?: {
      lat: number;
      lon: number;
      accuracy: number;          // Position accuracy in meters
    };
  };
}
```

**Validation Rules**:
- `selectedSiteId`: Optional, must match existing Site.id
- `loading` fields: Required booleans
- `error.message`: Required if error exists, max 200 characters
- `geolocation.position`: Valid coordinates if present

**State Transitions**:
- Loading states: `false` → `true` → `false`
- Error states: `undefined` → `error object` → `undefined` (on retry/dismiss)
- Geolocation: `unknown` → `checking` → `granted/denied`

## API Integration Models

### SearchResponse Entity
Response from `/api/search` endpoint.

```typescript
interface SearchResponse {
  sites: Site[];                 // Array of sites in radius
  total: number;                 // Total sites found
  search: SearchParameters;      // Echo of search parameters
}
```

### DetailResponse Entity
Response from `/api/place/{place_id}` endpoint.

```typescript
interface DetailResponse extends SiteDetail {
  // Inherits SiteDetail structure
  // Additional validation for API response format
}
```

## Data Flow Patterns

### Site Discovery Flow
1. User location → SearchParameters
2. SearchParameters → API search call
3. SearchResponse → Site entities
4. Site entities → Map markers
5. Map marker click → Site selection
6. Site selection → Detail API call
7. DetailResponse → SiteDetail entity
8. SiteDetail → Side panel display

### Error Handling Flow
1. API failure → Error entity creation
2. Error entity → UIState.error
3. UIState.error → Error component display
4. User retry → Clear error, restart flow

### Caching Strategy
- **Site data**: Cache per MapView bounds for 5 minutes
- **Site details**: Cache per site ID for 30 minutes  
- **Geolocation**: Cache position for 10 minutes
- **Error states**: No caching, immediate display

## Validation & Constraints

### Geographic Constraints
- All coordinates must use WGS84 datum
- Latitude/longitude precision: 6 decimal places maximum
- Search radius limited to predefined options for performance
- Bounds checking prevents invalid geographic queries

### Performance Constraints
- Maximum 100 sites displayed simultaneously
- Detail loading timeout: 10 seconds
- Search request debouncing: 300ms
- Marker clustering activated above 50 sites

### Data Integrity
- Site ID consistency between search and detail responses
- Timestamp validation for cached data expiration
- URL validation for source links and seed URLs
- Character limits prevent UI overflow and XSS risks

## Type Definitions Export

All entities will be exported from `src/types/` directory:
- `src/types/site.ts` - Site and SiteDetail interfaces
- `src/types/map.ts` - MapView and SearchParameters interfaces  
- `src/types/ui.ts` - UIState and error handling interfaces
- `src/types/api.ts` - API request/response interfaces
- `src/types/index.ts` - Consolidated exports

This ensures type safety across components and consistent data handling throughout the application.