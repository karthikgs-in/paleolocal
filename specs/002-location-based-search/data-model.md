# Data Model: Location-Based Site Discovery

**Feature**: 002-location-based-search  
**Date**: 2025-10-30  
**Phase**: 1 - Data Model Design

## Overview

This feature builds on **existing mock data** in `frontend/src/data/seedPlaces.ts`. No new data contracts needed - we'll add minimal new types for search functionality only.

## Existing Data Structure (Use As-Is)

### SeedPlace (Already Exists)
```typescript
interface SeedPlace {
  id: string;
  name: string;
  lat: number;           // Already using lat/lon format
  lon: number;
  known_type: string;
  seed_url: string;
  access_notes: string;
  notes: string;
}
```

**Usage**: No changes needed. Use existing `SEED_PLACES_DATA` array directly.

## New Types (Minimal Additions)

### SearchLocation (New - Simple)
```typescript
interface SearchLocation {
  lat: number;    // Match existing lat/lon naming
  lon: number;
  timestamp: Date;
}
```

### SearchRadius (New - Simple)
```typescript
type SearchRadiusKm = 25 | 50 | 100;
```

## Implementation Strategy

### Distance Calculation
- Use existing `lat`/`lon` properties from SeedPlace
- Simple Haversine formula function: `calculateDistance(lat1, lon1, lat2, lon2): number`
- Filter existing seed places array by distance

### State Management
- Current selected location: `SearchLocation | null`
- Current radius: `SearchRadiusKm` (default: 25)
- Filtered results: `SeedPlace[]` (subset of existing data)

### No Database Changes
- Use existing `SEED_PLACES_DATA` 
- No new data files needed
- No new parsing logic needed

## Integration Points

### With Existing Map System
- Use existing `SeedPlace` interface for markers
- Use existing site detail side panel (no changes)
- Add click handler to existing map
- Add radius selector UI component

This approach minimizes changes and builds directly on existing data infrastructure.