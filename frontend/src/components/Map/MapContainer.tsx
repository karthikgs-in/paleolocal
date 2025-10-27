import React, { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import { Coordinates, PaleoSite, MapViewState } from '../../types';

// Fix for default markers in Leaflet with webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapContainerProps {
  mapView: MapViewState;
  sites: PaleoSite[];
  selectedSiteId?: string | null;
  className?: string;
  onMapViewChange?: (center: Coordinates, zoom: number) => void;
  onSiteClick?: (site: PaleoSite) => void;
  onMapClick?: (coordinates: Coordinates) => void;
  onMapMoveStart?: () => void;
  onMapMoveEnd?: () => void;
  onMarkerRecreation?: () => void;
}

export const MapContainer: React.FC<MapContainerProps> = ({
  mapView,
  sites,
  selectedSiteId,
  className = '',
  onMapViewChange,
  onSiteClick,
  onMapClick,
  onMapMoveStart,
  onMapMoveEnd,
  onMarkerRecreation,
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const isUserInteractionRef = useRef(false);
  const visibilityCheckInterval = useRef<number | null>(null);

  // Create site icon - use the simplest possible approach that works
  const createSiteIcon = useCallback((isSelected: boolean = false) => {
    console.log('🗺️ Creating site icon, selected:', isSelected);
    
    // Use the most basic approach possible - single color, simple styles
    const color = isSelected ? 'lime' : 'red';
    const size = 25; // Fixed size for simplicity
    
    console.log('🗺️ Marker style:', { color, size });
    
    return L.divIcon({
      className: 'simple-marker',
      html: `<div style="background: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 2px solid white;"></div>`,
      iconSize: [size, size],
      iconAnchor: [size/2, size/2],
    });
  }, []);

  // Initialize map
  useEffect(() => {
    console.log('🗺️ Map initialization useEffect triggered');
    console.log('🗺️ containerRef.current:', !!containerRef.current);
    console.log('🗺️ mapRef.current:', !!mapRef.current);
    
    if (!containerRef.current || mapRef.current) {
      console.log('🗺️ Skipping map init - container missing or map already exists');
      return;
    }

    console.log('🗺️ Creating NEW map instance...');

    // Create map instance
    const map = L.map(containerRef.current, {
      center: [mapView.center.latitude, mapView.center.longitude],
      zoom: mapView.zoom,
      zoomControl: true,
      attributionControl: true,
    });

    console.log('🗺️ Map instance created, adding tile layer...');

    // Add OpenStreetMap tile layer with enhanced debugging
    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    });

    // Add tile loading event handlers for debugging
    tileLayer.on('loading', () => {
      console.log('🗺️ 🔄 Tiles started loading...');
    });

    tileLayer.on('load', () => {
      console.log('🗺️ ✅ All tiles loaded successfully');
    });

    tileLayer.on('tileerror', (e: any) => {
      console.log('🗺️ ❌ Tile loading error:', e);
    });

    tileLayer.addTo(map);

    console.log('🗺️ Tile layer added, setting up event handlers...');

    // Force map to calculate its size properly (fixes grey tiles issue)
    setTimeout(() => {
      console.log('🗺️ 🔧 Forcing map invalidateSize to fix tile rendering...');
      map.invalidateSize();
    }, 100);

    // Map event handlers
    map.on('movestart', () => {
      isUserInteractionRef.current = true;
      onMapMoveStart?.();
    });

    map.on('moveend', () => {
      if (isUserInteractionRef.current) {
        const center = map.getCenter();
        const zoom = map.getZoom();
        
        onMapViewChange?.({
          latitude: center.lat,
          longitude: center.lng,
        }, zoom);
      }
      
      isUserInteractionRef.current = false;
      onMapMoveEnd?.();
    });

    map.on('click', (e: L.LeafletMouseEvent) => {
      onMapClick?.({
        latitude: e.latlng.lat,
        longitude: e.latlng.lng,
      });
    });

    mapRef.current = map;

    console.log('🗺️ ✅ Map setup complete!');

    // Add window focus handler to debug visibility issues
    const handleWindowFocus = () => {
      console.log('🗺️ 🔍 Window focus detected, checking markers...');
      console.log('🗺️ Current markers count:', markersRef.current.size);
      
      // Notify parent component
      onMarkerRecreation?.();
    };

    window.addEventListener('focus', handleWindowFocus);

    // DEBUG: Add a test marker to verify map is working
    console.log('🧪 Adding test marker to verify map functionality...');
    const testMarker = L.marker([36.1069, -112.1129])
      .addTo(map)
      .bindPopup('Test marker - if you see this, basic Leaflet is working');
    
    // Remove test marker after 5 seconds
    setTimeout(() => {
      console.log('🧪 Removing test marker...');
      if (map && testMarker) {
        map.removeLayer(testMarker);
      }
    }, 5000);

    // Start visibility monitoring - check every 5 seconds
    console.log('🔍 Starting visibility monitoring...');
    // Temporarily disabled to debug loading issue
    // visibilityCheckInterval.current = window.setInterval(() => {
    //   checkMarkerVisibility();
    // }, 5000);

    // Cleanup function
    return () => {
      console.log('🗺️ 🧹 CLEANING UP MAP INSTANCE');
      window.removeEventListener('focus', handleWindowFocus);
      
      // Clear visibility check interval
      if (visibilityCheckInterval.current) {
        window.clearInterval(visibilityCheckInterval.current);
        visibilityCheckInterval.current = null;
      }
      
      if (mapRef.current) {
        console.log('🗺️ Removing map from DOM...');
        mapRef.current.remove();
        mapRef.current = null;
        console.log('🗺️ Map cleanup complete');
      }
      // Clear markers reference
      markersRef.current.clear();
    };
  }, [onMapViewChange, onMapClick, onMapMoveStart, onMapMoveEnd]);
  // Note: mapView is intentionally NOT in dependencies to prevent map recreation

  // Update map view when mapView prop changes (programmatic updates)
  useEffect(() => {
    if (!mapRef.current || isUserInteractionRef.current) return;

    const map = mapRef.current;
    const currentCenter = map.getCenter();
    const currentZoom = map.getZoom();

    const newLat = mapView.center.latitude;
    const newLng = mapView.center.longitude;
    const newZoom = mapView.zoom;

    // Only update if the view has actually changed
    if (
      Math.abs(currentCenter.lat - newLat) > 0.0001 ||
      Math.abs(currentCenter.lng - newLng) > 0.0001 ||
      currentZoom !== newZoom
    ) {
      map.setView([newLat, newLng], newZoom);
    }
  }, [mapView]);

  // Update site markers
  useEffect(() => {
    console.log('🗺️ 🔄 Marker update effect triggered');
    console.log('🗺️ Sites length:', sites.length);
    console.log('🗺️ Selected site ID:', selectedSiteId);
    
    if (!mapRef.current) {
      console.log('🗺️ ❌ MapContainer: No map reference, skipping marker update');
      return;
    }

    const map = mapRef.current;
    
    // Check if map is properly initialized
    if (!map.getContainer()) {
      console.log('🗺️ ❌ MapContainer: Map not properly initialized, skipping marker update');
      return;
    }

    console.log('🗺️ ✅ Map is ready, proceeding with marker update');
    console.log('🗺️ Sites received:', sites);
    console.log('🗺️ Sites details:', sites.map(s => ({ 
      id: s.id, 
      name: s.name, 
      coords: s.coordinates,
      lat: s.coordinates.latitude,
      lon: s.coordinates.longitude 
    })));
    console.log('🗺️ Map center:', map.getCenter());
    console.log('🗺️ Map zoom:', map.getZoom());
    console.log('🗺️ Current markers count:', markersRef.current.size);

    const currentMarkers = markersRef.current;

    // Remove markers that are no longer in the sites array
    for (const [siteId, marker] of currentMarkers.entries()) {
      if (!sites.find(site => site.id === siteId)) {
        console.log('🗺️ Removing marker for site:', siteId);
        map.removeLayer(marker);
        currentMarkers.delete(siteId);
      }
    }

    // Add or update markers for current sites
    sites.forEach(site => {
      const isSelected = site.id === selectedSiteId;
      
      console.log(`🗺️ Processing site: ${site.name} at [${site.coordinates.latitude}, ${site.coordinates.longitude}]`);
      
      if (currentMarkers.has(site.id)) {
        console.log('🗺️ Updating existing marker for:', site.name);
        // Update existing marker
        const marker = currentMarkers.get(site.id)!;
        marker.setIcon(createSiteIcon(isSelected));
        
        // Update tooltip
        marker.unbindTooltip();
        marker.bindTooltip(site.name, {
          permanent: false,
          direction: 'top',
          offset: [0, -10],
        });
      } else {
        console.log('🗺️ Creating NEW marker for:', site.name);
        // Create new marker with improved divIcon
        const marker = L.marker(
          [site.coordinates.latitude, site.coordinates.longitude],
          { icon: createSiteIcon(isSelected) }
        );

        console.log('🗺️ Marker created, adding to map...');

        // Add click handler
        marker.on('click', () => {
          console.log('🔴 Site marker clicked:', site.name, site.id);
          console.log('🔴 onSiteClick function:', typeof onSiteClick);
          console.log('🔴 Calling onSiteClick...');
          onSiteClick?.(site);
          console.log('🔴 onSiteClick called successfully');
        });

        // Add tooltip
        marker.bindTooltip(site.name, {
          permanent: false,
          direction: 'top',
          offset: [0, -10],
        });

        marker.addTo(map);
        currentMarkers.set(site.id, marker);
        
        console.log('🗺️ ✅ Marker added to map for:', site.name);
        
        // ENHANCED: Immediately check if marker is properly rendered
        setTimeout(() => {
          const element = marker.getElement();
          console.log(`🔍 Post-creation check for ${site.name}:`, {
            hasElement: !!element,
            isVisible: element?.offsetParent !== null,
            isAttachedToMap: map.hasLayer(marker),
            elementStyle: element ? {
              display: element.style.display,
              visibility: element.style.visibility,
              opacity: element.style.opacity,
              transform: element.style.transform
            } : null
          });
          
          if (!element || element.offsetParent === null) {
            console.log('🚨 PROBLEM: Marker created but not visible immediately!');
          }
        }, 100);
      }
    });
    
    console.log('🗺️ Total markers on map:', currentMarkers.size);
  }, [sites, selectedSiteId, createSiteIcon, onSiteClick]);

  // Update selected marker styling
  useEffect(() => {
    const currentMarkers = markersRef.current;
    
    currentMarkers.forEach((marker, siteId) => {
      const isSelected = siteId === selectedSiteId;
      marker.setIcon(createSiteIcon(isSelected));
    });
  }, [selectedSiteId, createSiteIcon]);

  return (
    <>
      <div 
        ref={containerRef} 
        className={`map-container ${className}`}
        style={{ 
          width: '100%', 
          height: '100%',
          minHeight: '400px',
          position: 'relative',
          background: '#f0f0f0' // Light background to see if tiles are loading
        }}
      />
      
      {/* Ensure marker visibility and fix tile rendering */}
      <style>{`
        .simple-marker {
          background: transparent !important;
          border: none !important;
        }
        
        .simple-marker div {
          pointer-events: auto !important;
          cursor: pointer !important;
        }
        
        /* Prevent Leaflet from hiding markers */
        .leaflet-marker-icon {
          visibility: visible !important;
          opacity: 1 !important;
          display: block !important;
        }
        
        /* Fix for greyed out tiles */
        .leaflet-tile {
          filter: none !important;
          opacity: 1 !important;
        }
        
        .leaflet-tile-pane {
          filter: none !important;
        }
        
        /* Ensure map container has proper rendering */
        .map-container {
          background: #f0f0f0;
        }
        
        .leaflet-container {
          background: #f0f0f0;
          filter: none !important;
        }
      `}</style>
    </>
  );
};