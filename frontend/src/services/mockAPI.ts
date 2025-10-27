import { PLACES_DATA, SeedPlace } from '../data/seedPlaces';
import { PaleoSite } from '../types';
import { DEV_CONFIG } from '../config/dev';

// Mock summary cache (in-memory)
const SUMMARY_CACHE: { [placeId: string]: { summary: string; sources: string[]; ts: number } } = {};

// Haversine distance calculation in kilometers
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371.0; // Earth's radius in km
  const dlat = (lat2 - lat1) * (Math.PI / 180);
  const dlon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dlat / 2) ** 2 + 
            Math.cos(lat1 * (Math.PI / 180)) * 
            Math.cos(lat2 * (Math.PI / 180)) * 
            Math.sin(dlon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Convert SeedPlace to PaleoSite format
function seedPlaceToPaleoSite(place: SeedPlace, shortSummary?: string): PaleoSite {
  return {
    id: place.id,
    name: place.name,
    coordinates: { latitude: place.lat, longitude: place.lon },
    description: shortSummary || place.notes || place.known_type,
    formation: place.known_type,
    accessibility: 'public', // Default to public based on access_notes
    lastUpdated: new Date().toISOString()
  };
}

// Generate a mock summary for a place
function generateMockSummary(place: SeedPlace): { summary: string; sources: string[] } {
  const summary = `${place.name} is a ${place.known_type.toLowerCase()} located at coordinates ${place.lat}°, ${place.lon}°. ${place.notes} Access: ${place.access_notes}`;
  const sources = place.seed_url ? [place.seed_url] : [];
  return { summary, sources };
}

export interface SearchResult {
  id: string;
  name: string;
  lat: number;
  lon: number;
  known_type: string;
  short_summary: string;
}

export interface PlaceDetail {
  place: SeedPlace;
  generated: {
    summary?: string;
    sources?: string[];
    ts?: number;
  };
}

export interface GenerateResponse {
  status: 'generated' | 'cached';
  summary?: string;
  sources?: string[];
  cached_at?: number;
}

export class MockPaleoAPI {
  private readonly delay: number;

  constructor(delay: number = 500) {
    this.delay = delay; // Simulate network delay
  }

  private async simulateDelay(): Promise<void> {
    if (DEV_CONFIG.ENABLE_DEBUG_LOGGING) {
      console.log(`🕒 Simulating API delay: ${this.delay}ms`);
    }
    await new Promise(resolve => setTimeout(resolve, this.delay));
  }

  // GET /api/search?lat={lat}&lon={lon}&radius_km={radius}
  async search(lat: number, lon: number, radiusKm: number = 50.0): Promise<SearchResult[]> {
    await this.simulateDelay();
    
    if (DEV_CONFIG.ENABLE_DEBUG_LOGGING) {
      console.log(`🔍 Mock API: Searching places near ${lat}, ${lon} within ${radiusKm}km`);
    }

    const results: SearchResult[] = [];
    
    for (const place of PLACES_DATA) {
      const distance = haversineKm(lat, lon, place.lat, place.lon);
      if (distance <= radiusKm) {
        const cached = SUMMARY_CACHE[place.id];
        results.push({
          id: place.id,
          name: place.name,
          lat: place.lat,
          lon: place.lon,
          known_type: place.known_type,
          short_summary: cached?.summary || ''
        });
      }
    }

    if (DEV_CONFIG.ENABLE_DEBUG_LOGGING) {
      console.log(`🔍 Mock API: Found ${results.length} places within radius`);
    }

    return results;
  }

  // GET /api/place/{place_id}
  async getPlace(placeId: string): Promise<PlaceDetail> {
    await this.simulateDelay();
    
    if (DEV_CONFIG.ENABLE_DEBUG_LOGGING) {
      console.log(`📍 Mock API: Getting place details for ${placeId}`);
    }

    const place = PLACES_DATA.find(p => p.id === placeId);
    if (!place) {
      throw new Error(`Place not found: ${placeId}`);
    }

    const cached = SUMMARY_CACHE[placeId] || {};
    
    return {
      place,
      generated: cached
    };
  }

  // POST /api/place/{place_id}/generate
  async generatePlaceSummary(placeId: string, force: boolean = false): Promise<GenerateResponse> {
    await this.simulateDelay();
    
    if (DEV_CONFIG.ENABLE_DEBUG_LOGGING) {
      console.log(`✨ Mock API: Generating summary for place ${placeId} (force: ${force})`);
    }

    const place = PLACES_DATA.find(p => p.id === placeId);
    if (!place) {
      throw new Error(`Place not found: ${placeId}`);
    }

    // Check if we already have a cached summary and force=false
    if (!force && SUMMARY_CACHE[placeId]) {
      return {
        status: 'cached',
        cached_at: SUMMARY_CACHE[placeId].ts
      };
    }

    // Generate new summary
    const { summary, sources } = generateMockSummary(place);
    const timestamp = Date.now();

    SUMMARY_CACHE[placeId] = {
      summary,
      sources,
      ts: timestamp
    };

    return {
      status: 'generated',
      summary,
      sources
    };
  }

  // Utility method to convert search results to PaleoSite format
  async searchAsPaleoSites(lat: number, lon: number, radiusKm: number = 50.0): Promise<PaleoSite[]> {
    const searchResults = await this.search(lat, lon, radiusKm);
    
    return searchResults.map(result => {
      const place = PLACES_DATA.find(p => p.id === result.id);
      if (!place) {
        throw new Error(`Place data not found for ${result.id}`);
      }
      return seedPlaceToPaleoSite(place, result.short_summary);
    });
  }

  // Utility method to get place as PaleoSite
  async getPlaceAsPaleoSite(placeId: string): Promise<PaleoSite> {
    const placeDetail = await this.getPlace(placeId);
    const summary = placeDetail.generated.summary || placeDetail.place.notes;
    return seedPlaceToPaleoSite(placeDetail.place, summary);
  }

  // Get all places (for development/testing)
  getAllPlaces(): SeedPlace[] {
    return [...PLACES_DATA];
  }

  // Clear summary cache (for development/testing)
  clearCache(): void {
    Object.keys(SUMMARY_CACHE).forEach(key => delete SUMMARY_CACHE[key]);
    if (DEV_CONFIG.ENABLE_DEBUG_LOGGING) {
      console.log('🗑️ Mock API: Summary cache cleared');
    }
  }
}

// Create a singleton instance
export const mockAPI = new MockPaleoAPI(300); // 300ms delay for realistic feel