import React, { useState } from 'react';
import { PaleoSite, Coordinates } from '../../types';
import { MapContainerSimple as MapContainer } from './MapContainerSimple';
import './InteractiveMap.css';

interface InteractiveMapProps {
  className?: string;
  initialCenter?: Coordinates;
  initialZoom?: number;
  showAttribution?: boolean;
}

export const InteractiveMapSimple: React.FC<InteractiveMapProps> = ({
  className = '',
  initialCenter,
  initialZoom = 6,
  showAttribution = true,
}) => {
  const [selectedSite, setSelectedSite] = useState<PaleoSite | null>(null);

  console.log('🗺️ InteractiveMapSimple rendering');

  // Mock data for testing
  const searchResults: PaleoSite[] = [
    {
      id: 'test-1',
      name: 'Test Site 1',
      coordinates: { latitude: 36.1069, longitude: -112.1129 },
      description: 'Test site 1'
    },
    {
      id: 'test-2', 
      name: 'Test Site 2',
      coordinates: { latitude: 36.2069, longitude: -112.2129 },
      description: 'Test site 2'
    }
  ];

  // Simple map view state
  const mapView = {
    center: initialCenter || { latitude: 36.1069, longitude: -112.1129 },
    zoom: initialZoom
  };

  const handleSiteClick = (site: PaleoSite) => {
    console.log('🔴 Site clicked:', site.name);
    setSelectedSite(site);
  };

  const handleMapClick = (coordinates: Coordinates) => {
    console.log('🗺️ Map clicked at:', coordinates);
    setSelectedSite(null);
  };

  return (
    <div className={`interactive-map ${className}`}>
      <div className="map-wrapper">
        <MapContainer
          mapView={mapView}
          sites={searchResults}
          selectedSiteId={selectedSite?.id}
          onSiteClick={handleSiteClick}
          onMapClick={handleMapClick}
          className="main-map"
        />
      </div>

      {/* Simple debug panel */}
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
        <div>Simple Map Test</div>
        <div>Selected Site: {selectedSite?.name || 'None'}</div>
        <div>Sites Count: {searchResults.length}</div>
      </div>
    </div>
  );
};