import React from 'react';
import { PaleoSite } from '../types';

interface SiteMarkerProps {
  site: PaleoSite;
  onSelect: (siteId: string) => void;
  isSelected?: boolean;
}

export const SiteMarker: React.FC<SiteMarkerProps> = ({
  site: _site,
  onSelect: _onSelect,
  isSelected: _isSelected,
}) => {
  return (
    <div>
      {/* TODO: Implement Leaflet marker component for paleontological sites */}
      <p>SiteMarker Component - To be implemented</p>
    </div>
  );
};