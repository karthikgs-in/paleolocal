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
}

const MapContainerSimple: React.FC<MapContainerSimpleProps> = ({
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

  // Initialize map - SIMPLIFIED VERSION
  useEffect(() => {
    
    if (!containerRef.current || mapRef.current) {
      return;
    }

    try {
      // Create map instance
      const map = L.map(containerRef.current, {
        center: [mapView.center.latitude, mapView.center.longitude],
        zoom: mapView.zoom,
        zoomControl: true,
        attributionControl: true,
      });

      // Add OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map);

      mapRef.current = map;

      // Add map click handler
      if (onMapClick) {
        map.on('click', (e: L.LeafletMouseEvent) => {
          const coordinates = {
            latitude: e.latlng.lat,
            longitude: e.latlng.lng
          };
          
          onMapClick(coordinates);
        });
      }

    } catch (error) {
      console.error('Error creating map:', error);
    }

    // Cleanup function
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markersRef.current.clear();
    };
  }, []); // Empty dependency array for simplicity

  // Add markers - SIMPLIFIED VERSION
  useEffect(() => {
    
    if (!mapRef.current || sites.length === 0) {
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

    } catch (error) {
      console.error('Error adding markers:', error);
    }
  }, [sites]);

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

export { MapContainerSimple };