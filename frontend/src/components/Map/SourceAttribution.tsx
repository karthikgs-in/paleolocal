import React from 'react';
import './SourceAttribution.css';

interface SourceAttributionProps {
  className?: string;
  showDetailed?: boolean;
}

export const SourceAttribution: React.FC<SourceAttributionProps> = ({ 
  className = '',
  showDetailed = false 
}) => {
  const handleLinkClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (showDetailed) {
    return (
      <div className={`source-attribution detailed ${className}`}>
        <div className="attribution-header">
          <h3>Data Sources & Attributions</h3>
        </div>
        
        <div className="attribution-sections">
          <div className="attribution-section">
            <h4>🗺️ Map Data</h4>
            <ul>
              <li>
                <strong>OpenStreetMap:</strong> Map tiles and geographic data
                <br />
                <button 
                  className="link-button"
                  onClick={() => handleLinkClick('https://www.openstreetmap.org/copyright')}
                >
                  © OpenStreetMap Contributors
                </button>
              </li>
              <li>
                <strong>Leaflet:</strong> Interactive mapping library
                <br />
                <button 
                  className="link-button"
                  onClick={() => handleLinkClick('https://leafletjs.com/')}
                >
                  leafletjs.com
                </button>
              </li>
            </ul>
          </div>

          <div className="attribution-section">
            <h4>🦕 Paleontological Data</h4>
            <ul>
              <li>
                <strong>Paleobiology Database (PBDB):</strong> Primary source for fossil site locations and formations
                <br />
                <button 
                  className="link-button"
                  onClick={() => handleLinkClick('https://paleobiodb.org/')}
                >
                  paleobiodb.org
                </button>
              </li>
              <li>
                <strong>Fossilworks:</strong> Geological and paleontological reference data
                <br />
                <button 
                  className="link-button"
                  onClick={() => handleLinkClick('http://fossilworks.org/')}
                >
                  fossilworks.org
                </button>
              </li>
              <li>
                <strong>USGS Paleontology Database:</strong> US geological survey paleontological collections
                <br />
                <button 
                  className="link-button"
                  onClick={() => handleLinkClick('https://www.usgs.gov/centers/gecsc/science/paleontology')}
                >
                  USGS Paleontology
                </button>
              </li>
            </ul>
          </div>

          <div className="attribution-section">
            <h4>📖 Additional Resources</h4>
            <ul>
              <li>
                <strong>Museum Collections:</strong> Data aggregated from various natural history museums
              </li>
              <li>
                <strong>Academic Publications:</strong> Peer-reviewed research papers and geological surveys
              </li>
              <li>
                <strong>Field Research:</strong> Community-contributed site documentation and verification
              </li>
            </ul>
          </div>
        </div>

        <div className="attribution-footer">
          <p className="disclaimer">
            <strong>Disclaimer:</strong> Site locations are approximate and for educational purposes. 
            Always obtain proper permissions before visiting any paleontological sites. 
            Many sites are on private property or within protected areas.
          </p>
          
          <p className="update-info">
            Data is periodically updated from source databases. 
            Last synchronization: <span className="timestamp">Loading...</span>
          </p>
        </div>
      </div>
    );
  }

  // Compact attribution for map overlay
  return (
    <div className={`source-attribution compact ${className}`}>
      <div className="attribution-line">
        <span>Map data: </span>
        <button 
          className="link-button"
          onClick={() => handleLinkClick('https://www.openstreetmap.org/copyright')}
        >
          © OpenStreetMap
        </button>
        <span> | Fossil data: </span>
        <button 
          className="link-button"
          onClick={() => handleLinkClick('https://paleobiodb.org/')}
        >
          PBDB
        </button>
        <span>, </span>
        <button 
          className="link-button"
          onClick={() => handleLinkClick('http://fossilworks.org/')}
        >
          Fossilworks
        </button>
      </div>
    </div>
  );
};