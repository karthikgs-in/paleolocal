import React from 'react';
import { Coordinates } from '../../types';
import './BoundingBoxDisplay.css';

interface BoundingBoxDisplayProps {
  bounds?: {
    northeast: Coordinates;
    southwest: Coordinates;
  };
  center?: Coordinates;
  zoom: number;
  visible?: boolean;
}

export const BoundingBoxDisplay: React.FC<BoundingBoxDisplayProps> = ({
  bounds,
  center,
  zoom,
  visible = true,
}) => {
  const [lastUpdate, setLastUpdate] = React.useState<Date>(new Date());

  // Update timestamp when bounds change
  React.useEffect(() => {
    if (bounds) {
      setLastUpdate(new Date());
    }
  }, [bounds]);

  if (!visible || !bounds) {
    return null;
  }

  const formatCoordinate = (coord: number): string => {
    return coord.toFixed(6);
  };

  return (
    <div className="bounding-box-display">
      <div className="bounding-box-header">
        <h3>🗺️ Map View</h3>
        <div className="zoom-level">Zoom: {zoom}</div>
      </div>
      
      <div className="coordinates-section">
        <div className="coordinate-group">
          <h4>📍 Current Center</h4>
          <div className="coordinate-row">
            <span className="label">Lat:</span>
            <span className="value">{center ? formatCoordinate(center.latitude) : 'N/A'}</span>
          </div>
          <div className="coordinate-row">
            <span className="label">Lng:</span>
            <span className="value">{center ? formatCoordinate(center.longitude) : 'N/A'}</span>
          </div>
        </div>

        <div className="coordinate-group">
          <h4>📦 Bounding Box</h4>
          <div className="coordinate-row">
            <span className="label">North:</span>
            <span className="value">{formatCoordinate(bounds.northeast.latitude)}</span>
          </div>
          <div className="coordinate-row">
            <span className="label">South:</span>
            <span className="value">{formatCoordinate(bounds.southwest.latitude)}</span>
          </div>
          <div className="coordinate-row">
            <span className="label">East:</span>
            <span className="value">{formatCoordinate(bounds.northeast.longitude)}</span>
          </div>
          <div className="coordinate-row">
            <span className="label">West:</span>
            <span className="value">{formatCoordinate(bounds.southwest.longitude)}</span>
          </div>
        </div>
      </div>

      <div className="actions-section">
        <button 
          className="copy-bounds-btn"
          onClick={() => {
            const boundsText = `Center: ${center ? formatCoordinate(center.latitude) : 'N/A'}, ${center ? formatCoordinate(center.longitude) : 'N/A'}\nNortheast: ${formatCoordinate(bounds.northeast.latitude)}, ${formatCoordinate(bounds.northeast.longitude)}\nSouthwest: ${formatCoordinate(bounds.southwest.latitude)}, ${formatCoordinate(bounds.southwest.longitude)}`;
            navigator.clipboard.writeText(boundsText);
            alert('Map coordinates copied to clipboard!');
          }}
        >
          📋 Copy
        </button>
      </div>
    </div>
  );
};