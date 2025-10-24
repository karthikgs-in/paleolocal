import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { PaleoSite } from '../../types';

interface SiteMarkerProps {
  site: PaleoSite;
  map: L.Map;
  isSelected?: boolean;
  onClick?: (site: PaleoSite) => void;
  onTooltipOpen?: (site: PaleoSite) => void;
  onTooltipClose?: (site: PaleoSite) => void;
}

export const SiteMarker: React.FC<SiteMarkerProps> = ({
  site,
  map,
  isSelected = false,
  onClick,
  onTooltipOpen,
  onTooltipClose,
}) => {
  const markerRef = useRef<L.Marker | null>(null);

  // Create custom icon for paleontological sites
  const createSiteIcon = (selected: boolean = false) => {
    return L.divIcon({
      className: `paleo-marker ${selected ? 'selected' : ''}`,
      html: `
        <div style="
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
        </div>
      `,
      iconSize: [60, 60],
      iconAnchor: [30, 30],
      popupAnchor: [0, -30],
    });
  };

  // Initialize marker
  useEffect(() => {
    if (markerRef.current || !map) return;

    const marker = L.marker(
      [site.coordinates.latitude, site.coordinates.longitude],
      { 
        icon: createSiteIcon(isSelected),
        title: site.name,
      }
    );

    // Add click handler
    marker.on('click', () => {
      onClick?.(site);
    });

    // Add tooltip
    marker.bindTooltip(
      `<div style="font-weight: 500; margin-bottom: 4px;">${site.name}</div>
       ${site.formation ? `<div style="font-size: 12px; color: #666;">Formation: ${site.formation}</div>` : ''}
       ${site.age ? `<div style="font-size: 12px; color: #666;">Age: ${site.age}</div>` : ''}`,
      {
        permanent: false,
        direction: 'top',
        offset: [0, -10],
        className: 'site-tooltip',
      }
    );

    // Tooltip event handlers
    marker.on('tooltipopen', () => {
      onTooltipOpen?.(site);
    });

    marker.on('tooltipclose', () => {
      onTooltipClose?.(site);
    });

    // Add hover effects
    marker.on('mouseover', () => {
      if (!isSelected) {
        marker.setIcon(createSiteIcon(false));
        const markerElement = marker.getElement();
        if (markerElement) {
          markerElement.style.transform = 'scale(1.1)';
        }
      }
    });

    marker.on('mouseout', () => {
      if (!isSelected) {
        const markerElement = marker.getElement();
        if (markerElement) {
          markerElement.style.transform = 'scale(1.0)';
        }
      }
    });

    marker.addTo(map);
    markerRef.current = marker;

    return () => {
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }
    };
  }, [map, site, onClick, onTooltipOpen, onTooltipClose]);

  // Update marker when selection state changes
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setIcon(createSiteIcon(isSelected));
      
      // Update tooltip content to reflect selection state
      const tooltipContent = `
        <div style="font-weight: 500; margin-bottom: 4px;">${site.name}</div>
        ${site.formation ? `<div style="font-size: 12px; color: #666;">Formation: ${site.formation}</div>` : ''}
        ${site.age ? `<div style="font-size: 12px; color: #666;">Age: ${site.age}</div>` : ''}
        ${isSelected ? '<div style="font-size: 11px; color: #f39c12; margin-top: 4px;">● Selected</div>' : ''}
      `;
      
      markerRef.current.setTooltipContent(tooltipContent);
    }
  }, [isSelected, site]);

  // Update marker position if site coordinates change
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLatLng([site.coordinates.latitude, site.coordinates.longitude]);
    }
  }, [site.coordinates]);

  return null; // This component doesn't render anything directly
};

// Additional CSS for tooltip styling (would typically be in a separate .css file)
const tooltipStyles = `
.site-tooltip {
  background: rgba(0, 0, 0, 0.8) !important;
  border: none !important;
  border-radius: 6px !important;
  color: white !important;
  font-size: 12px !important;
  padding: 8px 10px !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2) !important;
}

.site-tooltip:before {
  border-top-color: rgba(0, 0, 0, 0.8) !important;
}

.paleo-marker {
  transition: all 0.2s ease;
}

.paleo-marker:hover {
  z-index: 1000;
}

.paleo-marker.selected {
  z-index: 1001;
}
`;

// Inject styles if they don't exist
if (typeof document !== 'undefined' && !document.getElementById('site-marker-styles')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'site-marker-styles';
  styleElement.textContent = tooltipStyles;
  document.head.appendChild(styleElement);
}