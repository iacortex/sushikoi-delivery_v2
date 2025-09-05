    import type { Coordinates, PaymentMethod } from '@/types';

// Origin restaurant location (fixed)
export const ORIGIN: Coordinates & { name: string } = {
  lat: -41.46619826299714,
  lng: -72.99901571534275,
  name: "Sushikoi — Av. Capitán Ávalos 6130, Puerto Montt, Chile",
};

// Viewbox for Puerto Montt area (for Nominatim geocoding)
export const PUERTO_MONTT_VIEWBOX = "-73.2,-41.7,-72.7,-41.3";

// Payment methods configuration
export const PAYMENT_METHODS: Array<{ value: PaymentMethod; label: string }> = [
  { value: "debito", label: "Débito" },
  { value: "credito", label: "Crédito" },
  { value: "efectivo", label: "Efectivo" },
  { value: "transferencia", label: "Transferencia" },
  { value: "otro", label: "Otro" },
];

// Chilean cities supported
export const CITIES = [
  "Puerto Montt",
  "Puerto Varas", 
  "Osorno",
  "Frutillar",
  "Llanquihue",
  "Ancud",
  "Castro"
];

// Order status configuration
export const ORDER_STATUS_CONFIG = {
  pending: { 
    label: "Pendiente", 
    color: "bg-yellow-100 text-yellow-800",
    progressRange: [0, 50] 
  },
  cooking: { 
    label: "En Cocina", 
    color: "bg-orange-100 text-orange-800",
    progressRange: [50, 90]
  },
  ready: { 
    label: "Listo para Delivery", 
    color: "bg-green-100 text-green-800",
    progressRange: [90, 100]
  },
  delivered: { 
    label: "Entregado", 
    color: "bg-blue-100 text-blue-800",
    progressRange: [100, 100]
  },
} as const;

// Packing time for ready orders (90 seconds)
export const PACKING_TIME_MS = 90_000;

// Debounce delay for geocoding
export const GEOCODING_DEBOUNCE_MS = 700;

// Ticker interval for real-time updates
export const TICKER_INTERVAL_MS = 1000;

// Local storage keys
export const STORAGE_KEYS = {
  ORDERS: 'sushi_orders',
  CUSTOMERS: 'sushi_customers',
} as const;

// Chilean phone regex
export const CHILEAN_PHONE_REGEX = /^\+?56\s?9\s?[\d\s-]{7,9}$/;