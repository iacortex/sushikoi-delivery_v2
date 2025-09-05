// Dynamic Leaflet loader to avoid SSR issues

declare global {
  interface Window {
    L: typeof import('leaflet');
  }
}

// Track loading state
let leafletPromise: Promise<void> | null = null;

/**
 * Dynamically load Leaflet CSS and JS from CDN
 * Returns a promise that resolves when Leaflet is ready
 */
export const loadLeaflet = (): Promise<void> => {
  // Return existing promise if already loading
  if (leafletPromise) {
    return leafletPromise;
  }

  // Return immediately if already loaded
  if (typeof window !== 'undefined' && window.L) {
    return Promise.resolve();
  }

  leafletPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window is not available'));
      return;
    }

    // Check if already loaded
    if (window.L) {
      resolve();
      return;
    }

    try {
      // Load CSS
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
      cssLink.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      cssLink.crossOrigin = '';
      
      // Load JavaScript
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      script.crossOrigin = '';
      
      script.onload = () => {
        // Verify Leaflet is actually loaded
        if (window.L) {
          resolve();
        } else {
          reject(new Error('Leaflet failed to load properly'));
        }
      };
      
      script.onerror = (error) => {
        reject(new Error(`Failed to load Leaflet script: ${error}`));
      };

      cssLink.onerror = (error) => {
        reject(new Error(`Failed to load Leaflet CSS: ${error}`));
      };

      // Add to document
      document.head.appendChild(cssLink);
      document.head.appendChild(script);
      
    } catch (error) {
      reject(error);
    }
  });

  return leafletPromise;
};

/**
 * Check if Leaflet is available
 */
export const isLeafletLoaded = (): boolean => {
  return typeof window !== 'undefined' && !!window.L;
};

/**
 * Get Leaflet instance (throws if not loaded)
 */
export const getLeaflet = () => {
  if (!isLeafletLoaded()) {
    throw new Error('Leaflet is not loaded. Call loadLeaflet() first.');
  }
  return window.L;
};