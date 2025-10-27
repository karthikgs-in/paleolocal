import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/api';
import { PaleoSite, SearchRequest, SearchResponse, ApiError } from '../types';
import { enhanceError, isRetryableError, getRetryDelay } from '../utils/errorHandling';

/**
 * Site data hook state
 */
interface UseSiteDataState {
  sites: PaleoSite[];
  selectedSite: PaleoSite | null;
  isLoading: boolean;
  isLoadingDetails: boolean;
  error: ApiError | null;
  lastSearchParams: SearchRequest | null;
  lastSearchTime: number | null;
  total: number;
}

/**
 * Site data hook options
 */
interface UseSiteDataOptions {
  autoRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  cacheTimeout?: number; // in milliseconds
}

/**
 * Site data hook return type
 */
interface UseSiteDataReturn extends UseSiteDataState {
  searchSites: (searchRequest: SearchRequest) => Promise<void>;
  getSiteDetails: (siteId: string) => Promise<PaleoSite | null>;
  clearSelectedSite: () => void;
  clearError: () => void;
  refresh: () => Promise<void>;
  clearResults: () => void;
}

/**
 * Default options
 */
const DEFAULT_OPTIONS: Required<UseSiteDataOptions> = {
  autoRetry: true,
  maxRetries: 3,
  retryDelay: 1000,
  cacheTimeout: 300000, // 5 minutes
};

/**
 * Custom hook for site data management and API integration
 * @param options - Hook configuration options
 * @returns Site data state and control functions
 */
