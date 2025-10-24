import React, { useState, useCallback } from 'react';
import { PaleoSite } from '../../types';
import { SiteInfo } from './SiteInfo';
import './SidePanel.css';

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSite: PaleoSite | null;
  searchResults: PaleoSite[];
  isLoading?: boolean;
  error?: string | null;
  onSiteSelect?: (site: PaleoSite) => void;
  onSourceClick?: (source: string) => void;
}

export const SidePanel: React.FC<SidePanelProps> = ({
  isOpen,
  onClose,
  selectedSite,
  searchResults,
  isLoading = false,
  error = null,
  onSiteSelect,
  onSourceClick,
}) => {
  console.log('📋 SidePanel render:', { isOpen, selectedSite: selectedSite?.name, searchResultsCount: searchResults.length });
  
  const [activeTab, setActiveTab] = useState<'details' | 'search'>('details');

  const handleSiteSelect = useCallback((site: PaleoSite) => {
    onSiteSelect?.(site);
    setActiveTab('details'); // Switch to details tab when site is selected
  }, [onSiteSelect]);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  const renderSearchResults = () => {
    if (isLoading) {
      return (
        <div className="search-loading">
          <div className="loading-spinner"></div>
          <p>Searching for paleontological sites...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="search-error">
          <div className="error-icon">⚠️</div>
          <p>Error loading search results:</p>
          <p className="error-message">{error}</p>
        </div>
      );
    }

    if (searchResults.length === 0) {
      return (
        <div className="no-results">
          <div className="no-results-icon">🔍</div>
          <p>No paleontological sites found in this area.</p>
          <p className="no-results-hint">Try zooming out or moving the map to explore other regions.</p>
        </div>
      );
    }

    return (
      <div className="search-results">
        <div className="results-header">
          <h3>Sites in Current View</h3>
          <span className="results-count">{searchResults.length} sites found</span>
        </div>
        <div className="results-list">
          {searchResults.map((site) => (
            <div
              key={site.id}
              className={`result-item ${selectedSite?.id === site.id ? 'selected' : ''}`}
              onClick={() => handleSiteSelect(site)}
            >
              <div className="result-header">
                <h4 className="site-name">{site.name}</h4>
                {site.coordinates && (
                  <span className="coordinates">
                    {site.coordinates.latitude.toFixed(4)}, {site.coordinates.longitude.toFixed(4)}
                  </span>
                )}
              </div>
              
              <div className="result-details">
                {site.formation && (
                  <div className="detail-item">
                    <span className="label">Formation:</span>
                    <span className="value">{site.formation}</span>
                  </div>
                )}
                {site.age && (
                  <div className="detail-item">
                    <span className="label">Age:</span>
                    <span className="value">{site.age}</span>
                  </div>
                )}
                {site.description && (
                  <div className="result-description">
                    {site.description.length > 120 
                      ? `${site.description.substring(0, 120)}...`
                      : site.description
                    }
                  </div>
                )}
              </div>


            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (activeTab === 'details') {
      if (!selectedSite) {
        return (
          <div className="no-selection">
            <div className="no-selection-icon">📍</div>
            <h3>No Site Selected</h3>
            <p>Click on a marker on the map or select a site from the search results to view detailed information.</p>
            <button 
              className="switch-tab-button"
              onClick={() => setActiveTab('search')}
            >
              View Search Results
            </button>
          </div>
        );
      }

      return (
        <SiteInfo 
          site={selectedSite}
          onSourceClick={onSourceClick}
        />
      );
    }

    return renderSearchResults();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="side-panel-overlay" onClick={handleOverlayClick}>
      <div className="side-panel">
        <div className="panel-header">
          <div className="tab-buttons">
            <button
              className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
              onClick={() => setActiveTab('details')}
            >
              <span className="tab-icon">📋</span>
              Site Details
              {selectedSite && <span className="tab-indicator">●</span>}
            </button>
            <button
              className={`tab-button ${activeTab === 'search' ? 'active' : ''}`}
              onClick={() => setActiveTab('search')}
            >
              <span className="tab-icon">🔍</span>
              Search Results
              {searchResults.length > 0 && (
                <span className="tab-badge">{searchResults.length}</span>
              )}
            </button>
          </div>
          <button className="close-button" onClick={onClose} aria-label="Close panel">
            ✕
          </button>
        </div>

        <div className="panel-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};