// src/lib/deliveryZones.ts
export type Coords = { lat: number; lng: number };

export const STORE: Coords = { lat: -41.4689, lng: -72.9411 }; // Puerto Montt (ajusta si quieres)

export type Zone = { name: string; radiusKm: number; fee: number };
export const ZONES: Zone[] = [
  { name: "Cerca", radiusKm: 2, fee: 1500 },
  { name: "Media", radiusKm: 5, fee: 2500 },
  { name: "Lejos", radiusKm: 8, fee: 3500 },
  // fallback (cualquier distancia mayor)
  { name: "Extrema", radiusKm: Infinity, fee: 5000 },
];

export function haversineKm(a: Coords, b: Coords): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Retorna {fee, zoneName, distanceKm} para coords del cliente */
export function computeDeliveryFeeFor(coords?: Coords | null) {
  if (!coords) return { fee: 0, zoneName: "Sin ubicación", distanceKm: 0 };
  const d = haversineKm(STORE, coords);
  const zone = ZONES.find(z => d <= z.radiusKm) || ZONES[ZONES.length - 1];
  return { fee: zone.fee, zoneName: zone.name, distanceKm: d };
}
