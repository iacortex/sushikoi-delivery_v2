import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import type { Coordinates, RouteMeta } from '@/types';
import { loadLeaflet, getLeaflet } from './loadLeaflet';
import { ORIGIN } from '@/lib/constants';
import { getOSRMRouteUrl } from '@/lib/urls';

// Map props interface
interface LeafletMapProps {
  center: Coordinates;
  zoom?: number;
  height?: string;
  className?: string;
  origin?: Coordinates & { name?: string };
  destination?: Coordinates;
  draggableMarker?: boolean;
  showRoute?: boolean;
  onMarkerDrag?: (coords: Coordinates) => void;
  onMapReady?: () => void;
}

// Map instance methods interface
export interface LeafletMapRef {
  getMap: () => L.Map | null;
  setCenter: (coords: Coordinates, zoom?: number) => void;
  addMarker: (coords: Coordinates, options?: L.MarkerOptions) => L.Marker | null;
  clearMarkers: () => void;
  fitBounds: (bounds: L.LatLngBoundsExpression, options?: L.FitBoundsOptions) => void;
}

/**
 * Leaflet map component with routing and draggable markers
 */
export const LeafletMap = forwardRef<LeafletMapRef, LeafletMapProps>(({
  center,
  zoom = 15,
  height = '300px',
  className = '',
  origin = ORIGIN,
  destination,
  draggableMarker = false,
  showRoute = true,
  onMarkerDrag,
  onMapReady,
}, ref) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const routeLayerRef = useRef<L.Polyline | null>(null);

  // Expose map methods via ref
  useImperativeHandle(ref, () => ({
    getMap: () => mapInstanceRef.current,
    setCenter: (coords, newZoom) => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([coords.lat, coords.lng], newZoom || zoom);
      }
    },
    addMarker: (coords, options = {}) => {
      if (!mapInstanceRef.current) return null;
      const L = getLeaflet();
      const marker = L.marker([coords.lat, coords.lng], options);
      marker.addTo(mapInstanceRef.current);
      markersRef.current.push(marker);
      return marker;
    },
    clearMarkers: () => {
      markersRef.current.forEach(marker => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.removeLayer(marker);
        }
      });
      markersRef.current = [];
    },
    fitBounds: (bounds, options) => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.fitBounds(bounds, options);
      }
    },
  }), [zoom]);

  // Fetch route data
  const fetchRoute = async (dest: Coordinates): Promise<RouteMeta | null> => {
    try {
      const response = await fetch(getOSRMRouteUrl(dest.lat, dest.lng));
      const data = await response.json();
      
      if (!data?.routes?.[0]) return null;
      
      const route = data.routes[0];
      const points = route.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng] as [number, number]);
      
      return {
        points,
        distance: route.distance,
        duration: route.duration,
      };
    } catch (error) {
      console.warn('Route fetching failed:', error);
      return null;
    }
  };

  // Initialize map
  useEffect(() => {
    let mounted = true;

    const initMap = async () => {
      if (!mapRef.current) return;

      try {
        await loadLeaflet();
        
        if (!mounted) return;

        const L = getLeaflet();

        // Clean up existing map
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
        }

        // Create new map
        const map = L.map(mapRef.current, {
          center: [center.lat, center.lng],
          zoom,
          zoomControl: true,
          attributionControl: true,
        });

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);

        mapInstanceRef.current = map;

        // Add origin marker
        if (origin) {
          const originMarker = L.marker([origin.lat, origin.lng], {
            title: origin.name || 'Origen',
          }).addTo(map);
          markersRef.current.push(originMarker);
        }

        // Add destination marker
        if (destination) {
          const destMarker = L.marker([destination.lat, destination.lng], {
            draggable: draggableMarker,
            title: 'Destino',
          }).addTo(map);

          if (draggableMarker && onMarkerDrag) {
            destMarker.on('dragend', (e) => {
              const { lat, lng } = e.target.getLatLng();
              onMarkerDrag({ lat, lng });
            });
          }

          markersRef.current.push(destMarker);

          // Add route if enabled
          if (showRoute && origin) {
            try {
              const routeData = await fetchRoute(destination);
              
              if (routeData?.points && mounted) {
                // Clear existing route
                if (routeLayerRef.current) {
                  map.removeLayer(routeLayerRef.current);
                }

                // Add new route
                const polyline = L.polyline(routeData.points, {
                  color: 'blue',
                  weight: 4,
                  opacity: 0.85,
                });
                
                polyline.addTo(map);
                routeLayerRef.current = polyline;

                // Fit bounds to show route
                const bounds = L.latLngBounds([
                  [origin.lat, origin.lng],
                  [destination.lat, destination.lng],
                  ...routeData.points,
                ]);
                
                map.fitBounds(bounds, { padding: [20, 20] });
              } else {
                // Fallback: fit bounds to origin and destination
                const bounds = L.latLngBounds([
                  [origin.lat, origin.lng],
                  [destination.lat, destination.lng],
                ]);
                map.fitBounds(bounds, { padding: [40, 40] });
              }
            } catch (error) {
              console.warn('Route creation failed:', error);
              // Still fit bounds to markers
              if (origin) {
                const bounds = L.latLngBounds([
                  [origin.lat, origin.lng],
                  [destination.lat, destination.lng],
                ]);
                map.fitBounds(bounds, { padding: [40, 40] });
              }
            }
          }
        }

        // Notify map is ready
        onMapReady?.();

      } catch (error) {
        console.error('Map initialization failed:', error);
      }
    };

    initMap();

    return () => {
      mounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      markersRef.current = [];
      routeLayerRef.current = null;
    };
  }, [center.lat, center.lng, zoom, destination?.lat, destination?.lng, draggableMarker, showRoute, origin, onMarkerDrag, onMapReady]);

  return (
    <div 
      ref={mapRef} 
      className={`w-full rounded-lg border ${className}`}
      style={{ height }}
      role="application"
      aria-label="Mapa interactivo"
    />
  );
});

LeafletMap.displayName = 'LeafletMap';