# Tasks: Interactive Map UI

**Input**: Design documents from `/specs/001-interactive-map-ui/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are OPTIONAL for this feature. Focus on functional implementation and manual testing through browser interactions.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/` (existing), `frontend/src/` (new)
- All frontend paths assume `frontend/src/` base directory

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic frontend structure

- [x] T001 Create frontend project structure per implementation plan
- [x] T002 Initialize React TypeScript project with Vite in frontend/ directory
- [x] T003 [P] Install core dependencies: React 18+, TypeScript, Leaflet 1.9+, react-leaflet, axios
- [x] T004 [P] Configure Vite build tool with proxy for backend API in frontend/vite.config.ts
- [x] T005 [P] Configure TypeScript with strict type checking in frontend/tsconfig.json
- [x] T006 [P] Set up environment variables for API endpoints in frontend/.env
- [x] T007 [P] Install and configure ESLint for code quality in frontend/.eslintrc.cjs

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T008 [P] Create TypeScript interfaces for PaleoSite, SearchRequest, MapView in src/types/index.ts
- [x] T009 [P] Implement API service layer with axios client in src/services/api.ts
- [x] T010 [P] Create utility functions for coordinates, distance calculation in src/utils/index.ts
- [x] T011 [P] Create basic React app structure with App.tsx and main.tsx
- [x] T012 [P] Create consolidated type exports in frontend/src/types/index.ts
- [x] T013 Create base API service with axios configuration in frontend/src/services/api.ts
- [x] T014 [P] Create coordinate validation utilities in frontend/src/utils/coordinates.ts
- [x] T015 [P] Create input validation utilities in frontend/src/utils/validation.ts
- [x] T016 [P] Create error handling utilities in frontend/src/utils/errorHandling.ts
- [x] T017 Create basic App component structure in frontend/src/App.tsx
- [x] T018 [P] Setup global CSS styles and Leaflet CSS imports in frontend/src/App.css
- [x] T019 [P] Create main HTML template in frontend/public/index.html

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Map-Based Site Discovery (Priority: P1) 🎯 MVP

**Goal**: Display interactive map with current location and clickable site markers that show details in side panel

**Independent Test**: User can load application, see map centered on location with site markers, click marker to view site details in side panel

### Implementation for User Story 1

- [x] T020 [P] [US1] Create geolocation service in frontend/src/services/geolocation.ts
- [x] T021 [P] [US1] Create useGeolocation custom hook in frontend/src/hooks/useGeolocation.ts
- [x] T022 [P] [US1] Create useSiteData custom hook for API integration in frontend/src/hooks/useSiteData.ts
- [x] T023 [P] [US1] Create useMapState custom hook for map state management in frontend/src/hooks/useMapState.ts
- [x] T024 [P] [US1] Create LoadingSpinner component in frontend/src/components/Common/LoadingSpinner.tsx
- [x] T025 [P] [US1] Create ErrorMessage component in frontend/src/components/Common/ErrorMessage.tsx
- [x] T026 [US1] Implement MapContainer component with Leaflet integration in frontend/src/components/Map/MapContainer.tsx
- [x] T027 [US1] Create SiteMarker component for clickable map markers in frontend/src/components/Map/SiteMarker.tsx
- [x] T028 [US1] Create SidePanel component for site details display in frontend/src/components/Map/SidePanel.tsx
- [x] T029 [US1] Create SiteInfo component for metadata display in frontend/src/components/Map/SiteInfo.tsx
- [x] T030 [US1] Create SourceAttribution component for AI content labeling in frontend/src/components/Map/SourceAttribution.tsx
- [x] T031 [US1] Integrate site search API call (/api/search) with map location
- [x] T032 [US1] Integrate site detail API call (/api/place/{id}) with marker clicks
- [x] T033 [US1] Implement location permission handling and global view fallback
- [x] T034 [US1] Add side panel open/close functionality

**Checkpoint**: At this point, User Story 1 should be fully functional - users can view map, see sites, and access details

---

## Phase 4: User Story 3 - Detailed Site Information Access (Priority: P1)

**Goal**: Enhance site details with comprehensive information display and clear AI content distinction

**Independent Test**: User can view complete site metadata, coordinates, type, and AI summaries with proper source attribution

### Implementation for User Story 3

