import React, { useState, useCallback, useEffect, useRef } from 'react';
import { PaleoSite, Coordinates } from '../../types';
import { useMapState } from '../../hooks/useMapState';
import { useSiteData } from '../../hooks/useSiteData';
import { MapContainerSimple as MapContainer } from './MapContainerSimple';
import { SidePanel } from './SidePanel';
import { RadiusSelector } from './RadiusSelector';
import { BoundingBoxDisplay } from './BoundingBoxDisplay';
import { DEV_CONFIG, shouldShowDebugFeatures } from '../../config/dev';
import { apiService } from '../../services/apiService';
import { PLACES_DATA } from '../../data/seedPlaces';
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
  // Debug PLACES_DATA import
  console.log('🚀 InteractiveMap component mounting');
  console.log('🚀 PLACES_DATA available:', !!PLACES_DATA);
  console.log('🚀 PLACES_DATA length:', PLACES_DATA?.length || 'undefined');
  console.log('🚀 Sample PLACES_DATA:', PLACES_DATA?.slice(0, 2));
  
  // State management
  const [selectedSite, setSelectedSite] = useState<PaleoSite | null>(null);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [markerRecreationCount, setMarkerRecreationCount] = useState(0);
  const [searchResults, setSearchResults] = useState<PaleoSite[]>([]);
  const [allSites, setAllSites] = useState<PaleoSite[]>([]);
  const [searchRadius, setSearchRadius] = useState<number>(100); // Default 100km radius
  const [mapBounds, setMapBounds] = useState<{ northeast: Coordinates; southwest: Coordinates } | null>(null);
  const [showBoundingBox, setShowBoundingBox] = useState<boolean>(true); // Show bounding box by default
  
  // Use ref to always get current radius value (avoids closure issues)
  const searchRadiusRef = useRef<number>(searchRadius);
  
  // Keep ref in sync with state
  useEffect(() => {
    searchRadiusRef.current = searchRadius;
  }, [searchRadius]);

  // Debug searchResults changes
  useEffect(() => {
    console.log('🔄 searchResults changed:', searchResults.length, 'sites');
    searchResults.forEach(site => {
      console.log('  - Site:', site.name, `(${site.coordinates.latitude}, ${site.coordinates.longitude})`);
    });
  }, [searchResults]);

  // Debug allSites changes
  useEffect(() => {
    console.log('📊 allSites changed:', allSites.length, 'total sites available');
    if (allSites.length > 0) {
      console.log('📊 Sample sites:', allSites.slice(0, 3).map(s => s.name));
    }
  }, [allSites]);

  if (DEV_CONFIG.ENABLE_DEBUG_LOGGING) {
    console.log('🗺️ InteractiveMap rendering');
  }

  const { 
    mapView, 
    setView
  } = useMapState();

  // Load all sites on component mount
  useEffect(() => {
    const loadAllSites = () => {
      console.log('🔧 loadAllSites called');
      console.log('🔧 PLACES_DATA length:', PLACES_DATA.length);
      console.log('🔧 First few PLACES_DATA items:', PLACES_DATA.slice(0, 3));
      
      // Convert all PLACES_DATA to PaleoSite format
      const convertedSites = PLACES_DATA.map(place => ({
        id: place.id,
        name: place.name,
        coordinates: { 
          latitude: place.lat, 
          longitude: place.lon 
        },
        description: place.known_type || 'Paleontological site'
      }));
      
      console.log('🔧 Converted sites:', convertedSites.length);
      console.log('🔧 First converted site:', convertedSites[0]);
      
      setAllSites(convertedSites);
      
      // Show only Grand Canyon initially (first site in PLACES_DATA)
      const grandCanyon = convertedSites.find(site => site.name === 'Grand Canyon') || convertedSites[0];
      console.log('🔧 Initial site (Grand Canyon):', grandCanyon);
      
      setSearchResults([grandCanyon]);
      
      if (DEV_CONFIG.ENABLE_DEBUG_LOGGING) {
        console.log('🔍 Loaded sites:', convertedSites.length);
        console.log('🏔️ Initially showing:', grandCanyon.name);
      }
    };

    loadAllSites();
  }, []);

  // API-based site search for location-based search
  const searchSitesNearLocation = useCallback(async (clickedLocation: Coordinates, radiusKm?: number): Promise<PaleoSite[]> => {
    // Use the current searchRadius state if no radius is provided
    const actualRadius = radiusKm ?? searchRadius;
    
    console.log('🔍 searchSitesNearLocation called with:', { clickedLocation, radiusKm, actualRadius });
    console.log('🔍 Current searchRadius state:', searchRadius);
    console.log('🔍 Using radius:', actualRadius);
    
    try {
      const sites = await apiService.searchSites(clickedLocation, actualRadius);
      console.log('🔍 API returned sites:', sites.length, sites.map(s => s.name));
      return sites;
    } catch (error) {
      console.error('⚠️ API search failed, falling back to empty results:', error);
      // Minimal fallback - let the user know something went wrong
      return [];
    }
  }, [searchRadius]);

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

  // Handle bounds change from map
  const handleBoundsChange = useCallback((bounds: { northeast: Coordinates; southwest: Coordinates }) => {
    setMapBounds(bounds);
    console.log('🗺️ Map bounds updated:', bounds);
  }, []);

  // Handle site click
  const handleSiteClick = useCallback(async (site: PaleoSite) => {
    if (DEV_CONFIG.ENABLE_DEBUG_LOGGING) {
      console.log('🔴 Site clicked:', site.name, site.id);
    }
    
    console.log('📋 Opening side panel for site:', site.name);
    setSelectedSite(site);
    setSidePanelOpen(true);
  }, []);

  // Handle map click - Real location-based search with API
  const handleMapClick = useCallback(async (coordinates: Coordinates) => {
    const currentRadius = searchRadiusRef.current; // Always get current value from ref
    
    if (DEV_CONFIG.ENABLE_DEBUG_LOGGING) {
      console.log('🗺️ Map clicked at:', coordinates);
      console.log('🗺️ Current searchRadius:', currentRadius);
    }
    
    // Alert lat/lng for debugging
    alert(`Map clicked at:\nLatitude: ${coordinates.latitude}\nLongitude: ${coordinates.longitude}\nRadius: ${currentRadius}km`);
    
    try {
      // Call API directly with current radius from ref
      const sites = await apiService.searchSites(coordinates, currentRadius);
      console.log('🎯 Setting searchResults to:', sites.length, 'sites');
      console.log('🎯 Site names:', sites.map((s: PaleoSite) => s.name));
      
      setSearchResults(sites);
      
      // Don't open side panel on map click - only show the markers
      // Side panel opens when user clicks on a specific site marker
      setSelectedSite(null);
      setSidePanelOpen(false);
      
      // Always log this so user can see it's working
      console.log('🎯 Location-based search activated! Showing site markers:', sites.map((s: PaleoSite) => s.name));
      
      if (DEV_CONFIG.ENABLE_DEBUG_LOGGING) {
        console.log('🎯 Location-based search: showing nearby sites:', sites.map((s: PaleoSite) => s.name));
      }
    } catch (error) {
      console.error('🚨 Map click search failed:', error);
      // Keep existing results on error
    }
  }, []); // Remove searchRadius dependency since we're using ref

  return (
    <div className={`interactive-map ${className}`}>
      {/* Radius selector */}
      <div className="radius-selector-container">
        <RadiusSelector
          selectedRadius={searchRadius}
          onRadiusChange={setSearchRadius}
        />
      </div>

      {/* Main map container */}
      <div className="map-wrapper">
        <MapContainer
          mapView={mapView}
          sites={searchResults}
          selectedSiteId={selectedSite?.id}
          onMapViewChange={handleMapViewChange}
          onSiteClick={handleSiteClick}
          onMapClick={handleMapClick}
          onBoundsChange={handleBoundsChange}
          onMarkerRecreation={() => setMarkerRecreationCount(prev => prev + 1)}
          className="main-map"
        />
        
        {/* POC: Bounding Box Display */}
        <BoundingBoxDisplay
          bounds={mapBounds || undefined}
          center={mapView.center}
          zoom={mapView.zoom}
          visible={showBoundingBox}
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