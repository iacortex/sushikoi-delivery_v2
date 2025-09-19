/* =========================
   Roles
   ========================= */
export type UserRole = "cashier" | "cook" | "delivery" | "client";

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
  distance?: number;           // metros
  duration?: number;           // segundos
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

/** Ampliado para UI Delivery */
export type PaymentStatus =
  | "paid"
  | "pending"
  | "unpaid"
  | "due"
  | "refunded";

/** Ampliado con 'on_route' y 'cancelled' */
export type OrderStatus =
  | "pending"
  | "cooking"
  | "ready"
  | "on_route"
  | "delivered"
  | "cancelled";

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
   Extras / Meta
   ========================= */
export type ServiceType = "delivery" | "local";

export interface ChangeLine {
  from?: string;
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

  /** Servicio (opcional; por compatibilidad se asume delivery si no viene) */
  service?: ServiceType;

  status: OrderStatus;
  timestamp: string;
  createdAt: number;
  cookingAt: number | null;
  readyAt?: number | null;
  pickupAt?: number | null;
  deliveredAt?: number | null;

  estimatedTime: number;
  routeMeta?: RouteMeta | null;

  createdBy: string;
  geocodePrecision: GeocodePrecision;

  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  dueMethod?: PaymentMethod;
  paidAt?: number | string | null;

  packUntil: number | null;
  packed: boolean;

  driver?: { name: string; phone?: string } | null;

  meta?: OrderMeta;
}