- [ ] T035 [P] [US3] Enhance SiteInfo component to display comprehensive metadata in frontend/src/components/SiteDetail/SiteInfo.tsx
- [ ] T036 [P] [US3] Enhance SourceAttribution component with multiple source links in frontend/src/components/SiteDetail/SourceAttribution.tsx
- [ ] T037 [US3] Add coordinate display and formatting in SiteInfo component
- [ ] T038 [US3] Implement AI content labeling and source citation display
- [ ] T039 [US3] Add timestamp display for generated summaries
- [ ] T040 [US3] Handle missing or incomplete site detail data gracefully

**Checkpoint**: Site details now provide comprehensive research-grade information with proper attribution

---

## Phase 5: User Story 2 - Radius-Based Search Control (Priority: P2)

**Goal**: Add dropdown control for search radius adjustment with predefined options

**Independent Test**: User can select different radius values and see map markers update to match new search area

### Implementation for User Story 2

- [ ] T041 [P] [US2] Create RadiusDropdown component in frontend/src/components/Common/RadiusDropdown.tsx
- [ ] T042 [P] [US2] Create MapControls component to house radius dropdown in frontend/src/components/Map/MapControls.tsx
- [ ] T043 [US2] Integrate RadiusDropdown with MapContainer component
- [ ] T044 [US2] Implement radius change handling and API re-querying
- [ ] T045 [US2] Add empty state message for small radius with no results
- [ ] T046 [US2] Optimize performance for large radius searches with many markers

**Checkpoint**: Users can now control search scope with radius selection

---

## Phase 6: User Story 4 - Map Navigation and Exploration (Priority: P2)

**Goal**: Enable full map navigation with pan, zoom, and automatic site loading for new areas

**Independent Test**: User can navigate to different map regions and see relevant sites load automatically

### Implementation for User Story 4

- [ ] T047 [P] [US4] Enhance MapContainer with map movement event handlers in frontend/src/components/Map/MapContainer.tsx
- [ ] T048 [P] [US4] Create mapService for viewport-based site loading in frontend/src/services/mapService.ts
- [ ] T049 [US4] Implement debounced API calls on map pan/zoom events
- [ ] T050 [US4] Add map bounds tracking and viewport-based queries
- [ ] T051 [US4] Implement marker clustering for large site collections
- [ ] T052 [US4] Add "Reset to My Location" button functionality
- [ ] T053 [US4] Optimize marker rendering for smooth navigation experience

**Checkpoint**: Map navigation is fluid with automatic site discovery in new areas

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final optimization, error handling, and user experience improvements

- [ ] T054 [P] Add responsive design for mobile devices in CSS files
- [ ] T055 [P] Implement comprehensive error states for all API failures
- [ ] T056 [P] Add loading states for all async operations
- [ ] T057 [P] Optimize bundle size and implement code splitting
- [ ] T058 [P] Add accessibility features (ARIA labels, keyboard navigation)
- [ ] T059 [P] Implement caching strategy for API responses
- [ ] T060 [P] Add performance monitoring and optimization
- [ ] T061 [P] Create production build configuration
- [ ] T062 [P] Add deployment instructions to README

**Final Checkpoint**: Production-ready interactive map interface

---

## Dependencies & Execution Strategy

### User Story Dependencies
```
Foundation (Phase 2) 
    ↓
US1 (P1) → US3 (P1) → US2 (P2) → US4 (P2) → Polish
```

### Parallel Execution Opportunities

**Phase 2 (Foundation)**: Tasks T009-T012, T014-T016, T018-T019 can run in parallel

**Phase 3 (US1)**: Tasks T020-T025 can run in parallel, then T026-T030 depend on hooks/services

**Phase 4 (US3)**: Tasks T035-T036 can run in parallel

**Phase 5 (US2)**: Tasks T041-T042 can run in parallel

**Phase 6 (US4)**: Tasks T047-T048 can run in parallel

**Phase 7 (Polish)**: Most tasks T054-T062 can run in parallel

### MVP Scope (Recommended Initial Release)
- **Phase 1**: Setup ✓
- **Phase 2**: Foundation ✓  
- **Phase 3**: User Story 1 only ✓

This provides a functional map interface with site discovery and detail viewing - sufficient for initial user testing and feedback.

### Implementation Notes

1. **Backend Independence**: No backend changes required - all tasks consume existing APIs
2. **Technology Alignment**: All tasks use approved technologies (React, TypeScript, Leaflet, OpenStreetMap)
3. **Constitution Compliance**: API-first design, research-grade data integrity, graceful error handling
4. **Performance Targets**: Tasks designed to meet <200ms interactions and <3s detail loading
5. **Educational Focus**: Open-source technologies and clear attribution throughout

Total tasks: 62 organized across 7 phases for incremental delivery and testing.