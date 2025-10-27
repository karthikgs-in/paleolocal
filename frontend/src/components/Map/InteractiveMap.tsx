import React, { useState, useCallback, useEffect } from 'react';
import { PaleoSite, Coordinates } from '../../types';
import { useMapState } from '../../hooks/useMapState';
import { useSiteData } from '../../hooks/useSiteData';
import { MapContainerSimple as MapContainer } from './MapContainerSimple';
import { SidePanel } from './SidePanel';
import { DEV_CONFIG, shouldShowDebugFeatures } from '../../config/dev';
import './InteractiveMap.css';

interface InteractiveMapProps {
  className?: string;
  initialCenter?: Coordinates;
  initialZoom?: number;
  showAttribution?: boolean;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  className = '',
  initialCenter,
  initialZoom = 6,
  showAttribution = true,
}) => {
  // State management
  const [selectedSite, setSelectedSite] = useState<PaleoSite | null>(null);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [markerRecreationCount, setMarkerRecreationCount] = useState(0);

  if (DEV_CONFIG.ENABLE_DEBUG_LOGGING) {
    console.log('🗺️ InteractiveMap rendering');
  }

  const { 
    mapView, 
    setView
  } = useMapState();

  // TEMPORARY: Keep simple mock data until we debug the CSV parsing issue
  const searchResults: PaleoSite[] = [
    {
      id: 'mock-1',
      name: 'Grand Canyon National Park',
      coordinates: { latitude: 36.1069, longitude: -112.1129 },
      description: 'Famous geological formations with extensive fossil records'
    },
    {
      id: 'mock-2', 
      name: 'Petrified Forest',
      coordinates: { latitude: 34.9094, longitude: -109.9067 },
      description: 'Ancient petrified wood and fossil deposits'
    },
    {
      id: 'mock-3',
      name: 'Fossil Butte',
      coordinates: { latitude: 41.8683, longitude: -110.7624 },
      description: 'Rich Eocene fossil deposits'
    }
  ];

  // Comment out the real hook for now to debug
  /*
  // Use the real site data hook with mock API backend
  const {
    sites: searchResults,
    selectedSite: hookSelectedSite,
    isLoading: sitesLoading,
    error: sitesError,
    searchSites,
    getSiteDetails,
    clearSelectedSite
  } = useSiteData();

  // Sync selected site with hook state
  useEffect(() => {
    if (hookSelectedSite && hookSelectedSite.id !== selectedSite?.id) {
      setSelectedSite(hookSelectedSite);
    }
  }, [hookSelectedSite, selectedSite]);

  // Perform initial search when component mounts or map view changes significantly
  useEffect(() => {
    const performSearch = async () => {
      if (mapView.zoom >= 6) { // Only search at reasonable zoom levels
        try {
          await searchSites({
            center: mapView.center,
            radius: Math.max(50, Math.min(200, 100 * (18 - mapView.zoom))), // Dynamic radius
            filters: {
              accessibility: 'public'
            }
          });
        } catch (error) {
          if (DEV_CONFIG.ENABLE_DEBUG_LOGGING) {
            console.error('🔍 Search failed:', error);
          }
        }
      }
    };

    performSearch();
  }, [mapView.center.latitude, mapView.center.longitude, mapView.zoom, searchSites]);
  */

  // Simple map view change handler  
  const handleMapViewChange = useCallback(async (center: Coordinates, zoom: number) => {
    if (DEV_CONFIG.ENABLE_DEBUG_LOGGING) {
      console.log('handleMapViewChange called:', { center, zoom });
    }
    setView(center, zoom);
  }, [setView]);

  // Handle site click
  const handleSiteClick = useCallback(async (site: PaleoSite) => {
    if (DEV_CONFIG.ENABLE_DEBUG_LOGGING) {
      console.log('🔴 Site clicked:', site.name, site.id);
    }
    setSelectedSite(site);
    setSidePanelOpen(true);
  }, []);

  // Handle map click
  const handleMapClick = useCallback((coordinates: Coordinates) => {
    if (DEV_CONFIG.ENABLE_DEBUG_LOGGING) {
      console.log('🗺️ Map clicked at:', coordinates);
    }
    setSidePanelOpen(false);
    setSelectedSite(null);
  }, []);

  return (
    <div className={`interactive-map ${className}`}>
      {/* Main map container */}
      <div className="map-wrapper">
        <MapContainer
          mapView={mapView}
          sites={searchResults}
          selectedSiteId={selectedSite?.id}
          onMapViewChange={handleMapViewChange}
          onSiteClick={handleSiteClick}
          onMapClick={handleMapClick}
          onMarkerRecreation={() => setMarkerRecreationCount(prev => prev + 1)}
          className="main-map"
        />
      </div>

      {/* Side panel */}
      <SidePanel
        isOpen={sidePanelOpen}
        onClose={() => {
          setSidePanelOpen(false);
          setSelectedSite(null);
        }}
        selectedSite={selectedSite}
        searchResults={searchResults}
        isLoading={false}
        error={null}
      />

      {/* DEBUG: Show side panel state - only in development with debug features enabled */}
      {shouldShowDebugFeatures() && DEV_CONFIG.SHOW_DEBUG_PANELS && (
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '10px',
          borderRadius: '4px',
          fontSize: '12px',
          zIndex: 10000
        }}>
          <div>Panel Open: {sidePanelOpen ? 'YES' : 'NO'}</div>
          <div>Selected Site: {selectedSite?.name || 'None'}</div>
          <div>Sites Count: {searchResults.length}</div>
          <div>Recreations: {markerRecreationCount}</div>
        </div>
      )}
    </div>
  );
};