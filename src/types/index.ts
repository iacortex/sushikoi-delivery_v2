// src/types/index.ts

/* =========================
   Catálogo / Ítems de carrito
   ========================= */
export interface CartItem {
  id: number;
  name: string;
  description: string;
  items: string[];
  originalPrice: number;
  discountPrice: number;
  discount: number;
  image: string;
  popular: boolean;
  cookingTime: number;
  quantity: number;
}

/* =========================
   Coordenadas / Ruta
   ========================= */
export interface Coordinates {
  lat: number;
  lng: number;
}

export interface RouteMeta {
  distance?: number; // metros
  duration?: number; // segundos
  points?: [number, number][]; // [lat, lng]
}

/* =========================
   Pagos y estados
   ========================= */
export type PaymentMethod =
  | "efectivo"
  | "debito"
  | "credito"
  | "transferencia"
  | "mp";

export type PaymentStatus = "paid" | "pending" | "unpaid";

export type OrderStatus = "pending" | "cooking" | "ready" | "delivered";

export type GeocodePrecision = "exact" | "approx" | "none";

/* =========================
   Cliente (form)
   ========================= */
export interface CustomerFormData {
  name: string;
  phone: string;
  street: string;
  number: string;
  sector: string;
  city: string;
  references: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  dueMethod: PaymentMethod;
  mpChannel?: "delivery" | "local";
}

/* =========================
   Extras / Meta de la orden
   ========================= */
export type ServiceType = "delivery" | "local";

export interface ChangeLine {
  from?: string; // 'pollo' | 'salmon' | ...
  to?: string;
  fee: number;
}

export interface SauceLine {
  qty: number;
  included?: number;
  extraFee?: number;
  feeTotal?: number;
}

export interface OrderMeta {
  service: ServiceType;
  deliveryZone?: string;
  deliveryFee?: number;
  chopsticks?: number;
  changes?: ChangeLine[];
  soy?: SauceLine;
  ginger?: SauceLine;
  wasabi?: SauceLine;
  agridulce?: SauceLine;
  acevichada?: SauceLine;
  extrasTotal?: number;
  note?: string;
}

/* =========================
   Orden
   ========================= */
export interface Order {
  id: number;
  publicCode: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  references?: string;
  cart: CartItem[];
  total: number;
  coordinates: Coordinates;
  mapsUrl: string;
  wazeUrl: string;
  status: OrderStatus;
  timestamp: string;
  createdAt: number;
  cookingAt: number | null;
  estimatedTime: number;
  routeMeta?: RouteMeta | null;
  createdBy: string;
  geocodePrecision: GeocodePrecision;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  dueMethod?: PaymentMethod;
  packUntil: number | null;
  packed: boolean;
  paidAt?: string;

  // ✅ NUEVO: extras (delivery/cambios/salsas, etc.)
  meta?: OrderMeta;
}
