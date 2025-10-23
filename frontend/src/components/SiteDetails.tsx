import React from 'react';
import { PaleoSite } from '../types';

interface SiteDetailsProps {
  site: PaleoSite;
  onClose: () => void;
}

export const SiteDetails: React.FC<SiteDetailsProps> = ({
  site: _site,
  onClose: _onClose,
}) => {
  return (
    <div style={{ padding: '1rem' }}>
      <p>SiteDetails Component - To be implemented</p>
      {/* TODO: Implement detailed site information display */}
    </div>
  );
};