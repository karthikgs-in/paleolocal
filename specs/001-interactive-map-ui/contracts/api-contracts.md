# API Contracts: Interactive Map UI

**Feature**: Interactive Map UI  
**Created**: 2025-10-23  
**Phase**: 1 - API Contract Specifications

## Overview

This document defines the API contracts for the Interactive Map UI feature. The frontend will consume existing PaleoLocal backend APIs without modification.

## Existing API Endpoints

### GET /api/search

Search for paleontological sites within a specified radius.

**Request Parameters**:
```typescript
interface SearchRequest {
  lat: number;      // Required: Center latitude (-90 to 90)
  lon: number;      // Required: Center longitude (-180 to 180)  
  radius_km: number; // Optional: Search radius in km (default: 50.0)
}
```

**Example Request**:
```http
GET /api/search?lat=40.7128&lon=-74.0060&radius_km=25
```

**Response**:
```typescript
interface SearchResponse {
  sites: Array<{
    id: string;           // Unique site identifier
    name: string;         // Site display name
    lat: number;          // Site latitude
    lon: number;          // Site longitude
    known_type: string;   // Site classification
    short_summary?: string; // Brief summary if available
  }>;
}
```

**Example Response**:
```json
{
  "sites": [
    {
      "id": "site_001",
      "name": "Morrison Formation Site",
      "lat": 40.7589,
      "lon": -73.9851,
      "known_type": "Jurassic fossil site",
      "short_summary": "Rich deposits of dinosaur fossils"
    }
  ]
}
```

**Error Responses**:
- `400 Bad Request`: Invalid parameters
- `500 Internal Server Error`: Server error

### GET /api/place/{place_id}

Retrieve detailed information for a specific site.

**Path Parameters**:
```typescript
interface PlaceRequest {
  place_id: string; // Required: Site identifier from search results
}
```

**Example Request**:
```http
GET /api/place/site_001
```

**Response**:
```typescript
interface PlaceResponse {
  place: {
    id: string;           // Site identifier
    name: string;         // Site name
    lat: number;          // Latitude
    lon: number;          // Longitude
    known_type: string;   // Site type
    seed_url?: string;    // Original data source
    [key: string]: any;   // Additional metadata
  };
  generated?: {
    summary?: string;     // AI-generated summary
    sources?: string[];   // Source URLs
    ts?: number;          // Generation timestamp
  };
}
```

**Example Response**:
```json
{
  "place": {
    "id": "site_001",
    "name": "Morrison Formation Site",
    "lat": 40.7589,
    "lon": -73.9851,
    "known_type": "Jurassic fossil site",
    "seed_url": "https://example.com/morrison-site"
  },
  "generated": {
    "summary": "The Morrison Formation site contains extensive dinosaur fossils...",
    "sources": ["https://example.com/source1", "https://example.com/source2"],
    "ts": 1698087600
  }
}
```

**Error Responses**:
- `404 Not Found`: Site not found
- `500 Internal Server Error`: Server error

### POST /api/place/{place_id}/generate

Generate or regenerate AI summary for a site (optional feature).

**Path Parameters**:
```typescript
interface GenerateRequest {
  place_id: string; // Required: Site identifier
}
```

**Query Parameters**:
```typescript
interface GenerateQuery {
  force?: boolean; // Optional: Force regeneration (default: false)
}
```

**Example Request**:
```http
POST /api/place/site_001/generate?force=true
```

**Response**:
```typescript
interface GenerateResponse {
  status: 'cached' | 'generated';
  summary?: string;     // Generated summary text
  sources?: string[];   // Source URLs
  cached_at?: number;   // Cache timestamp
}
```

**Error Responses**:
- `404 Not Found`: Site not found or no indexed data
- `500 Internal Server Error`: Generation failed

## Frontend API Integration

### TypeScript API Client

