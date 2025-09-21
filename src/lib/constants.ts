// src/lib/constants.ts

/** ========= Runtime & ENV helpers ========= */

/** SSR-safe */
export const isBrowser =
  typeof window !== "undefined" && typeof document !== "undefined";

/** Lee número desde env Vite */
const readEnvNum = (key: string): number | undefined => {
  const v = (import.meta as any)?.env?.[key];
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

/** ========= Origen (coordenadas) ========= */

type LatLng = { lat: number; lng: number };

/** ORIGIN por defecto (Santiago) + ENV override */
const defaultLat = readEnvNum("VITE_ORIGIN_LAT") ?? -33.4489;
const defaultLng = readEnvNum("VITE_ORIGIN_LNG") ?? -70.6693;

let ORIGIN_OVERRIDE: LatLng | null = null;

/** Punto de origen accesible en runtime (con override opcional) */
export const ORIGIN = new Proxy(
  { lat: defaultLat, lng: defaultLng } as LatLng,
  {
    get(_t, prop: "lat" | "lng") {
      if (ORIGIN_OVERRIDE) return ORIGIN_OVERRIDE[prop];
      return prop === "lat" ? defaultLat : defaultLng;
    },
  }
) as Readonly<LatLng>;

export function setOriginOverride(lat: number, lng: number) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
  ORIGIN_OVERRIDE = { lat, lng };
}
export function clearOriginOverride() {
  ORIGIN_OVERRIDE = null;
}

/** ========= Tracking / QR ========= */

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

/** ========= Orders UI ========= */

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
} as const;

/** ========= App constants que faltaban ========= */

/** Intervalo por defecto del ticker (1 segundo) */
export const TICKER_INTERVAL_MS = 1000 as const;

/** Claves de storage usadas en la app */
export const STORAGE_KEYS = {
  CUSTOMERS: "sushikoi.customers.v1",
  ORDERS: "sushikoi.orders.v1",
  CART: "sushikoi.cart.v1",
} as const;

/** Flags de entorno útiles */
export const IS_DEV = (import.meta as any)?.env?.DEV ?? false;
export const IS_PROD = (import.meta as any)?.env?.PROD ?? false;
