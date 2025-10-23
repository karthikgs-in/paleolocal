import React from 'react';
import { Coordinates, SearchFormState, PaleoSite, MapViewState, LoadingState, ApiError } from '../types';

interface MapViewProps {
  mapView: MapViewState;
  searchForm: SearchFormState;
  searchResults: PaleoSite[];
  loading: LoadingState;
  error: ApiError | null;
  onMapViewChange: (center: Coordinates, zoom: number) => void;
  onSearchFormChange: (searchForm: SearchFormState) => void;
  onSearch: () => void;
  onSiteSelect: (siteId: string) => void;
  onErrorDismiss: () => void;
}

export const MapView: React.FC<MapViewProps> = ({
  mapView: _mapView,
  searchForm: _searchForm,
  searchResults: _searchResults,
  loading: _loading,
  error: _error,
  onMapViewChange: _onMapViewChange,
  onSearchFormChange: _onSearchFormChange,
  onSearch: _onSearch,
  onSiteSelect: _onSiteSelect,
  onErrorDismiss: _onErrorDismiss,
}) => {
  return (
    <div style={{ width: '100%', height: '100%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p>MapView Component - To be implemented</p>
      {/* TODO: Implement Leaflet map integration */}
    </div>
  );
};