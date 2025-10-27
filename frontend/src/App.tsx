import { useState } from 'react';
import { InteractiveMap } from './components/Map/InteractiveMap';
import { TestPage } from './pages/TestPage';
import { DEV_CONFIG, shouldShowDebugFeatures } from './config/dev';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState<'main' | 'test'>('main');
  
  // Check if debug features should be shown
  const showDebugFeatures = shouldShowDebugFeatures();

  return (
    <div className="App">
      {/* Simple navigation */}
      <div style={{ 
        padding: '10px', 
        backgroundColor: '#f5f5f5', 
        borderBottom: '1px solid #ddd',
        display: 'flex',
        gap: '10px'
      }}>
        <button 
          onClick={() => setCurrentPage('main')}
          style={{
            padding: '8px 16px',
            backgroundColor: currentPage === 'main' ? '#007bff' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Main Map
        </button>
        
        {/* Only show Marker Test button if debug features are enabled */}
        {showDebugFeatures && DEV_CONFIG.SHOW_MARKER_TEST && (
          <button 
            onClick={() => setCurrentPage('test')}
            style={{
              padding: '8px 16px',
              backgroundColor: currentPage === 'test' ? '#007bff' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Marker Test
          </button>
        )}
      </div>

      {/* Page content */}
      <div style={{ display: currentPage === 'main' ? 'block' : 'none' }}>
        <InteractiveMap 
          showAttribution={true}
          className="main-map-container"
          initialCenter={{ latitude: 36.1069, longitude: -112.1129 }} // Grand Canyon
          initialZoom={8}
        />
      </div>
      
      {/* Only render test page if debug features are enabled */}
      {showDebugFeatures && DEV_CONFIG.SHOW_MARKER_TEST && (
        <div style={{ display: currentPage === 'test' ? 'block' : 'none' }}>
          <TestPage />
        </div>
      )}
    </div>
  );
}

export default App;