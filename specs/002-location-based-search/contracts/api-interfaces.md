# API Contracts: Location-Based Site Discovery

**Feature**: 002-location-based-search  
**Date**: 2025-10-30  
**Phase**: 1 - Contract Design

## Overview

**Simple approach**: Build on existing data with minimal new interfaces. Use existing `SeedPlace` interface and add only essential search functionality.

## Core Interface (New - Minimal)

### LocationSearch Hook Interface

```typescript
interface UseLocationSearchReturn {
  // State
  searchLocation: { lat: number; lon: number } | null;
  searchRadius: 25 | 50 | 100;
  filteredSites: SeedPlace[];  // Uses existing SeedPlace interface
  isSearching: boolean;

  // Actions  
  handleMapClick: (lat: number, lon: number) => void;
  setRadius: (radius: 25 | 50 | 100) => void;
  clearSearch: () => void;
}
```

### Distance Calculation (New - Simple)

```typescript
function calculateDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number;
// Returns distance in kilometers
```

### Component Props (New - Minimal)

```typescript
// Radius Selector Component
interface RadiusSelectorProps {
  selectedRadius: 25 | 50 | 100;
  onRadiusChange: (radius: 25 | 50 | 100) => void;
  disabled?: boolean;
}

// Radius Boundary Component  
interface RadiusBoundaryProps {
  map: L.Map;
  center: { lat: number; lon: number };
  radiusKm: number;
}
```

## Existing Interfaces (Use As-Is)

### SeedPlace (Already Exists - No Changes)
```typescript
interface SeedPlace {
  id: string;
  name: string;
  lat: number;           // Use existing naming
  lon: number; 
  known_type: string;
  seed_url: string;
  access_notes: string;
  notes: string;
}
```

### Map Integration (Existing - Enhance Only)
- Use existing marker creation logic
- Use existing side panel functionality
- Add click handler to existing map instance

## Implementation Strategy

1. **Import existing data**: `import { SEED_PLACES_DATA } from '../data/seedPlaces';`
2. **Parse existing data**: Use existing CSV parsing logic
3. **Filter by distance**: Simple array filter with distance calculation
4. **Display results**: Use existing marker display system

## No Backend Contracts Needed

This POC requires **zero new data contracts** - everything builds on existing infrastructure. Future backend integration will be a separate phase.

This simplified approach focuses on the core user interaction without overengineering the data layer.