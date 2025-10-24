import React, { useState, useCallback, useEffect } from 'react';
import { PaleoSite, Coordinates } from '../../types';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useSiteData } from '../../hooks/useSiteData';
import { useMapState } from '../../hooks/useMapState';
import { MapContainer } from './MapContainer';
import { SidePanel } from './SidePanel';
import { SourceAttribution } from './SourceAttribution';
import { LoadingSpinner } from '../Common/LoadingSpinner';
import { ErrorMessage } from '../Common/ErrorMessage';
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
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [skipLocation, setSkipLocation] = useState(false);
  const [locationTimeout, setLocationTimeout] = useState(false);

  // Custom hooks
  const { 
    coordinates: userLocation, 
    error: locationError, 
    isLoading: locationLoading,
    getCurrentLocation
  } = useGeolocation({ 
    immediate: false, // Disable immediate request
    useMockLocation: true // Use mock location instead of browser geolocation
  });

  // Debug logging
  console.log('Geolocation state:', {
    userLocation,
    locationError,
    locationLoading,
    shouldUseGlobalView: !userLocation && !locationLoading
  });

  const { 
    mapView, 
    setView
  } = useMapState();

  const { 
    searchSites, 
    getSiteDetails, 
    sites: searchResults, 
    isLoading: sitesLoading,
    error: sitesError
  } = useSiteData();

  // Determine if we should show the global map view or user location
  const currentCenter = userLocation || initialCenter || { latitude: 39.8283, longitude: -98.5795 };

  // Search for sites when map view changes
  const handleMapViewChange = useCallback(async (center: Coordinates, zoom: number) => {
    console.log('handleMapViewChange called:', { center, zoom });
    setView(center, zoom);
    
    // Only search if zoom level is appropriate (not too zoomed out)
    if (zoom >= 8) {
      console.log('Zoom level sufficient, starting search...');
      setIsSearching(true);
      setSearchError(null);
      
      try {
        // Calculate search radius based on zoom level
        const radius = Math.max(5, 50 / Math.pow(2, zoom - 8));
        console.log('Search parameters:', { center, radius });
        
        await searchSites({
          center,
          radius,
          filters: {
            accessibility: 'public' // Default to public sites only
          }
        });
        console.log('Search completed successfully, sites found:', searchResults.length);
        console.log('Sites:', searchResults.map(s => ({ id: s.id, name: s.name, coords: s.coordinates })));
      } catch (error) {
        console.error('Search failed:', error);
        setSearchError(error instanceof Error ? error.message : 'Failed to search for sites');
      } finally {
        setIsSearching(false);
      }
    } else {
      console.log('Zoom level too low for search:', zoom);
    }
  }, [setView, searchSites]);

  // Handle site selection from map marker
  const handleSiteClick = useCallback(async (site: PaleoSite) => {
    console.log('🎯 handleSiteClick called for:', site.name, site.id);
    console.log('Current side panel state:', { sidePanelOpen, selectedSite: selectedSite?.id });
    
    try {
      // Get detailed information for the site
      console.log('Getting site details...');
      const detailedSite = await getSiteDetails(site.id);
      console.log('Site details received:', detailedSite);
      
      setSelectedSite(detailedSite || site);
      setSidePanelOpen(true);
      console.log('✅ Side panel should now be open');
    } catch (error) {
      console.error('Failed to get site details:', error);
      // Fall back to basic site info if details fail
      setSelectedSite(site);
      setSidePanelOpen(true);
      console.log('✅ Side panel opened with basic site info');
    }
  }, [getSiteDetails, sidePanelOpen, selectedSite]);

  // Handle site selection from search results
  const handleSiteSelectFromPanel = useCallback((site: PaleoSite) => {
    setSelectedSite(site);
    // Update map view to center on selected site
    setView(site.coordinates, Math.max(mapView.zoom, 12));
  }, [setView, mapView.zoom]);

  // Handle map click (deselect site)
  const handleMapClick = useCallback(() => {
    setSelectedSite(null);
  }, []);

  // Handle close side panel
  const handleCloseSidePanel = useCallback(() => {
    setSidePanelOpen(false);
    setSelectedSite(null);
  }, []);

  // Handle source attribution clicks
  const handleSourceClick = useCallback((source: string) => {
    console.log('Source clicked:', source);
    // Could open a modal with detailed source information
  }, []);

  // Request location permission on mount
  useEffect(() => {
    console.log('Effect: requesting location on mount');
    
    // Test direct browser API first
    if ('geolocation' in navigator) {
      console.log('Geolocation is supported, testing direct API...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Direct API success:', position.coords);
        },
        (error) => {
          console.log('Direct API error:', error);
        },
        { timeout: 5000, enableHighAccuracy: false }
      );
    } else {
      console.log('Geolocation not supported');
    }
    
    const requestLocation = async () => {
      try {
        console.log('About to call getCurrentLocation');
        await getCurrentLocation();
        console.log('getCurrentLocation completed');
      } catch (error) {
        console.error('Error in getCurrentLocation:', error);
      }
    };
    requestLocation();
    
    // Set timeout to auto-skip if location takes too long
    const timeout = setTimeout(() => {
      console.log('Location request timed out, auto-skipping');
      setLocationTimeout(true);
      setSkipLocation(true);
    }, 10000); // 10 seconds timeout
    
    return () => clearTimeout(timeout);
  }, [getCurrentLocation]); // Include getCurrentLocation in deps

  // Perform initial search when component mounts and location is available
  useEffect(() => {
    console.log('Search effect triggered:', { currentCenter, zoom: mapView.zoom, shouldSearch: mapView.zoom >= 8 });
    if (currentCenter && mapView.zoom >= 8) {
      console.log('Triggering initial search for location:', currentCenter);
      handleMapViewChange(currentCenter, mapView.zoom);
    }
  }, [currentCenter, mapView.zoom, handleMapViewChange]);

  // Initialize map with proper center and zoom
  useEffect(() => {
    if (currentCenter) {
      setView(currentCenter, initialZoom);
    }
  }, [currentCenter, initialZoom, setView]);

  // Show loading spinner only briefly while getting mock location (should be fast)
  if (locationLoading && !skipLocation && !userLocation) {
    console.log('Showing loading spinner for mock location');
    return (
      <div className="interactive-map-loading">
        <LoadingSpinner size="large" message="Loading map..." />
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <p style={{ color: '#666', marginBottom: '10px', fontSize: '14px' }}>
            {locationTimeout ? 'Taking longer than expected...' : 'Initializing interactive map'}
          </p>
          <button 
            onClick={() => {
              console.log('Skip location clicked');
              setSkipLocation(true);
            }}
            style={{
              background: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Skip to global view
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`interactive-map ${className}`}>
      {/* Location permission banner */}
      {locationError && (
        <div className="location-banner">
          <div className="location-banner-content">
            <span className="location-icon">📍</span>
            <span className="location-message">
              Location access denied. Showing global view. 
            </span>
            <button 
              className="location-retry-button"
              onClick={getCurrentLocation}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Main map container */}
      <div className="map-wrapper">
        <MapContainer
          mapView={mapView}
          sites={searchResults}
          selectedSiteId={selectedSite?.id}
          onMapViewChange={handleMapViewChange}
          onSiteClick={handleSiteClick}
          onMapClick={handleMapClick}
          className="main-map"
        />

        {/* Search status overlay */}
        {(isSearching || sitesError) && (
          <div className="search-status-overlay">
            {isSearching && (
              <div className="search-status searching">
                <LoadingSpinner size="small" />
                <span>Searching for paleontological sites...</span>
              </div>
            )}
            {sitesError && (
              <div className="search-status error">
                <ErrorMessage 
                  error={sitesError}
                  showDetails={false}
                  canDismiss={false}
                />
              </div>
            )}
          </div>
        )}

        {/* Source attribution */}
        {showAttribution && (
          <div className="map-attribution">
            <SourceAttribution />
          </div>
        )}
      </div>

      {/* Side panel for site details */}
      <SidePanel
        isOpen={sidePanelOpen}
        onClose={handleCloseSidePanel}
        selectedSite={selectedSite}
        searchResults={searchResults}
        isLoading={sitesLoading || isSearching}
        error={sitesError?.message || searchError}
        onSiteSelect={handleSiteSelectFromPanel}
        onSourceClick={handleSourceClick}
      />
    </div>
  );
};