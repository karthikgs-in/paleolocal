import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { PaleoSite, Coordinates } from '../../types';
import { useMapState } from '../../hooks/useMapState';
import { useSiteData } from '../../hooks/useSiteData';
import { MapContainerSimple as MapContainer } from './MapContainerSimple';
import { SidePanel } from './SidePanel';
import ChatInterface from '../Chat/ChatInterface';
import { DEV_CONFIG, shouldShowDebugFeatures } from '../../config/dev';
import { mockAPI } from '../../services/mockAPI';
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
  // State management
  const [selectedSite, setSelectedSite] = useState<PaleoSite | null>(null);
  const [topSite, setTopSite] = useState<PaleoSite | null>(null); // Closest/most relevant site for chat
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [markerRecreationCount, setMarkerRecreationCount] = useState(0);
  const [searchResults, setSearchResults] = useState<PaleoSite[]>([]);
  const [allSites, setAllSites] = useState<PaleoSite[]>([]);
  const [chatPosition, setChatPosition] = useState<{ x: number; y: number } | null>(null);
  
  // Chat state - single interface that can be floating or docked
  const [chatOpen, setChatOpen] = useState(true); // Start open with top site
  const [chatDocked, setChatDocked] = useState(false); // false = floating, true = docked in panel
  const [userId] = useState(() => `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  const { 
    mapView, 
    setView
  } = useMapState();

  // Memoize the converted sites to prevent unnecessary recalculations
  const convertedSites = useMemo(() => {
    return PLACES_DATA.map(place => ({
      id: place.id,
      name: place.name,
      coordinates: { 
        latitude: place.lat, 
        longitude: place.lon 
      },
      description: place.known_type || 'Paleontological site'
    }));
  }, []);

  // Load all sites on component mount
  useEffect(() => {
    setAllSites(convertedSites);
    
    // Show only Grand Canyon initially (first site in PLACES_DATA)
    const grandCanyon = convertedSites.find(site => site.name === 'Grand Canyon') || convertedSites[0];
    setSearchResults([grandCanyon]);
    setTopSite(grandCanyon); // Set as top site for chat
  }, [convertedSites]);

  // Update top site when search results change (always the first/top one)
  useEffect(() => {
    if (searchResults.length > 0) {
      const newTopSite = searchResults[0];
      setTopSite(newTopSite);
    }
  }, [searchResults]);

  // Random site selection for POC location-based search
  const getRandomSites = useCallback((clickedLocation: Coordinates, count: number = 5): PaleoSite[] => {
    if (allSites.length === 0) {
      // Fallback: use convertedSites directly if allSites is empty
      const shuffled = [...convertedSites].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, Math.min(count, convertedSites.length));
      return selected;
    }
    
    const shuffled = [...allSites].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(count, allSites.length));
    
    return selected;
  }, [allSites, convertedSites]);

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

  // Set top site when search results change (closest to map center)
  useEffect(() => {
    if (searchResults.length > 0 && !topSite) {
      // For now, just use the first result as the top site
      // In the future, this could be the closest to map center
      setTopSite(searchResults[0]);
    }
  }, [searchResults, topSite]);

  // Initialize with some default sites if no search results
  useEffect(() => {
    if (convertedSites.length > 0 && searchResults.length === 0) {
      // Set some default sites and pick the first as top site
      setSearchResults(convertedSites.slice(0, 5));
      setTopSite(convertedSites[0]);
    }
  }, [convertedSites, searchResults]);

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
    setView(center, zoom);
  }, [setView]);

  // Calculate chat position near a site marker
  const calculateChatPosition = useCallback((site: PaleoSite) => {
    // This would ideally get the actual marker position from the map
    // For now, we'll use a simple calculation based on viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Position chat on the right side, slightly below center
    const x = Math.min(viewportWidth - 350, viewportWidth * 0.7);
    const y = Math.min(viewportHeight - 400, viewportHeight * 0.3);
    
    return { x, y };
  }, []);

  // Handle site click - dock the chat and open side panel
  const handleSiteClick = useCallback(async (site: PaleoSite) => {
    setSelectedSite(site);
    setTopSite(site); // Update chat to focus on clicked site
    setSidePanelOpen(true);
    setChatDocked(true); // Dock the chat into the side panel
    
    // Center map on the selected site
    setView(site.coordinates, Math.max(mapView.zoom, 10)); // Zoom to at least level 10
    
    // Calculate and set chat position near the clicked site (for future floating mode)
    const position = calculateChatPosition(site);
    setChatPosition(position);
  }, [calculateChatPosition, setView, mapView.zoom]);

  // Handle map click - POC location-based search
  const handleMapClick = useCallback((coordinates: Coordinates) => {
    // POC: Randomly select a few sites and show them as markers on the map
    const randomSites = getRandomSites(coordinates, 5);
    
    setSearchResults(randomSites);
    
    // Set the top site to the first one for chat association
    if (randomSites.length > 0) {
      const newTopSite = randomSites[0];
      setTopSite(newTopSite);
      
      // Calculate chat position for the top site
      const position = calculateChatPosition(newTopSite);
      setChatPosition(position);
    }
    
    // Don't open side panel on map click - only show the markers
    // Side panel opens when user clicks on a specific site marker
    setSelectedSite(null);
    setSidePanelOpen(false);
  }, [getRandomSites, calculateChatPosition]);

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

      {/* Side panel with integrated chat */}
      <SidePanel
        isOpen={sidePanelOpen}
        onClose={() => {
          setSidePanelOpen(false);
          setSelectedSite(null);
          setChatDocked(false); // Undock chat when panel closes
        }}
        selectedSite={selectedSite}
        searchResults={searchResults}
        isLoading={false}
        error={null}
        // Chat props for docked mode
        chatOpen={chatOpen && chatDocked}
        onChatToggle={() => setChatOpen(!chatOpen)}
        chatComponent={chatDocked ? (
          <ChatInterface
            isOpen={chatOpen}
            onClose={() => setChatOpen(false)}
            siteId={topSite?.id}
            siteName={topSite?.name}
            userId={userId}
            isMapMode={false}
            isDocked={true}
          />
        ) : null}
      />

      {/* Floating chat interface - only when not docked */}
      {!chatDocked && (
        <ChatInterface
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
          siteId={topSite?.id}
          siteName={topSite?.name}
          userId={userId}
          position={chatPosition}
          isMapMode={true}
          isDocked={false}
          isMovable={true}
          isResizable={true}
        />
      )}

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
          <div>Top Site (Chat): {topSite?.name || 'None'}</div>
          <div>Sites Count: {searchResults.length}</div>
          <div>Chat Open: {chatOpen ? 'OPEN' : 'CLOSED'}</div>
          <div>Chat Docked: {chatDocked ? 'YES' : 'NO'}</div>
          <div>Chat Position: {chatPosition ? `${chatPosition.x}, ${chatPosition.y}` : 'None'}</div>
          <div>Recreations: {markerRecreationCount}</div>
        </div>
      )}
    </div>
  );
};