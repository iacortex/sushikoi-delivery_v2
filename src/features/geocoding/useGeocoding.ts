import { useState, useCallback } from 'react';
import type { GeocodeResult } from '@/types';
import { geocodeSmart } from './geocoder';

// Hook state interface
interface UseGeocodingState {
  isLoading: boolean;
  error: string | null;
  lastQuery: string | null;
}

// Hook return interface
interface UseGeocodingReturn extends UseGeocodingState {
  geocode: (params: {
    street: string;
    number?: string;
    sector?: string;
    city?: string;
  }) => Promise<GeocodeResult | null>;
  clearError: () => void;
}

// Rate limiting state
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests

/**
 * Hook for geocoding with rate limiting and error handling
 */
export const useGeocoding = (): UseGeocodingReturn => {
  const [state, setState] = useState<UseGeocodingState>({
    isLoading: false,
    error: null,
    lastQuery: null,
  });

  const geocode = useCallback(async (params: {
    street: string;
    number?: string;
    sector?: string;
    city?: string;
  }): Promise<GeocodeResult | null> => {
    const { street, number, sector, city } = params;
    
    // Create query string for deduplication
    const queryString = `${street}|${number || ''}|${sector || ''}|${city || ''}`;
    
    // Skip if same query
    if (state.lastQuery === queryString && !state.error) {
      return null;
    }

    // Rate limiting
    const now = Date.now();
    if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
      await new Promise(resolve => 
        setTimeout(resolve, MIN_REQUEST_INTERVAL - (now - lastRequestTime))
      );
    }

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      lastQuery: queryString,
    }));

    try {
      lastRequestTime = Date.now();
      const result = await geocodeSmart(params);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: null,
      }));

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Error en la geocodificación';
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      return null;
    }
  }, [state.lastQuery, state.error]);

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  return {
    ...state,
    geocode,
    clearError,
  };
};