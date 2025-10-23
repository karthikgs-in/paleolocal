// Geographic coordinate type
export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Paleontological site data structure matching backend API
export interface PaleoSite {
  id: string;
  name: string;
  description: string;
  coordinates: Coordinates;
  formation?: string;
  age?: string;
  period?: string;
  significance?: string;
  accessibility?: 'public' | 'restricted' | 'private';
  lastUpdated?: string;
}

// Search request parameters for /api/search endpoint
export interface SearchRequest {
  center: Coordinates;
  radius: number; // in kilometers
  query?: string;
  filters?: {
    period?: string;
    formation?: string;
    accessibility?: 'public' | 'restricted' | 'private';
  };
}

// Search response structure from backend API
export interface SearchResponse {
  sites: PaleoSite[];
  total: number;
  center: Coordinates;
  radius: number;
  query?: string;
}

// Map view state for Leaflet integration
export interface MapViewState {
  center: Coordinates;
  zoom: number;
  bounds?: {
    northeast: Coordinates;
    southwest: Coordinates;
  };
}

// Search form state
export interface SearchFormState {
  center: Coordinates;
  radius: number;
  query: string;
  filters: {
    period: string;
    formation: string;
    accessibility: string;
  };
}

// Error types for user-friendly error handling
export interface ApiError {
  message: string;
  code?: string;
  details?: string;
}

// Loading states for UI components
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Side panel state for site details
export interface SidePanelState {
  isOpen: boolean;
  selectedSite: PaleoSite | null;
  mode: 'details' | 'search' | 'closed';
}

// Application state interface
export interface AppState {
  mapView: MapViewState;
  searchForm: SearchFormState;
  searchResults: PaleoSite[];
  sidePanel: SidePanelState;
  loading: LoadingState;
  error: ApiError | null;
}