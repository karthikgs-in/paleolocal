# Quickstart Guide: Interactive Map UI

**Feature**: Interactive Map UI  
**Created**: 2025-10-23  
**Phase**: 1 - Development Setup & Quick Start

## Prerequisites

### System Requirements
- **Node.js**: 18.0+ (LTS recommended)
- **npm**: 9.0+ or **yarn**: 3.0+
- **Git**: 2.30+
- **Modern Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### Backend Setup
Ensure the PaleoLocal backend is running:

```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Set environment variables
export GOOGLE_API_KEY="your_gemini_api_key_here"

# Start the FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Verify backend is running at `http://localhost:8000` and APIs are accessible:
- `GET http://localhost:8000/api/search?lat=40.7128&lon=-74.0060&radius_km=25`
- `GET http://localhost:8000/`

## Frontend Setup

### 1. Initialize Frontend Project

```bash
# Create frontend directory
mkdir frontend
cd frontend

# Initialize React project with Vite
npm create vite@latest . -- --template react-ts

# Install core dependencies
npm install react@^18.2.0 react-dom@^18.2.0

# Install mapping dependencies
npm install leaflet@^1.9.0 react-leaflet@^4.2.0

# Install API and utility dependencies
npm install axios@^1.5.0

# Install type definitions
npm install -D @types/leaflet@^1.9.0

# Install development and testing dependencies
npm install -D @vitejs/plugin-react@^4.0.0 jest@^29.5.0 @testing-library/react@^13.4.0 @testing-library/jest-dom@^5.16.0 @testing-library/user-event@^14.4.0
```

### 2. Project Structure Setup

```bash
# Create source directories
mkdir -p src/{components/{Map,SiteDetail,Common},services,hooks,types,utils}
mkdir -p src/components/{Map,SiteDetail,Common}
mkdir -p tests/{components,services,hooks,utils}

# Create core files
touch src/components/Map/{MapContainer,SiteMarker,MapControls}.tsx
touch src/components/SiteDetail/{SidePanel,SiteInfo,SourceAttribution}.tsx
touch src/components/Common/{ErrorMessage,LoadingSpinner,RadiusDropdown}.tsx
touch src/services/{api,geolocation,mapService}.ts
touch src/hooks/{useGeolocation,useSiteData,useMapState}.ts
touch src/types/{site,map,ui,api,index}.ts
touch src/utils/{coordinates,validation,errorHandling}.ts
```

### 3. Environment Configuration

```bash
# Create environment file
cat > .env.local << EOF
VITE_API_BASE_URL=http://localhost:8000
VITE_DEFAULT_MAP_CENTER_LAT=40.7128
VITE_DEFAULT_MAP_CENTER_LON=-74.0060
VITE_DEFAULT_ZOOM_LEVEL=10
VITE_DEFAULT_SEARCH_RADIUS=50
EOF
```

### 4. Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
```

### 5. TypeScript Configuration

```json
// tsconfig.json (update extends and compilerOptions)
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## Core Implementation

### 1. Type Definitions

```typescript
// src/types/site.ts
export interface Site {
  id: string;
  name: string;
  lat: number;
  lon: number;
  known_type: string;
  short_summary?: string;
}

export interface SiteDetail {
  place: {
    id: string;
    name: string;
    lat: number;
    lon: number;
    known_type: string;
    seed_url?: string;
    [key: string]: any;
  };
  generated?: {
    summary?: string;
    sources?: string[];
    ts?: number;
  };
}
```

```typescript
// src/types/map.ts
export interface MapView {
  center: { lat: number; lon: number };
  zoom: number;
  radius: number;
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export interface SearchParameters {
  lat: number;
  lon: number;
  radius_km: number;
}
```

### 2. API Service

```typescript
// src/services/api.ts
import axios from 'axios';
import { Site, SiteDetail } from '@/types/site';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const searchSites = async (
  lat: number,
  lon: number,
  radius_km: number = 50
): Promise<Site[]> => {
  const response = await apiClient.get('/api/search', {
    params: { lat, lon, radius_km }
  });
  return response.data;
};

export const getSiteDetail = async (place_id: string): Promise<SiteDetail> => {
  const response = await apiClient.get(`/api/place/${place_id}`);
  return response.data;
};
```

