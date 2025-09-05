import { ORIGIN } from './constants';

// Generate Google Maps directions URL
export const gmapsDir = (destLat: number, destLng: number): string => {
  return `https://www.google.com/maps/dir/${ORIGIN.lat},${ORIGIN.lng}/${destLat},${destLng}`;
};

// Generate Waze navigation URL
export const wazeUrl = (destLat: number, destLng: number): string => {
  return `https://waze.com/ul?ll=${destLat},${destLng}&navigate=yes`;
};

// Generate QR code URL for Waze navigation
export const getWazeQRUrl = (destLat: number, destLng: number, size = 220): string => {
  const wazeLink = wazeUrl(destLat, destLng);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(wazeLink)}`;
};

// Generate QR code URL for order tracking
export const getTrackingQRUrl = (orderCode: string, size = 140): string => {
  const trackingUrl = `${window.location.origin}${window.location.pathname}#order-${orderCode}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(trackingUrl)}`;
};

// Generate OSRM routing URL
export const getOSRMRouteUrl = (destLat: number, destLng: number): string => {
  return `https://router.project-osrm.org/route/v1/driving/${ORIGIN.lng},${ORIGIN.lat};${destLng},${destLat}?overview=full&geometries=geojson&alternatives=false&steps=false&annotations=false&radiuses=100;100`;
};