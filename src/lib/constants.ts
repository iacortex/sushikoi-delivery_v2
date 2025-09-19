// src/lib/constants.ts

/** SSR-safe */
export const isBrowser =
  typeof window !== "undefined" && typeof document !== "undefined";

/** Lee número desde env Vite */
const readEnvNum = (key: string): number | undefined => {
  const v = (import.meta as any)?.env?.[key];
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

/** ORIGIN por defecto (Santiago) + ENV override */
const defaultLat = readEnvNum("VITE_ORIGIN_LAT") ?? -33.4489;
const defaultLng = readEnvNum("VITE_ORIGIN_LNG") ?? -70.6693;

let ORIGIN_OVERRIDE: { lat: number; lng: number } | null = null;

/** Punto de origen accesible en runtime (con override opcional) */
export const ORIGIN = new Proxy(
  { lat: defaultLat, lng: defaultLng },
  {
    get(_t, prop: "lat" | "lng") {
      if (ORIGIN_OVERRIDE) return ORIGIN_OVERRIDE[prop];
      return prop === "lat" ? defaultLat : defaultLng;
    },
  }
) as { readonly lat: number; readonly lng: number };

export function setOriginOverride(lat: number, lng: number) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
  ORIGIN_OVERRIDE = { lat, lng };
}
export function clearOriginOverride() {
  ORIGIN_OVERRIDE = null;
}

/** Base para tracking cuando no hay window (SSR/tests) */
export const TRACKING_FALLBACK_BASE =
  (import.meta as any)?.env?.VITE_TRACKING_BASE ?? "https://track.local";

/**
 * Config QR (tipado ANCHO para evitar literales 220/140)
 * → así puedes pasar 120, 180, etc. sin error de TS.
 */
export const QR_DEFAULTS: { wazeSize: number; trackingSize: number } = {
  wazeSize: 220,
  trackingSize: 140,
};

/** Badges/labels por estado de orden (usado por DeliveryOrderCard) */
export const ORDER_STATUS_CONFIG: Record<
  string,
  { label: string; color: string }
> = {
  pending: { label: "Pendiente", color: "bg-gray-100 text-gray-700" },
  cooking: { label: "En cocina", color: "bg-orange-100 text-orange-700" },
  ready: { label: "Listo para retiro", color: "bg-amber-100 text-amber-800" },
  on_route: { label: "En ruta", color: "bg-blue-100 text-blue-700" },
  delivered: { label: "Entregado", color: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-700" },
};
