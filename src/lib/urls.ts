// src/lib/urls.ts
import {
  ORIGIN,
  isBrowser,
  TRACKING_FALLBACK_BASE,
  QR_DEFAULTS,
} from "./constants";

/** Google Maps directions desde ORIGIN a destino */
export const gmapsDir = (destLat: number, destLng: number): string =>
  `https://www.google.com/maps/dir/${ORIGIN.lat},${ORIGIN.lng}/${destLat},${destLng}`;

/** Waze navigation directo */
export const wazeUrl = (destLat: number, destLng: number): string =>
  `https://waze.com/ul?ll=${destLat},${destLng}&navigate=yes`;

/** QR para Waze (tipado size:number, default configurable) */
export const getWazeQRUrl = (
  destLat: number,
  destLng: number,
  size: number = QR_DEFAULTS.wazeSize
): string => {
  const wazeLink = wazeUrl(destLat, destLng);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
    wazeLink
  )}`;
};

/** QR para tracking (SSR-safe) */
export const getTrackingQRUrl = (
  orderCode: string,
  size: number = QR_DEFAULTS.trackingSize
): string => {
  const base = isBrowser
    ? `${window.location.origin}${window.location.pathname}`
    : TRACKING_FALLBACK_BASE;
  const trackingUrl = `${base}#order-${orderCode}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
    trackingUrl
  )}`;
};

/** OSRM routing público */
export const getOSRMRouteUrl = (destLat: number, destLng: number): string =>
  `https://router.project-osrm.org/route/v1/driving/${ORIGIN.lng},${ORIGIN.lat};${destLng},${destLat}?overview=full&geometries=geojson&alternatives=false&steps=false&annotations=false&radiuses=100;100`;
