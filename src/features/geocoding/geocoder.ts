import type { GeocodeResult } from '@/types';
import { PUERTO_MONTT_VIEWBOX } from '@/lib/constants';

// Nominatim API response interface
interface NominatimResult {
  lat: string;
  lon: string;
  address?: {
    house_number?: string;
    housenumber?: string;
    road?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// Geocoding parameters
interface GeocodeParams {
  street: string;
  number?: string;
  sector?: string;
  city?: string;
}

/**
 * Advanced geocoding function that respects house numbering
 * Uses structured and free-text search with Puerto Montt bounds
 */
export const geocodeSmart = async (params: GeocodeParams): Promise<GeocodeResult | null> => {
  const { street, number, sector, city = "Puerto Montt" } = params;
  const streetTrim = street?.trim();
  const numberTrim = number?.trim();

  if (!streetTrim || streetTrim.length < 2) {
    return null;
  }

  const candidates: string[] = [];

  // 1) Structured search with "number + street"
  if (numberTrim) {
    const structuredUrl = buildNominatimUrl({
      street: `${numberTrim} ${streetTrim}`,
      city,
      county: sector,
      bounded: true,
    });
    candidates.push(structuredUrl);

    // 1b) Street only (for filtering by house_number later)
    const streetOnlyUrl = buildNominatimUrl({
      street: streetTrim,
      city,
      county: sector,
      bounded: true,
    });
    candidates.push(streetOnlyUrl);
  }

  // 2) Free text search
  const freeText = buildFreeTextQuery(streetTrim, numberTrim, sector, city);
  const freeTextUrl = buildNominatimUrl({
    q: freeText,
    bounded: true,
  });
  candidates.push(freeTextUrl);

  // 3) Street + city only (fallback)
  const fallbackUrl = buildNominatimUrl({
    q: `${streetTrim}, ${city}, Chile`,
    bounded: true,
  });
  candidates.push(fallbackUrl);

  // Try each candidate URL
  for (const url of candidates) {
    try {
      const response = await fetch(url, {
        headers: { 'Accept-Language': 'es-CL' }
      });
      
      if (!response.ok) continue;
      
      const data: NominatimResult[] = await response.json();
      
      if (!Array.isArray(data) || data.length === 0) continue;

      // Helper to create result
      const createResult = (
        record: NominatimResult, 
        precision: GeocodeResult['precision'], 
        matchedNumber = false
      ): GeocodeResult | null => {
        const lat = parseFloat(record.lat);
        const lng = parseFloat(record.lon);
        
        if (!isFinite(lat) || !isFinite(lng)) return null;
        
        return { lat, lng, precision, matchedNumber };
      };

      // Look for exact house number match first
      if (numberTrim) {
        const exactMatch = data.find(record => {
          const houseNumber = record.address?.house_number || record.address?.housenumber;
          return houseNumber && String(houseNumber).trim() === numberTrim;
        });
        
        if (exactMatch) {
          const result = createResult(exactMatch, 'exact', true);
          if (result) return result;
        }
      }

      // Look for same road/street
      const sameRoad = data.find(record => {
        const road = (record.address?.road || '').toLowerCase();
        return road.includes(streetTrim.toLowerCase());
      });
      
      if (sameRoad) {
        const result = createResult(sameRoad, 'road', false);
        if (result) return result;
      }

      // Fallback to first result
      const fallback = createResult(data[0], 'fallback', false);
      if (fallback) return fallback;

    } catch (error) {
      console.warn('Geocoding request failed:', error);
      continue;
    }
  }

  return null;
};

// Build Nominatim URL with parameters
const buildNominatimUrl = (params: {
  street?: string;
  city?: string;
  county?: string;
  q?: string;
  bounded?: boolean;
}): string => {
  const baseUrl = 'https://nominatim.openstreetmap.org/search';
  const searchParams = new URLSearchParams({
    format: 'jsonv2',
    addressdetails: '1',
    limit: '8',
    countrycodes: 'cl',
    dedupe: '1',
    extratags: '1',
  });

  if (params.bounded) {
    searchParams.set('bounded', '1');
    searchParams.set('viewbox', PUERTO_MONTT_VIEWBOX);
  }

  if (params.street) {
    searchParams.set('street', params.street);
  }

  if (params.city) {
    searchParams.set('city', params.city);
    searchParams.set('country', 'Chile');
  }

  if (params.county && params.county.trim()) {
    searchParams.set('county', params.county);
  }

  if (params.q) {
    searchParams.set('q', params.q);
  }

  return `${baseUrl}?${searchParams.toString()}`;
};

// Build free text query string
const buildFreeTextQuery = (
  street: string,
  number?: string,
  sector?: string,
  city = 'Puerto Montt'
): string => {
  const parts = [street];
  
  if (number) parts.push(number);
  if (sector && sector.trim()) parts.push(sector);
  
  parts.push(city, 'Los Lagos', 'Chile');
  
  return parts.join(', ');
};