### 3. Basic Map Component

```tsx
// src/components/Map/MapContainer.tsx
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import { Site } from '@/types/site';
import { searchSites } from '@/services/api';
import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER: LatLngExpression = [
  parseFloat(import.meta.env.VITE_DEFAULT_MAP_CENTER_LAT) || 40.7128,
  parseFloat(import.meta.env.VITE_DEFAULT_MAP_CENTER_LON) || -74.0060
];

export const MapView: React.FC = () => {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadSites = async () => {
      setLoading(true);
      try {
        const siteData = await searchSites(
          DEFAULT_CENTER[0] as number,
          DEFAULT_CENTER[1] as number,
          50
        );
        setSites(siteData);
      } catch (error) {
        console.error('Failed to load sites:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSites();
  }, []);

  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={10}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {sites.map((site) => (
          <Marker key={site.id} position={[site.lat, site.lon]}>
            <Popup>
              <div>
                <h3>{site.name}</h3>
                <p><strong>Type:</strong> {site.known_type}</p>
                {site.short_summary && <p>{site.short_summary}</p>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
```

### 4. Main App Component

```tsx
// src/App.tsx
import React from 'react';
import { MapView } from './components/Map/MapContainer';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>PaleoLocal - Interactive Map</h1>
      </header>
      <main>
        <MapView />
      </main>
    </div>
  );
}

export default App;
```

### 5. Basic Styling

```css
/* src/App.css */
.App {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.App-header {
  background-color: #282c34;
  padding: 1rem;
  color: white;
  text-align: center;
}

.App-header h1 {
  margin: 0;
  font-size: 1.5rem;
}

main {
  flex: 1;
  overflow: hidden;
}

/* Leaflet marker icon fix */
.leaflet-marker-icon {
  margin-left: -12px !important;
  margin-top: -41px !important;
}
```

## Development Workflow

### 1. Start Development

```bash
# Terminal 1: Start backend (if not already running)
cd backend
uvicorn app.main:app --reload

# Terminal 2: Start frontend
cd frontend
npm run dev
```

Access the application at `http://localhost:3000`

### 2. Testing Setup

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

### 3. Build for Production

```bash
# Build the application
npm run build

# Preview the production build
npm run preview
```

## Troubleshooting

### Common Issues

1. **Leaflet markers not displaying**:
   ```bash
   # Install leaflet marker icon fix
   npm install leaflet-defaulticon-compatibility
   ```

2. **CORS errors during development**:
   - Ensure backend CORS settings allow `http://localhost:3000`
   - Verify Vite proxy configuration in `vite.config.ts`

3. **API connection failures**:
   - Check backend is running on correct port
   - Verify `VITE_API_BASE_URL` in `.env.local`
   - Test API endpoints directly in browser

4. **TypeScript errors**:
   - Ensure all dependencies have proper type definitions
   - Check `tsconfig.json` configuration
   - Run `npm install` to install missing types

### Debugging

```bash
# Enable verbose logging
export DEBUG=true

# Check bundle analysis
npm run build -- --analyze

# Lint code
npm run lint

# Format code
npm run format
```

## Next Steps

After completing this quickstart setup:

1. **Implement geolocation support** using `useGeolocation` hook
2. **Add side panel for site details** with `SidePanel` component
3. **Implement radius dropdown control** with `RadiusDropdown` component
4. **Add error handling and loading states** with dedicated components
5. **Write comprehensive tests** for all components and services

The basic map interface will be functional with site markers, providing a foundation for implementing the complete feature specification.

## Performance Optimization

### Development Tips
- Use React DevTools Profiler for component performance
- Monitor network requests in browser DevTools
- Test on various devices and connection speeds
- Implement lazy loading for non-critical components

### Production Optimization
- Enable gzip compression on server
- Implement service worker for offline capabilities
- Use CDN for static assets
- Monitor bundle size and code splitting effectiveness

This quickstart guide provides everything needed to begin development on the Interactive Map UI feature with a solid foundation for the complete implementation.