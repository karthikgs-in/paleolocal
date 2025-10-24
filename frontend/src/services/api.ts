import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { PaleoSite, SearchRequest, SearchResponse, ApiError } from '../types';

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Create axios instance with base configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging (development only)
apiClient.interceptors.request.use(
  (config) => {
    if (import.meta.env.VITE_DEV_MODE === 'true') {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`, config.data);
    }
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    if (import.meta.env.VITE_DEV_MODE === 'true') {
      console.log(`API Response: ${response.status}`, response.data);
    }
    return response;
  },
  (error) => {
    const apiError: ApiError = {
      message: 'An unexpected error occurred',
      code: error.code,
      details: error.message,
    };

    if (error.response) {
      // Server responded with error status
      apiError.message = error.response.data?.message || 'Server error occurred';
      apiError.code = error.response.status.toString();
    } else if (error.request) {
      // Request made but no response received
      apiError.message = 'Unable to connect to server. Please check your connection.';
      apiError.code = 'NETWORK_ERROR';
    }

    console.error('API Error:', apiError);
    return Promise.reject(apiError);
  }
);

// API service functions
export const apiService = {
  /**
   * Search for paleontological sites within a radius
   * @param searchRequest - Search parameters including center coordinates and radius
   * @returns Promise resolving to search results
   */
  async searchSites(searchRequest: SearchRequest): Promise<SearchResponse> {
    try {
      const params = {
        lat: searchRequest.center.latitude,
        lon: searchRequest.center.longitude,
        radius_km: searchRequest.radius || 50
      };
      
      // Backend response type
      interface BackendSite {
        id: string;
        name: string;
        lat: number;
        lon: number;
        known_type: string;
        short_summary: string;
      }
      
      const response = await apiClient.get<BackendSite[]>('/api/search', { params });
      
      // Transform backend response to frontend PaleoSite format
      const sites: PaleoSite[] = response.data.map(site => ({
        id: site.id,
        name: site.name,
        description: site.short_summary || site.known_type || 'No description available',
        coordinates: {
          latitude: site.lat,
          longitude: site.lon
        },
        formation: site.known_type,
        accessibility: 'public' as const
      }));
      
      return {
        sites,
        total: sites.length,
        center: searchRequest.center,
        radius: searchRequest.radius || 50
      };
    } catch (error) {
      throw error as ApiError;
    }
  },

  /**
   * Get detailed information for a specific site
   * @param siteId - Unique identifier for the paleontological site
   * @returns Promise resolving to detailed site information
   */
  async getSiteDetails(siteId: string): Promise<PaleoSite> {
    try {
      const response = await apiClient.get<PaleoSite>(`/api/place/${siteId}`);
      return response.data;
    } catch (error) {
      throw error as ApiError;
    }
  },

  /**
   * Health check for API connectivity
   * @returns Promise resolving to boolean indicating API availability
   */
  async healthCheck(): Promise<boolean> {
    try {
      await apiClient.get('/health');
      return true;
    } catch (error) {
      console.warn('API health check failed:', error);
      return false;
    }
  },
};

export default apiService;