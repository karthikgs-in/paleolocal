# Research: Location-Based Site Discovery

**Feature**: 002-location-based-search  
**Date**: 2025-10-30  
**Phase**: 0 - Research & Decision Making

## Research Tasks Completed

### Decision 1: Map Click Event Handling Pattern

**Decision**: Use Leaflet's native `map.on('click')` event with coordinate extraction

**Rationale**: 
- Leverages existing Leaflet infrastructure already in the project
- Provides precise lat/lng coordinates from click events  
- Integrates cleanly with current MapContainerSimple.tsx architecture
- Standard pattern in geographic applications

**Alternatives considered**:
- Custom overlay div with mouse event handling (more complex, less precise)
- React event handlers on map container (doesn't provide geographic coordinates)
- Third-party click management libraries (unnecessary dependency)

**Implementation notes**: 
- Event handler attached in useEffect within MapContainerSimple component
- Coordinates extracted using `event.latlng.lat` and `event.latlng.lng`
- Click position marked with temporary marker for visual feedback

### Decision 2: Distance Calculation Algorithm

**Decision**: Haversine formula for great-circle distance calculation

**Rationale**:
- Industry standard for geographic distance calculation
- Accounts for Earth's curvature (more accurate than Euclidean distance)
- Lightweight computation suitable for frontend mock data processing
- Widely available implementations and well-tested

**Alternatives considered**:
- Euclidean distance (insufficient accuracy for geographic data)
- Vincenty's formula (more accurate but computationally expensive for POC)
- External geocoding services (unnecessary for mock data phase)

**Implementation notes**:
- Function signature: `calculateDistance(lat1, lng1, lat2, lng2): number` (returns km)
- Used to filter mock sites within specified radius
- Precision adequate for proof-of-concept requirements

### Decision 3: Mock Data Structure and Distribution

**Decision**: Realistic coordinate spread around major geological regions with scientific site names

**Rationale**:
- Maintains research-grade data integrity principle from constitution
- Provides meaningful testing scenarios across different regions
- Enables validation of distance calculations with known geographic relationships
- Supports future backend integration with realistic data patterns

**Alternatives considered**:
- Random coordinate generation (less realistic, harder to validate)
- Single-region focus (insufficient for testing radius variations)
- Real paleontological database subset (complex licensing and accuracy verification)

**Implementation notes**:
- ~50-100 mock sites distributed across North America
- Site data includes: id, name, latitude, longitude, type, description
- Grand Canyon region populated with 8-12 nearby sites for default demonstration
- Sites positioned to test edge cases (ocean boundaries, country borders)

### Decision 4: Radius Boundary Visual Implementation

**Decision**: Leaflet Circle overlay with solid stroke, no fill

**Rationale**:
- Integrates with existing Leaflet map infrastructure
- Circle object automatically handles projection and zoom scaling
- Solid stroke provides clear visual feedback without obscuring map details
- Standard geographic visualization pattern

**Alternatives considered**:
- CSS-based circle overlay (doesn't scale with map zoom)
- SVG overlay (more complex coordinate transformation)
- Polygon approximation (less precise, more computational overhead)

**Implementation notes**:
- Use `L.circle([lat, lng], {radius: radiusInMeters})` 
- Style: `{color: '#3388ff', fillOpacity: 0, weight: 2}`
- Circle updates automatically when radius or location changes
- Removed when new search initiated

### Decision 5: State Management Strategy

**Decision**: Custom React hook (`useLocationSearch`) with local state

**Rationale**:
- Encapsulates all location search logic in reusable hook
- Maintains separation of concerns from map rendering logic
- Provides clean interface for components to consume search state
- Avoids complexity of global state management for feature-specific data

**Alternatives considered**:
- Global state management (Redux/Zustand) - overly complex for isolated feature
- Component state only - would require prop drilling and logic duplication
- Context API - unnecessary overhead for non-shared state

**Implementation notes**:
- Hook manages: selectedLocation, searchRadius, filteredSites, isSearching
- Exposes: `handleMapClick`, `setSearchRadius`, `searchResults`, `isLoading`
- Integrates with mock data service for site filtering
- Coordinates with map state hook for marker management

## Technical Specifications

### Performance Targets Validation
- Distance calculations for 100 sites: <50ms (well within 3-second target)
- UI updates for radius changes: Immediate (meets <2-second requirement)
- Mock data loading: Instantaneous (meets <30-second total completion)

### Integration Points Identified
- Map click event integration with existing MapContainerSimple
- Radius selector integration with existing UI component patterns  
- Side panel integration maintains existing site detail functionality
- Mock data service designed for easy backend service substitution

### Risk Mitigation
- **Risk**: Mock data may not reflect real-world site density
  **Mitigation**: Use varied density regions and edge cases in mock data set
- **Risk**: Distance calculations may not match backend precision
  **Mitigation**: Use standard Haversine formula, document precision assumptions
- **Risk**: UI performance with large result sets
  **Mitigation**: Plan identified shows all results (as per clarification), optimize rendering if needed

## Ready for Phase 1

All research tasks completed. No unresolved technical dependencies. Ready to proceed with data model design and implementation planning.