/**
 * OpenStreetMap API Integration
 * Nominatim API for location search and reverse geocoding
 */

export interface NominatimSearchResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  type: string;
  importance: number;
}

export interface ReverseGeocodeResult {
  display_name: string;
  address?: {
    city?: string;
    town?: string;
    county?: string;
    state?: string;
    country?: string;
  };
}

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

/**
 * Search for places by query
 * @param query - Search query (e.g., "Gateway of India")
 * @returns Array of search results
 */
export async function searchPlaces(query: string): Promise<NominatimSearchResult[]> {
  try {
    const url = `${NOMINATIM_BASE}/search?format=json&q=${encodeURIComponent(query)}&limit=10`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'napz/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const results: NominatimSearchResult[] = await response.json();
    return results;
  } catch (error) {
    console.error('OSM Search Error:', error);
    throw error;
  }
}

/**
 * Reverse geocode - get address from coordinates
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Address information
 */
export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
  try {
    const url = `${NOMINATIM_BASE}/reverse?format=json&lat=${lat}&lon=${lng}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'napz/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result: ReverseGeocodeResult = await response.json();
    return result;
  } catch (error) {
    console.error('OSM Reverse Geocode Error:', error);
    throw error;
  }
}
