# Implementation Plan: Interactive Map UI

**Branch**: `001-interactive-map-ui` | **Date**: 2025-10-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-interactive-map-ui/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build an interactive web-based map interface that allows researchers to discover paleontological sites through geographic exploration. The system integrates with existing PaleoLocal APIs (`/api/search` and `/api/place/{place_id}`) to provide location-based site discovery with detailed information panels. Core features include current location detection, radius-based search controls, and comprehensive site detail display via side panels. The implementation uses OpenStreetMap with Leaflet for open-source mapping capabilities suited for educational/research purposes.

## Technical Context

**Language/Version**: JavaScript/TypeScript with Node.js 18+, Python 3.11+ (backend already exists)  
**Primary Dependencies**: React 18+, Vite 4+, Leaflet 1.9+, OpenStreetMap tiles, Axios for API calls  
**Storage**: N/A (frontend consumes existing APIs)  
**Testing**: Jest + React Testing Library for frontend, existing pytest for backend APIs  
**Target Platform**: Modern web browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
**Project Type**: Web application (frontend + existing backend)  
**Performance Goals**: <200ms map interactions, <3s site detail loading, responsive to 100 concurrent markers  
**Constraints**: Educational use (open-source preferred), offline-capable map tiles, mobile-responsive design  
**Scale/Scope**: Regional to global site coverage, 100+ simultaneous markers, single-page application

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Initial Check (Pre-Research) ✅ PASSED
✅ **I. API-First Design**: Frontend consumes existing REST APIs (`/api/search`, `/api/place/{place_id}`) without modification. Clean separation between UI and data layers.

✅ **II. Research-Grade Data Integrity**: UI clearly distinguishes AI-generated content from source data. Site details display source attributions and scientific metadata without modification.

✅ **III. Graceful AI Integration**: UI handles API failures gracefully with user-friendly error messages and retry options. Map remains functional when detail APIs fail.

✅ **Technology Stack Compliance**: Uses approved frontend technologies (React, Vite, Node.js). Integrates with existing Python/FastAPI backend.

✅ **Development Standards**: Will include comprehensive testing, OpenAPI integration, and mobile-responsive design following constitution requirements.

### Post-Design Check ✅ PASSED

**Constitution Compliance Validation**:

✅ **API-First Design**: 
- All functionality exposed through existing REST endpoints
- Frontend implements proper HTTP methods and status code handling
- Comprehensive error handling with meaningful messages implemented
- Clear separation between frontend UI and backend data layers maintained

✅ **Research-Grade Data Integrity**:
- Site data maintains scientific accuracy through direct API consumption
- Source attributions displayed in UI with proper citations
- Location data uses precise coordinates with validation
- AI-generated content clearly labeled in side panel components

✅ **Graceful AI Integration**:
- Fallback mechanisms implemented for API failures
- Application remains functional with reduced capabilities (map-only mode)
- AI-generated summaries clearly labeled with source citations
- Caching implemented to avoid redundant API calls

✅ **Technology Stack Compliance**:
- Frontend: React 18+, Vite, TypeScript (approved technologies)
- Backend: Existing Python 3.11+, FastAPI (no changes required)
- Testing: Jest + React Testing Library (approved frameworks)
- All dependencies pinned to specific versions in package.json

✅ **Development Standards**:
- TypeScript provides type safety for all API interactions
- Comprehensive testing strategy covers components, services, and hooks
- Error handling includes timeout and retry logic for external API calls
- Mobile-responsive design with CSS Grid and Flexbox

**Final Gate Status**: PASSED - All constitution requirements satisfied in design phase.

## Project Structure

### Documentation (this feature)

```text
specs/001-interactive-map-ui/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Web application structure (frontend + existing backend)
frontend/
├── src/
│   ├── components/
│   │   ├── Map/
│   │   │   ├── MapContainer.tsx
│   │   │   ├── SiteMarker.tsx
│   │   │   └── MapControls.tsx
│   │   ├── SiteDetail/
│   │   │   ├── SidePanel.tsx
│   │   │   ├── SiteInfo.tsx
│   │   │   └── SourceAttribution.tsx
│   │   └── Common/
│   │       ├── ErrorMessage.tsx
│   │       ├── LoadingSpinner.tsx
│   │       └── RadiusDropdown.tsx
│   ├── services/
│   │   ├── api.ts
│   │   ├── geolocation.ts
│   │   └── mapService.ts
│   ├── hooks/
│   │   ├── useGeolocation.ts
│   │   ├── useSiteData.ts
│   │   └── useMapState.ts
│   ├── types/
│   │   ├── site.ts
│   │   ├── map.ts
│   │   └── api.ts
│   └── utils/
│       ├── coordinates.ts
│       └── validation.ts
├── public/
│   ├── index.html
│   └── favicon.ico
├── tests/
│   ├── components/
│   ├── services/
│   ├── hooks/
│   └── utils/
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md

backend/ (existing)
├── app/
│   ├── main.py          # Existing FastAPI endpoints
│   ├── rag_utils.py     # Existing retrieval logic
│   └── prompts.py       # Existing AI prompts
└── requirements.txt
```

**Structure Decision**: Selected web application structure with dedicated frontend directory. Backend remains unchanged as existing APIs provide all necessary functionality. Frontend uses React/TypeScript with Vite for modern development experience and OpenStreetMap/Leaflet for mapping capabilities.
