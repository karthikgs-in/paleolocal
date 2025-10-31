import { PaleoSite, Coordinates } from '../types';
import { mockAPI } from './mockAPI';
import { apiService as realApiService } from './api';

/**
 * Unified API service that switches between mock and real API based on environment
 */
export interface ApiService {
  searchSites(center: Coordinates, radiusKm: number): Promise<PaleoSite[]>;
  getSiteDetails(siteId: string): Promise<PaleoSite>;
}

/**
 * Real API implementation
 */
class RealApiService implements ApiService {
  async searchSites(center: Coordinates, radiusKm: number): Promise<PaleoSite[]> {
    try {
      console.log('🔧 RealApiService.searchSites called with:', { center, radiusKm });
      console.log('🔧 RealApiService about to create SearchRequest with radius:', radiusKm);
      
      const searchRequest = {
        center,
        radius: radiusKm,
        filters: {}
      };
      
      console.log('🔧 RealApiService created SearchRequest:', searchRequest);
      
      const response = await realApiService.searchSites(searchRequest);
      
      console.log('🔧 RealApiService raw response:', response);
      console.log('🔧 RealApiService response.sites:', response.sites);
      console.log('🔧 RealApiService sites count:', response.sites.length);
      
      return response.sites;
    } catch (error) {
      console.error('Real API search failed:', error);
      throw error;
    }
  }

  async getSiteDetails(siteId: string): Promise<PaleoSite> {
    try {
      return await realApiService.getSiteDetails(siteId);
    } catch (error) {
      console.error('Real API site details failed:', error);
      throw error;
    }
  }
}

/**
 * Mock API implementation
 */
class MockApiService implements ApiService {
  async searchSites(center: Coordinates, radiusKm: number): Promise<PaleoSite[]> {
    try {
      // 50% chance to use random selection for more realistic mock behavior
      const useRandomSelection = Math.random() < 0.5;
      
      if (useRandomSelection) {
        console.log('🎲 Mock API: Using random site selection');
        
        // Get all places and select random ones
        const allPlaces = mockAPI.getAllPlaces();
        const shuffled = [...allPlaces].sort(() => 0.5 - Math.random());
        const selectedPlaces = shuffled.slice(0, Math.min(5, allPlaces.length));
        
        // Convert to PaleoSite format
        return selectedPlaces.map(place => ({
          id: place.id,
          name: place.name,
          coordinates: {
            latitude: place.lat,
            longitude: place.lon
          },
          description: place.notes || place.known_type || 'No description available',
          formation: place.known_type,
          accessibility: 'public' as const
        }));
      } else {
        console.log('🔍 Mock API: Using distance-based search');
        
        // Use existing mock API search logic (distance-based)
        const results = await mockAPI.search(center.latitude, center.longitude, radiusKm);
        
        // Convert SearchResult[] to PaleoSite[]
        return results.map(result => ({
          id: result.id,
          name: result.name,
          coordinates: {
            latitude: result.lat,
            longitude: result.lon
          },
          description: result.short_summary || result.known_type || 'No description available',
          formation: result.known_type,
          accessibility: 'public' as const
        }));
      }
    } catch (error) {
      console.error('Mock API search failed:', error);
      throw error;
    }
  }

  async getSiteDetails(siteId: string): Promise<PaleoSite> {
    try {
      return await mockAPI.getPlaceAsPaleoSite(siteId);
    } catch (error) {
      console.error('Mock API site details failed:', error);
      throw error;
    }
  }
}

/**
 * Factory function to create the appropriate API service
 */
function createApiService(): ApiService {
  const useMockApi = import.meta.env.VITE_USE_MOCK_API === 'true';
  
  console.log('🔧 API Service Configuration:', {
    useMockApi,
    envValue: import.meta.env.VITE_USE_MOCK_API,
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL
  });

  if (useMockApi) {
    console.log('🎭 Using Mock API Service');
    return new MockApiService();
  } else {
    console.log('🌐 Using Real API Service');
    return new RealApiService();
  }
}

// Export singleton instance
export const apiService = createApiService();

// Export classes for testing
export { RealApiService, MockApiService };