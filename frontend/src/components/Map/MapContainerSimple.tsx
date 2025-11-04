import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Coordinates, PaleoSite, MapViewState } from '../../types';

// Fix for default markers in Leaflet with webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapContainerSimpleProps {
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
  onBoundsChange?: (bounds: { northeast: Coordinates; southwest: Coordinates }) => void;
}

export const MapContainerSimple: React.FC<MapContainerSimpleProps> = ({
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
  onBoundsChange,
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  console.log('🗺️ MapContainerSimple render started');

  // Initialize map - SIMPLIFIED VERSION
  useEffect(() => {
    console.log('🗺️ Map initialization useEffect triggered');
    
    if (!containerRef.current || mapRef.current) {
      console.log('🗺️ Skipping map init - container missing or map already exists');
      return;
    }

    console.log('🗺️ Creating NEW map instance...');

    try {
      // Create map instance
      const map = L.map(containerRef.current, {
        center: [mapView.center.latitude, mapView.center.longitude],
        zoom: mapView.zoom,
        zoomControl: true,
        attributionControl: true,
      });

      console.log('🗺️ Map instance created, adding tile layer...');

      // Add OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map);

      mapRef.current = map;

      // Function to update bounds
      const updateBounds = () => {
        if (onBoundsChange && mapRef.current) {
          const bounds = mapRef.current.getBounds();
          const boundsData = {
            northeast: {
              latitude: bounds.getNorthEast().lat,
              longitude: bounds.getNorthEast().lng,
            },
            southwest: {
              latitude: bounds.getSouthWest().lat,
              longitude: bounds.getSouthWest().lng,
            }
          };
          onBoundsChange(boundsData);
        }
      };

      // Add map event handlers
      map.on('moveend', () => {
        const center = map.getCenter();
        const zoom = map.getZoom();
        
        console.log('🗺️ Map moved - Center:', center, 'Zoom:', zoom);
        
        if (onMapViewChange) {
          onMapViewChange(
            { latitude: center.lat, longitude: center.lng },
            zoom
          );
        }
        
        // Update bounds after move
        updateBounds();
        
        if (onMapMoveEnd) {
          onMapMoveEnd();
        }
      });

      map.on('zoomend', () => {
        console.log('🗺️ Map zoom changed');
        updateBounds();
      });

      map.on('movestart', () => {
        if (onMapMoveStart) {
          onMapMoveStart();
        }
      });

      // Initial bounds update
      setTimeout(() => {
        updateBounds();
      }, 100);

      // Add map click handler
      if (onMapClick) {
        map.on('click', (e: L.LeafletMouseEvent) => {
          console.log('🗺️ Map clicked in MapContainerSimple:', e.latlng);
          console.log('🗺️ Raw Leaflet coordinates:', e.latlng.lat, e.latlng.lng);
          
          const coordinates = {
            latitude: e.latlng.lat,
            longitude: e.latlng.lng
          };
          
          onMapClick(coordinates);
        });
        console.log('🗺️ Map click handler attached');
      } else {
        console.log('🗺️ No onMapClick handler provided');
      }

      console.log('🗺️ ✅ Simple map setup complete!');

    } catch (error) {
      console.error('🗺️ ❌ Error creating map:', error);
    }

    // Cleanup function
    return () => {
      console.log('🗺️ 🧹 CLEANING UP MAP INSTANCE');
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markersRef.current.clear();
    };
  }, []); // Empty dependency array for simplicity

  // Add markers - SIMPLIFIED VERSION
  useEffect(() => {
    console.log('🗺️ Adding markers, sites count:', sites.length);
    
    if (!mapRef.current || sites.length === 0) {
      console.log('🗺️ Skipping markers - no map or no sites');
      return;
    }

    const map = mapRef.current;
    
    try {
      // Clear existing markers
      markersRef.current.forEach(marker => {
        map.removeLayer(marker);
      });
      markersRef.current.clear();

      // Add new markers
      sites.forEach(site => {
        console.log('🗺️ Adding marker for:', site.name);
        
        const marker = L.marker([site.coordinates.latitude, site.coordinates.longitude]);
        marker.bindPopup(site.name);
        
        // Add click handler to marker
        marker.on('click', () => {
          if (onSiteClick) {
            onSiteClick(site);
          }
        });
        
        marker.addTo(map);
        markersRef.current.set(site.id, marker);
      });

      console.log('🗺️ ✅ Markers added successfully');
    } catch (error) {
      console.error('🗺️ ❌ Error adding markers:', error);
    }
  }, [sites]);

  console.log('🗺️ MapContainerSimple rendering div');

  return (
    <div 
      ref={containerRef} 
      className={`map-container-simple ${className}`}
      style={{ 
        width: '100%', 
        height: '100%',
        minHeight: '400px',
        background: '#e0e0e0'
      }}
    />
  );
};