```typescript
// src/services/api.ts
import axios, { AxiosResponse } from 'axios';

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.detail || 'Network error occurred';
    console.error('API Error:', message);
    return Promise.reject(new Error(message));
  }
);

// API methods
export const searchSites = async (
  lat: number,
  lon: number,
  radius_km: number = 50
): Promise<Site[]> => {
  const response: AxiosResponse<SearchResponse> = await apiClient.get('/api/search', {
    params: { lat, lon, radius_km }
  });
  return response.data.sites || [];
};

export const getSiteDetail = async (place_id: string): Promise<SiteDetail> => {
  const response: AxiosResponse<PlaceResponse> = await apiClient.get(`/api/place/${place_id}`);
  return response.data;
};

export const generateSummary = async (
  place_id: string,
  force: boolean = false
): Promise<GenerateResponse> => {
  const response: AxiosResponse<GenerateResponse> = await apiClient.post(
    `/api/place/${place_id}/generate`,
    {},
    { params: { force } }
  );
  return response.data;
};
```

### Error Handling Strategy

```typescript
// src/utils/errorHandling.ts
export interface APIError {
  type: 'network' | 'api' | 'validation';
  message: string;
  retryable: boolean;
  originalError?: unknown;
}

export const handleAPIError = (error: unknown): APIError => {
  if (error instanceof Error) {
    if (error.message.includes('Network Error')) {
      return {
        type: 'network',
        message: 'Unable to connect to server. Please check your connection.',
        retryable: true,
        originalError: error
      };
    }
    
    if (error.message.includes('404')) {
      return {
        type: 'api',
        message: 'The requested site was not found.',
        retryable: false,
        originalError: error
      };
    }
    
    return {
      type: 'api',
      message: 'An unexpected error occurred. Please try again.',
      retryable: true,
      originalError: error
    };
  }
  
  return {
    type: 'api',
    message: 'An unknown error occurred.',
    retryable: true,
    originalError: error
  };
};
```

### Retry Logic Implementation

```typescript
// src/utils/retry.ts
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: unknown;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxAttempts) {
        throw error;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError;
};
```

## Integration Testing Contracts

### Mock API Responses

```typescript
// tests/mocks/apiMocks.ts
export const mockSearchResponse: SearchResponse = {
  sites: [
    {
      id: 'test_site_1',
      name: 'Test Site 1',
      lat: 40.7128,
      lon: -74.0060,
      known_type: 'Test Formation',
      short_summary: 'Test summary'
    }
  ]
};

export const mockSiteDetail: PlaceResponse = {
  place: {
    id: 'test_site_1',
    name: 'Test Site 1',
    lat: 40.7128,
    lon: -74.0060,
    known_type: 'Test Formation'
  },
  generated: {
    summary: 'This is a test summary',
    sources: ['https://test.com'],
    ts: 1698087600
  }
};
```

### Contract Validation Tests

```typescript
// tests/contracts/api.test.ts
import { searchSites, getSiteDetail } from '../../src/services/api';

describe('API Contract Validation', () => {
  test('search response matches Site interface', async () => {
    const sites = await searchSites(40.7128, -74.0060, 25);
    
    sites.forEach(site => {
      expect(site).toHaveProperty('id');
      expect(site).toHaveProperty('name');
      expect(site).toHaveProperty('lat');
      expect(site).toHaveProperty('lon');
      expect(site).toHaveProperty('known_type');
      expect(typeof site.lat).toBe('number');
      expect(typeof site.lon).toBe('number');
    });
  });
  
  test('site detail response matches SiteDetail interface', async () => {
    const detail = await getSiteDetail('test_site_1');
    
    expect(detail).toHaveProperty('place');
    expect(detail.place).toHaveProperty('id');
    expect(detail.place).toHaveProperty('name');
    
    if (detail.generated) {
      expect(detail.generated).toHaveProperty('summary');
      expect(Array.isArray(detail.generated.sources)).toBe(true);
    }
  });
});
```

## Security Considerations

### Input Validation
- All coordinate parameters validated on frontend before API calls
- Radius parameter restricted to predefined values
- Site ID validation prevents injection attacks

### CORS Configuration
- Backend should allow frontend origin for development and production
- Appropriate CORS headers for cross-origin requests

### Rate Limiting
- Frontend implements request debouncing to prevent API spam
- Reasonable timeout values for all requests
- Graceful handling of rate limit responses

This API contract specification ensures type-safe integration between the frontend and existing backend services while maintaining proper error handling and security practices.