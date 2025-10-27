import { useState } from 'react';
import { InteractiveMap } from './components/Map/InteractiveMap';
import { TestPage } from './pages/TestPage';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState<'main' | 'test'>('main');

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
      
      <div style={{ display: currentPage === 'test' ? 'block' : 'none' }}>
        <TestPage />
      </div>
    </div>
  );
}

export default App;