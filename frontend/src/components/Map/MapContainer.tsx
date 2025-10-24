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
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const isUserInteractionRef = useRef(false);

  // Create site icon
  const createSiteIcon = useCallback((isSelected: boolean = false) => {
    return L.divIcon({
      className: `paleo-marker ${isSelected ? 'selected' : ''}`,
      html: `<div style="
        width: 50px;
        height: 50px;
        background-color: red;
        border: 5px solid yellow;
        border-radius: 50%;
        box-shadow: 0 10px 20px rgba(255,0,0,0.8);
        position: relative;
        z-index: 9999;
      ">
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 20px;
          height: 20px;
          background-color: white;
          border-radius: 50%;
        "></div>
      </div>`,
      iconSize: [60, 60],
      iconAnchor: [30, 30],
      popupAnchor: [0, -30],
    });
  }, []);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Create map instance
    const map = L.map(containerRef.current, {
      center: [mapView.center.latitude, mapView.center.longitude],
      zoom: mapView.zoom,
      zoomControl: true,
      attributionControl: true,
    });

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map);

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

    // Cleanup function
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [onMapViewChange, onMapClick, onMapMoveStart, onMapMoveEnd]);

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
    if (!mapRef.current) return;

    console.log('🗺️ MapContainer updating markers:', sites.length, 'sites');
    console.log('Sites to render:', sites.map(s => ({ id: s.id, name: s.name, coords: s.coordinates })));

    const map = mapRef.current;
    const currentMarkers = markersRef.current;

    // Remove markers that are no longer in the sites array
    for (const [siteId, marker] of currentMarkers.entries()) {
      if (!sites.find(site => site.id === siteId)) {
        map.removeLayer(marker);
        currentMarkers.delete(siteId);
      }
    }

    // Add or update markers for current sites
    sites.forEach(site => {
      const isSelected = site.id === selectedSiteId;
      
      if (currentMarkers.has(site.id)) {
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
        // Create new marker
        const marker = L.marker(
          [site.coordinates.latitude, site.coordinates.longitude],
          { icon: createSiteIcon(isSelected) }
        );

        // Add click handler
        marker.on('click', () => {
          console.log('🔴 Site marker clicked:', site.name, site.id);
          onSiteClick?.(site);
        });

        // Add tooltip
        marker.bindTooltip(site.name, {
          permanent: false,
          direction: 'top',
          offset: [0, -10],
        });

        marker.addTo(map);
        currentMarkers.set(site.id, marker);
      }
    });
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
    <div 
      ref={containerRef} 
      className={`map-container ${className}`}
      style={{ width: '100%', height: '100%' }}
    />
  );
};