export function useSiteData(options: UseSiteDataOptions = {}): UseSiteDataReturn {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  const [state, setState] = useState<UseSiteDataState>({
    sites: [],
    selectedSite: null,
    isLoading: false,
    isLoadingDetails: false,
    error: null,
    lastSearchParams: null,
    lastSearchTime: null,
    total: 0,
  });

  const isMountedRef = useRef(true);
  const retryCountRef = useRef(0);
  const siteDetailsCache = useRef<Map<string, { site: PaleoSite; timestamp: number }>>(new Map());

  // Helper to check if cached data is still valid
  const isCacheValid = useCallback((timestamp: number): boolean => {
    return Date.now() - timestamp < config.cacheTimeout;
  }, [config.cacheTimeout]);

  // Search for sites with retry logic
  const searchSites = useCallback(async (searchRequest: SearchRequest): Promise<void> => {
    if (!isMountedRef.current) return;

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    // TEMPORARY: Mock data for debugging marker visibility
    const ENABLE_MOCK_DATA = true; // Set to false to use real API
    
    if (ENABLE_MOCK_DATA) {
      console.log('🧪 Using mock data for marker debugging');
      
      // Simulate loading delay
      setTimeout(() => {
        if (!isMountedRef.current) return;
        
        const mockSites: PaleoSite[] = [
          {
            id: '1',
            name: 'Grand Canyon Mock Site',
            coordinates: {
              latitude: 36.1069,
              longitude: -112.1129
            },
            description: 'Mock paleontological site at Grand Canyon for testing marker visibility',
            accessibility: 'public'
          },
          {
            id: '2',
            name: 'Nearby Mock Site',
            coordinates: {
              latitude: 36.1169,
              longitude: -112.1029
            },
            description: 'Another mock site for testing marker rendering',
            accessibility: 'public'
          },
          {
            id: '3',
            name: 'Third Mock Site',
            coordinates: {
              latitude: 36.0969,
              longitude: -112.1229
            },
            description: 'Third mock site to test multiple markers',
            accessibility: 'public'
          }
        ];
        
        console.log('🧪 Setting mock sites:', mockSites);
        
        setState(prev => ({
          ...prev,
          sites: mockSites,
          total: mockSites.length,
          isLoading: false,
          lastSearchParams: searchRequest,
          lastSearchTime: Date.now(),
          error: null,
        }));
      }, 500); // 500ms delay to simulate API call
      
      return;
    }

    const executeSearch = async (attempt: number = 1): Promise<void> => {
      try {
        const response: SearchResponse = await apiService.searchSites(searchRequest);
        
        if (!isMountedRef.current) return;

        setState(prev => ({
          ...prev,
          sites: response.sites,
          total: response.total,
          isLoading: false,
          lastSearchParams: searchRequest,
          lastSearchTime: Date.now(),
          error: null,
        }));

        retryCountRef.current = 0;
      } catch (error) {
        if (!isMountedRef.current) return;

        const apiError = error as ApiError;
        const enhancedError = enhanceError(apiError, { searchRequest, attempt });

        // Retry logic
        if (
          config.autoRetry &&
          attempt < config.maxRetries &&
          isRetryableError(apiError)
        ) {
          const delay = getRetryDelay(apiError, attempt);
          
          setTimeout(() => {
            if (isMountedRef.current) {
              executeSearch(attempt + 1);
            }
          }, delay);
          
          return;
        }

        setState(prev => ({
          ...prev,
          isLoading: false,
          error: enhancedError,
          sites: [],
          total: 0,
        }));

        retryCountRef.current = 0;
      }
    };

    await executeSearch();
  }, [config.autoRetry, config.maxRetries]);

  // Get site details with caching
  const getSiteDetails = useCallback(async (siteId: string): Promise<PaleoSite | null> => {
    if (!isMountedRef.current) return null;

    // Check cache first
    const cached = siteDetailsCache.current.get(siteId);
    if (cached && isCacheValid(cached.timestamp)) {
      setState(prev => ({ ...prev, selectedSite: cached.site }));
      return cached.site;
    }

    setState(prev => ({
      ...prev,
      isLoadingDetails: true,
      error: null,
    }));

    const executeGetDetails = async (attempt: number = 1): Promise<PaleoSite | null> => {
      try {
        const site: PaleoSite = await apiService.getSiteDetails(siteId);
        
        if (!isMountedRef.current) return null;

        // Cache the result
        siteDetailsCache.current.set(siteId, {
          site,
          timestamp: Date.now(),
        });

        setState(prev => ({
          ...prev,
          selectedSite: site,
          isLoadingDetails: false,
          error: null,
        }));

        return site;
      } catch (error) {
        if (!isMountedRef.current) return null;

        const apiError = error as ApiError;
        const enhancedError = enhanceError(apiError, { siteId, attempt });

        // Retry logic
        if (
          config.autoRetry &&
          attempt < config.maxRetries &&
          isRetryableError(apiError)
        ) {
          const delay = getRetryDelay(apiError, attempt);
          
          setTimeout(() => {
            if (isMountedRef.current) {
              executeGetDetails(attempt + 1);
            }
          }, delay);
          
          return null;
        }

        setState(prev => ({
          ...prev,
          isLoadingDetails: false,
          error: enhancedError,
        }));

        return null;
      }
    };

    return executeGetDetails();
  }, [config.autoRetry, config.maxRetries, isCacheValid]);

  // Clear selected site
  const clearSelectedSite = useCallback(() => {
    setState(prev => ({ ...prev, selectedSite: null }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Refresh last search
  const refresh = useCallback(async (): Promise<void> => {
    if (state.lastSearchParams) {
      await searchSites(state.lastSearchParams);
    }
  }, [state.lastSearchParams, searchSites]);

  // Clear all results
  const clearResults = useCallback(() => {
    setState(prev => ({
      ...prev,
      sites: [],
      selectedSite: null,
      total: 0,
      lastSearchParams: null,
      lastSearchTime: null,
      error: null,
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Cache cleanup effect
  useEffect(() => {
    const cleanupCache = () => {
      for (const [key, value] of siteDetailsCache.current.entries()) {
        if (!isCacheValid(value.timestamp)) {
          siteDetailsCache.current.delete(key);
        }
      }
    };

    const interval = setInterval(cleanupCache, config.cacheTimeout);
    return () => clearInterval(interval);
  }, [config.cacheTimeout, isCacheValid]);

  return {
    ...state,
    searchSites,
    getSiteDetails,
    clearSelectedSite,
    clearError,
    refresh,
    clearResults,
  };
}