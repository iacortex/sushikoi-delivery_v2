// Core types
export type UserRole = 'cashier' | 'cook' | 'delivery' | 'client';
export type PaymentMethod = 'debito' | 'credito' | 'efectivo' | 'transferencia' | 'otro';
export type PaymentStatus = 'paid' | 'due';
export type OrderStatus = 'pending' | 'cooking' | 'ready' | 'delivered';
export type GeocodePrecision = 'exact' | 'road' | 'fallback' | 'unknown';

// Coordinate interface
export interface Coordinates {
  lat: number;
  lng: number;
}

// Promotion interface
export interface Promotion {
  id: number;
  name: string;
  description: string;
  items: string[];
  discountPrice: number;
  originalPrice: number;
  discount: number;
  image: string;
  cookingTime: number;
  popular?: boolean;
}

// Cart item extends promotion with quantity
export interface CartItem extends Promotion {
  quantity: number;
}

// Customer interface
export interface Customer {
  name: string;
  phone: string;
  street: string;
  number: string;
  sector?: string;
  city: string;
  references?: string;
  coordinates?: Coordinates;
}

// Route metadata for OSRM
export interface RouteMeta {
  distance: number;
  duration: number;
  points?: [number, number][];
}

// Order interface
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
}

// Geocoding result
export interface GeocodeResult {
  lat: number;
  lng: number;
  precision: GeocodePrecision;
  matchedNumber?: boolean;
}

// Form validation errors
export interface FormErrors {
  [key: string]: string;
}

// Dashboard statistics
export interface DashboardStats {
  total: number;
  byStatus: Record<OrderStatus, number>;
  due: number;
  deliveredCount: number;
  topClients: Array<{
    name: string;
    phone: string;
    total: number;
    count: number;
  }>;
}

// Progress info for client tracking
export interface ProgressInfo {
  pct: number;
  label: string;
}

// Customer form data
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
}