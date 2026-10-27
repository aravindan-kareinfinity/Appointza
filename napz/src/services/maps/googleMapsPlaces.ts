import type { NominatimSearchResult, ReverseGeocodeResult } from './osm';
import { ANDROID_APPLICATION_ID } from '../../constants/androidApplicationId';
import {
  GOOGLE_MAPS_ANDROID_CERT_SHA1,
  GOOGLE_MAPS_API_KEY,
} from '../../constants/googleMaps';

type LatLng = { lat: number; lng: number };

type PlacesTextSearchResponse = {
  status?: string;
  results?: {
    place_id?: string;
    name?: string;
    formatted_address?: string;
    geometry?: { location?: { lat: number; lng: number } };
  }[];
};

type GeocodeResponse = {
  status?: string;
  results?: {
    formatted_address?: string;
    geometry?: { location?: { lat: number; lng: number } };
  }[];
};

function googleAndroidHeaders(): Record<string, string> {
  return {
    'X-Android-Package': ANDROID_APPLICATION_ID,
    'X-Android-Cert': GOOGLE_MAPS_ANDROID_CERT_SHA1,
  };
}

async function googleGetJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: googleAndroidHeaders() });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function searchPlacesGoogle(
  query: string,
  near?: LatLng | null,
): Promise<NominatimSearchResult[]> {
  let url =
    `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}` +
    `&key=${GOOGLE_MAPS_API_KEY}`;
  if (near && Number.isFinite(near.lat) && Number.isFinite(near.lng)) {
    url += `&location=${near.lat},${near.lng}&radius=50000`;
  }

  const data = await googleGetJson<PlacesTextSearchResponse>(url);
  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(data.status || 'GOOGLE_PLACES_FAILED');
  }

  return (data.results || []).map((item, index) => {
    const address = [item.name, item.formatted_address].filter(Boolean).join(', ');
    return {
      place_id: index + 1,
      lat: String(item.geometry?.location?.lat ?? ''),
      lon: String(item.geometry?.location?.lng ?? ''),
      display_name: address || query,
      type: 'google_place',
      importance: 1 - index * 0.05,
    };
  }).filter((item) => item.lat && item.lon);
}

export async function reverseGeocodeGoogle(lat: number, lng: number): Promise<ReverseGeocodeResult> {
  const url =
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}` +
    `&key=${GOOGLE_MAPS_API_KEY}`;
  const data = await googleGetJson<GeocodeResponse>(url);
  const first = data.results?.[0];
  return {
    display_name: first?.formatted_address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
  };
}
