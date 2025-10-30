# Quick Start: Location-Based Site Discovery

**Feature**: 002-location-based-search  
**Date**: 2025-10-30  
**Phase**: 1 - Implementation Guide

## Overview

Simple implementation building on **existing mock data** in `seedPlaces.ts`. No new data files needed - just add map click functionality and distance filtering.

## Prerequisites

- ✅ Existing PaleoLocal frontend running with map functionality
- ✅ Existing `seedPlaces.ts` data (already available)
- ✅ Leaflet map already configured and displaying markers
- ✅ Side panel functionality working for site details

## Implementation Steps (Simplified)

### Step 1: Add Distance Calculation Utility (15 minutes)

**File: `frontend/src/utils/geoUtils.ts`** (New file)
```typescript
export function calculateDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
```

### Step 2: Create Location Search Hook (30 minutes)

**File: `frontend/src/hooks/useLocationSearch.ts`** (New file)
```typescript
import { useState, useCallback } from 'react';
import { SeedPlace } from '../types/map';
import { calculateDistance } from '../utils/geoUtils';

type SearchRadiusKm = 25 | 50 | 100;

interface SearchLocation {
  lat: number;
  lon: number;
}

export function useLocationSearch(allSites: SeedPlace[]) {
  const [searchLocation, setSearchLocation] = useState<SearchLocation | null>(null);
  const [searchRadius, setSearchRadius] = useState<SearchRadiusKm>(25);
  const [isSearching, setIsSearching] = useState(false);

  const handleMapClick = useCallback(async (lat: number, lon: number) => {
    const location = { lat, lon };
    setSearchLocation(location);
    setIsSearching(true);
    
    // Small delay for UX
    await new Promise(resolve => setTimeout(resolve, 200));
    setIsSearching(false);
  }, []);

  const filteredSites = searchLocation ? allSites.filter(site => {
    const distance = calculateDistance(
      searchLocation.lat, searchLocation.lon,
      site.lat, site.lon
    );
    return distance <= searchRadius;
  }) : allSites;

  const handleRadiusChange = useCallback((newRadius: SearchRadiusKm) => {
    setSearchRadius(newRadius);
  }, []);

  return {
    searchLocation,
    searchRadius,
    filteredSites,
    isSearching,
    handleMapClick,
    setRadius: handleRadiusChange,
    resultCount: filteredSites.length
  };
}
```

### Step 3: Create Radius Selector Component (20 minutes)

**File: `frontend/src/components/Map/RadiusSelector.tsx`** (New file)
```typescript
import React from 'react';

interface RadiusSelectorProps {
  selectedRadius: 25 | 50 | 100;
  onRadiusChange: (radius: 25 | 50 | 100) => void;
  disabled?: boolean;
}

export function RadiusSelector({ selectedRadius, onRadiusChange, disabled = false }: RadiusSelectorProps) {
  return (
    <div className="radius-selector">
      <label>Search Radius:</label>
      <div className="radius-options">
        {[25, 50, 100].map((radius) => (
          <button
            key={radius}
            className={`radius-option ${selectedRadius === radius ? 'active' : ''}`}
            onClick={() => onRadiusChange(radius as 25 | 50 | 100)}
            disabled={disabled}
          >
            {radius} km
          </button>
        ))}
      </div>
    </div>
  );
}
```

### Step 4: Add Circle Boundary Component (25 minutes)

**File: `frontend/src/components/Map/RadiusBoundary.tsx`** (New file)
```typescript
import { useEffect, useRef } from 'react';
import L from 'leaflet';

interface RadiusBoundaryProps {
  map: L.Map;
  center: { lat: number; lon: number };
  radiusKm: number;
}

export function RadiusBoundary({ map, center, radiusKm }: RadiusBoundaryProps) {
  const circleRef = useRef<L.Circle | null>(null);

  useEffect(() => {
    if (!map || !center) return;

    // Remove existing circle
    if (circleRef.current) {
      map.removeLayer(circleRef.current);
    }

    // Create new circle
    const circle = L.circle([center.lat, center.lon], {
      radius: radiusKm * 1000, // Convert km to meters
      color: '#3388ff',
      weight: 2,
      fillOpacity: 0
    });

    circle.addTo(map);
    circleRef.current = circle;

    return () => {
      if (circleRef.current) {
        map.removeLayer(circleRef.current);
      }
    };
  }, [map, center, radiusKm]);

  return null;
}
```

### Step 5: Update MapContainerSimple (30 minutes)

**File: `frontend/src/components/Map/MapContainerSimple.tsx`** (Enhance existing)
```typescript
// Add to existing imports
import { useLocationSearch } from '../../hooks/useLocationSearch';
import { RadiusSelector } from './RadiusSelector';
import { RadiusBoundary } from './RadiusBoundary';

// Inside MapContainerSimple component:
export function MapContainerSimple() {
  // ... existing code ...
  
  const {
    searchLocation,
    searchRadius,
    filteredSites,
    isSearching,
    handleMapClick,
    setRadius,
    resultCount
  } = useLocationSearch(sites); // Pass existing sites array

  // Add map click handler
  useEffect(() => {
    if (!map) return;

    const onMapClick = (e: L.LeafletMouseEvent) => {
      handleMapClick(e.latlng.lat, e.latlng.lng);
    };

    map.on('click', onMapClick);
    return () => map.off('click', onMapClick);
  }, [map, handleMapClick]);

  // Update displayed markers based on search
  useEffect(() => {
    if (!map) return;
    
    // Clear existing markers
    clearMarkers();
    
    // Add filtered site markers
    filteredSites.forEach(site => {
      addSiteMarker(site); // Use existing marker creation logic
    });
  }, [filteredSites, map]);

  return (
    <div className="map-container">
      <div className="map-controls">
        <RadiusSelector
          selectedRadius={searchRadius}
          onRadiusChange={setRadius}
          disabled={isSearching}
        />
        {isSearching && <div className="loading">Searching...</div>}
        <div className="result-count">{resultCount} sites found</div>
      </div>
      
      <div id="map" className="map" />
      
      {map && searchLocation && (
        <RadiusBoundary
          map={map}
          center={searchLocation}
          radiusKm={searchRadius}
        />
      )}
    </div>
  );
}
```

### Step 6: Add Basic Styling (15 minutes)

**File: `frontend/src/components/Map/RadiusSelector.css`** (New file)
```css
.radius-selector {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.radius-options {
  display: flex;
  gap: 0.5rem;
}

.radius-option {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
}

.radius-option.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.loading {
  color: #666;
  font-style: italic;
}

.result-count {
  color: #374151;
  font-weight: 500;
}
```

## Testing

1. **Click anywhere on map** → Should see search radius circle
2. **Change radius** → Circle and results should update
3. **Click different locations** → Previous circle clears, new one appears
4. **Click site markers** → Should open existing side panel

## Total Implementation Time

- **Experienced developer**: 2-3 hours
- **New to project**: 3-4 hours

This simplified approach builds directly on existing infrastructure with minimal new code!