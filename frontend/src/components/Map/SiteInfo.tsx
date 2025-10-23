import React from 'react';
import { PaleoSite } from '../../types';
import './SiteInfo.css';

interface SiteInfoProps {
  site: PaleoSite;
  onSourceClick?: (source: string) => void;
}

export const SiteInfo: React.FC<SiteInfoProps> = ({
  site,
  onSourceClick,
}) => {
  const handleSourceClick = (source: string) => {
    onSourceClick?.(source);
  };

  const formatAccessibility = (accessibility?: string) => {
    if (!accessibility) return 'Unknown';
    
    switch (accessibility) {
      case 'public':
        return '🟢 Public Access';
      case 'restricted':
        return '🟡 Restricted Access';
      case 'private':
        return '🔴 Private Property';
      default:
        return accessibility;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatCoordinates = (lat: number, lng: number) => {
    const latDir = lat >= 0 ? 'N' : 'S';
    const lngDir = lng >= 0 ? 'E' : 'W';
    
    return `${Math.abs(lat).toFixed(6)}°${latDir}, ${Math.abs(lng).toFixed(6)}°${lngDir}`;
  };

  return (
    <div className="site-info">
      <div className="site-header">
        <h2 className="site-title">{site.name}</h2>
        {site.coordinates && (
          <div className="coordinates-display">
            📍 {formatCoordinates(site.coordinates.latitude, site.coordinates.longitude)}
          </div>
        )}
      </div>

      <div className="site-details">
        {site.description && (
          <div className="detail-section">
            <h3>Description</h3>
            <p className="description">{site.description}</p>
          </div>
        )}

        <div className="detail-grid">
          {site.formation && (
            <div className="detail-item">
              <span className="label">Formation</span>
              <span className="value">{site.formation}</span>
            </div>
          )}

          {site.age && (
            <div className="detail-item">
              <span className="label">Age</span>
              <span className="value">{site.age}</span>
            </div>
          )}

          {site.period && (
            <div className="detail-item">
              <span className="label">Period</span>
              <span className="value">{site.period}</span>
            </div>
          )}

          {site.accessibility && (
            <div className="detail-item">
              <span className="label">Access</span>
              <span className="value accessibility">
                {formatAccessibility(site.accessibility)}
              </span>
            </div>
          )}
        </div>

        {site.significance && (
          <div className="detail-section">
            <h3>Significance</h3>
            <p className="significance">{site.significance}</p>
          </div>
        )}

        <div className="metadata">
          <div className="detail-item">
            <span className="label">Site ID</span>
            <span className="value code">{site.id}</span>
          </div>

          {site.lastUpdated && (
            <div className="detail-item">
              <span className="label">Last Updated</span>
              <span className="value">{formatDate(site.lastUpdated)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="action-buttons">
        <button 
          className="action-button primary"
          onClick={() => {
            const url = `https://www.google.com/maps/search/?api=1&query=${site.coordinates.latitude},${site.coordinates.longitude}`;
            window.open(url, '_blank');
          }}
        >
          🗺️ View in Google Maps
        </button>

        <button 
          className="action-button secondary"
          onClick={() => {
            const text = `${site.name}\nCoordinates: ${formatCoordinates(site.coordinates.latitude, site.coordinates.longitude)}\n${site.description || ''}`;
            navigator.clipboard.writeText(text).then(() => {
              // Could show a toast notification here
            });
          }}
        >
          📋 Copy Site Info
        </button>

        {onSourceClick && (
          <button 
            className="action-button secondary"
            onClick={() => handleSourceClick(site.id)}
          >
            🔍 View Source Data
          </button>
        )}
      </div>
    </div>
  );
};