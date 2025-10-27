import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

// Fix for default markers in Leaflet with webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export const MarkerTest: React.FC = () => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    console.log('🧪 Creating test map...');

    // Create map instance
    const map = L.map(containerRef.current, {
      center: [36.1069, -112.1129], // Grand Canyon
      zoom: 10,
      zoomControl: true,
      attributionControl: true,
    });

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map);

    mapRef.current = map;

    // Test 1: Default Leaflet marker
    console.log('🧪 Adding default marker...');
    const defaultMarker = L.marker([36.1069, -112.1129]).addTo(map);
    defaultMarker.bindPopup('Default Leaflet Marker');

    // Test 2: Custom divIcon marker (simple)
    console.log('🧪 Adding simple divIcon marker...');
    const simpleDivIcon = L.divIcon({
      className: 'simple-test-marker',
      html: '<div style="background: red; width: 20px; height: 20px; border-radius: 50%;"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
    const simpleDivMarker = L.marker([36.1069 + 0.01, -112.1129 + 0.01], { icon: simpleDivIcon }).addTo(map);
    simpleDivMarker.bindPopup('Simple DivIcon Marker');

    // Test 3: Complex divIcon marker (like our original)
    console.log('🧪 Adding complex divIcon marker...');
    const complexDivIcon = L.divIcon({
      className: 'complex-test-marker',
      html: `<div style="
        width: 40px;
        height: 40px;
        background-color: blue;
        border: 3px solid yellow;
        border-radius: 50%;
        position: relative;
        z-index: 1000;
      ">
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 10px;
          height: 10px;
          background-color: white;
          border-radius: 50%;
        "></div>
      </div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });
    const complexDivMarker = L.marker([36.1069 - 0.01, -112.1129 - 0.01], { icon: complexDivIcon }).addTo(map);
    complexDivMarker.bindPopup('Complex DivIcon Marker');

    // Test 4: CSS class marker
    console.log('🧪 Adding CSS class marker...');
    const cssIcon = L.divIcon({
      className: 'css-test-marker',
      html: '<div class="marker-inner">CSS</div>',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
    const cssMarker = L.marker([36.1069 + 0.02, -112.1129], { icon: cssIcon }).addTo(map);
    cssMarker.bindPopup('CSS Class Marker');

    console.log('🧪 All test markers added to map');

    // Cleanup function
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '400px', position: 'relative' }}>
      <h2>Marker Visibility Test</h2>
      <div 
        ref={containerRef} 
        style={{ width: '100%', height: '300px', border: '2px solid #ccc' }}
      />
      <div style={{ marginTop: '10px' }}>
        <p>This test adds 4 different types of markers:</p>
        <ul>
          <li>Default Leaflet marker (should be blue)</li>
          <li>Simple red circle divIcon</li>
          <li>Complex blue circle with yellow border</li>
          <li>CSS class marker</li>
        </ul>
      </div>
      
      <style>{`
        .css-test-marker {
          background: green !important;
          border: 2px solid black !important;
          border-radius: 50% !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .marker-inner {
          color: white !important;
          font-weight: bold !important;
          font-size: 12px !important;
        }
      `}</style>
    </div>
  );
};