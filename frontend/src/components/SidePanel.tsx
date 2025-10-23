import React from 'react';
import { SidePanelState, PaleoSite, LoadingState, ApiError } from '../types';

interface SidePanelProps {
  sidePanel: SidePanelState;
  searchResults: PaleoSite[];
  loading: LoadingState;
  error: ApiError | null;
  onClose: () => void;
  onSiteSelect: (siteId: string) => void;
  onErrorDismiss: () => void;
}

export const SidePanel: React.FC<SidePanelProps> = ({
  sidePanel,
  searchResults: _searchResults,
  loading: _loading,
  error: _error,
  onClose,
  onSiteSelect: _onSiteSelect,
  onErrorDismiss: _onErrorDismiss,
}) => {
  if (!sidePanel.isOpen) {
    return null;
  }

  return (
    <div style={{ 
      width: '400px', 
      height: '100%', 
      background: 'white', 
      borderLeft: '1px solid #ddd',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column'
    }}>
      <button onClick={onClose} style={{ marginBottom: '1rem' }}>Close Panel</button>
      <p>SidePanel Component - To be implemented</p>
      {/* TODO: Implement side panel content */}
    </div>
  );
};