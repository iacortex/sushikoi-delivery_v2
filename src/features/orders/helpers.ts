// src/features/orders/helpers.ts
// Helpers robustos con normalización de estado para alinear Cocina ↔ Delivery.

import type { Order } from "@/types";
import { clampPercentage } from "@/lib/format";
import { ORDER_STATUS_CONFIG } from "@/lib/constants";

/* ========================= Tipos locales ========================= */

export interface ProgressInfo {
  pct: number;   // 0..100
  label: string; // "En cola", "Cocinando", etc.
}

export interface Promotion {
  id: number;
  name: string;
  description: string;
  items: string[];
  originalPrice: number;
  discountPrice: number;
  discount: number;  // %
  image: string;     // emoji o URL
  popular: boolean;
  cookingTime: number; // min
}

/* ========================= Normalización de estado ========================= */

type CanonStatus = "pending" | "cooking" | "ready" | "on_route" | "delivered" | "cancelled";

const STATUS_ALIASES: Record<string, CanonStatus> = {
  pending: "pending", pendiente: "pending",

  cooking: "cooking", cocinando: "cooking", en_cocina: "cooking",

  ready: "ready", listo: "ready", ready_for_pickup: "ready",
  ready_to_deliver: "ready", listo_para_retiro: "ready",

  on_route: "on_route", en_ruta: "on_route",

  delivered: "delivered", entregado: "delivered",

  cancelled: "cancelled", cancelado: "cancelled",
};

export const normalizeStatus = (s: unknown): CanonStatus => {
  const k = String(s ?? "").toLowerCase().trim();
  if (STATUS_ALIASES[k]) return STATUS_ALIASES[k];
  if (["pending","cooking","ready","on_route","delivered","cancelled"].includes(k)) {
    return k as CanonStatus;
  }
  return "pending";
};

/* ========================= Utils puras ========================= */

const assertNever = (x: never, msg = "Unreachable"): never => {
  throw new Error(`${msg}: ${String(x)}`);
};
const toFinite = (n: unknown, fallback = 0): number =>
  typeof n === "number" && Number.isFinite(n) ? n : fallback;
const msToMin = (ms: number): number => ms / 60_000;
const minToMs = (m: number): number => m * 60_000;
const lerp01 = (elapsed: number, total: number): number => {
  if (total <= 0) return 1;
  const r = elapsed / total;
  return r < 0 ? 0 : r > 1 ? 1 : r;
};
const lerpPct = (t01: number, minPct: number, maxPct: number): number =>
  clampPercentage(toFinite(minPct, 0) + (toFinite(maxPct, 100) - toFinite(minPct, 0)) * (t01 < 0 ? 0 : t01 > 1 ? 1 : t01));
const pickTs = (...xs: Array<number | undefined | null>) => xs.find((v): v is number => typeof v === "number" && Number.isFinite(v));

/* ========================= Progress ranges (fallback) ========================= */

type Status = CanonStatus;

const DEFAULT_PROGRESS_RANGES: Record<Status, readonly [number, number]> = {
  pending: [0, 25],
  cooking: [25, 85],
  ready: [85, 100],
  on_route: [90, 100],
  delivered: [100, 100],
  cancelled: [0, 0],
};

const progressRangeFor = (status: Status): readonly [number, number] => {
  const cfg = (ORDER_STATUS_CONFIG as any)?.[status];
  const rng = cfg?.progressRange as readonly [number, number] | undefined;
  return Array.isArray(rng) && rng.length === 2 ? rng : DEFAULT_PROGRESS_RANGES[status];
};

/* ========================= Promos ========================= */

const pct = (orig: number, now: number) => Math.max(0, Math.round((1 - now / orig) * 100));

export const PROMOTIONS: Promotion[] = [
  { id:1001, name:"KOI 1 (35 Bocados fríos)", description:"Selección fría con salmón, camarón y kanikama. Ideal para 2-3 personas.", items:[
    "9 Envuelto en palta: salmón, queso","9 Envuelto en salmón: camarón, palta","6 Hosomaki en nori: relleno salmón","2 Nigiri: arroz cubierto de salmón","9 Envuelto en sésamo: kanikama, palta",
  ], originalPrice:23990, discountPrice:21990, discount:pct(23990,21990), image:"🍣", popular:false, cookingTime:18 },
  { id:1002, name:"PROMOCIÓN 1 (36 Bocados mixtos)", description:"Mix frío + frito (panko). Perfecta para compartir.", items:[
    "9 Envuelto en palta: queso, salmón","9 California sésamo/ciboulette/merquén: palta, kanikama","9 Frito Panko: salmón, cebollín, queso","9 Frito Panko: pollo, morrón, queso",
  ], originalPrice:23990, discountPrice:21990, discount:pct(23990,21990), image:"🔥", popular:true, cookingTime:22 },
  { id:1003, name:"KOI MIX (45 Bocados mixtos)", description:"Combo completo: envueltos + fritos.", items:[
    "9 Envuelto en palta: salmón, queso","9 Envuelto en salmón: camarón, palta","9 Frito Panko: pollo, queso, morrón","9 Frito Panko: salmón, queso, cebollín","9 Frito Panko: choclo, queso, morrón",
  ], originalPrice:28990, discountPrice:25990, discount:pct(28990,25990), image:"🥢", popular:true, cookingTime:25 },
  { id:1004, name:"KOI 54 (54 Bocados mixtos)", description:"6 variedades entre envueltos y fritos.", items:[
    "9 Envuelto en palta: camarón, queso, morrón","9 Envuelto en queso: kanikama, palta","9 Envuelto en nori: salmón, palta",
    "9 Frito Panko: salmón, queso, cebollín","9 Frito Panko: pollo, queso, choclo","9 Frito Panko: verduras salteadas, queso, palta",
  ], originalPrice:31990, discountPrice:28990, discount:pct(31990,28990), image:"🎉", popular:true, cookingTime:28 },
  { id:1101, name:"ACEVICHADO ROLL PREMIUM", description:"Envuelto en palta; topping ceviche y salsa acevichada.", items:["Roll premium con topping de ceviche","Salsa acevichada de la casa"],
    originalPrice:10990, discountPrice:9680, discount:pct(10990,9680), image:"🥑", popular:false, cookingTime:16 },
  { id:1201, name:"AVOCADO (Envuelto en Palta)", description:"Queso crema y salmón.", items:["Roll 8-10 cortes"], originalPrice:6990, discountPrice:5990, discount:pct(6990,5990), image:"🥑", popular:false, cookingTime:14 },
  { id:1202, name:"FURAY (Panko)", description:"Salmón, queso, cebollín.", items:["Roll 8-10 cortes"], originalPrice:6990, discountPrice:6390, discount:pct(6990,6390), image:"🔥", popular:false, cookingTime:15 },
  { id:1203, name:"PANKO POLLO QUESO PALTA", description:"Pollo, queso y palta.", items:["Roll 8-10 cortes"], originalPrice:6590, discountPrice:6200, discount:pct(6590,6200), image:"🍗", popular:false, cookingTime:15 },
  { id:1204, name:"TORI (FRITO)", description:"Pollo, queso, morrón.", items:["Roll 8-10 cortes"], originalPrice:6290, discountPrice:5800, discount:pct(6290,5800), image:"🍗", popular:false, cookingTime:15 },
  { id:1301, name:"Korokes Salmón & Queso (5u)", description:"Croquetas crujientes.", items:["5 unidades"], originalPrice:4990, discountPrice:4690, discount:pct(4990,4690), image:"🧆", popular:false, cookingTime:8 },
  { id:1302, name:"Korokes Pollo & Queso (5u)", description:"Croquetas de pollo con queso.", items:["5 unidades"], originalPrice:3990, discountPrice:3600, discount:pct(3990,3600), image:"🧆", popular:false, cookingTime:8 },
  { id:1401, name:"Sashimi Sake", description:"Cortes de salmón fresco.", items:["Desde 6 cortes"], originalPrice:5490, discountPrice:4990, discount:pct(5490,4990), image:"🐟", popular:false, cookingTime:10 },
  { id:1501, name:"Gyozas de Camarón (5u)", description:"Empanaditas japonesas.", items:["5 unidades"], originalPrice:4290, discountPrice:3990, discount:pct(4290,3990), image:"🥟", popular:false, cookingTime:7 },
];

/** ✅ ÚNICA declaración de PROMO_BY_ID (no duplicar) */
export const PROMO_BY_ID: ReadonlyMap<number, Promotion> = new Map(
  PROMOTIONS.map((p) => [p.id, p])
);

/* ========================= Progreso / tiempos ========================= */

export const progressFor = (order: Order): ProgressInfo => {
  if (!order) return { pct: 0, label: "—" };

  const now = Date.now();
  const status = normalizeStatus(order.status);
  const [minPct, maxPct] = progressRangeFor(status);

  switch (status) {
    case "pending": {
      const created = toFinite(order.createdAt, now);
      const totalMin = Math.max(5, toFinite(order.estimatedTime, 15));
      const elapsed = msToMin(now - created);
      return { pct: lerpPct(lerp01(elapsed, totalMin), minPct, maxPct), label: "En cola" };
    }
    case "cooking": {
      const start = pickTs(order.cookingAt, order.createdAt) ?? now;
      const totalMin = Math.max(5, toFinite(order.estimatedTime, 15));
      const elapsed = msToMin(now - start);
      return { pct: lerpPct(lerp01(elapsed, totalMin), minPct, maxPct), label: "Cocinando" };
    }
    case "ready": {
      if (order.packUntil) {
        const remain = Math.max(0, order.packUntil - now);
        const elapsedMs = 90_000 - remain; // ventana 90s
        return { pct: lerpPct(lerp01(elapsedMs, 90_000), minPct, maxPct), label: "Empaque" };
      }
      return { pct: clampPercentage(maxPct ?? 95), label: "Listo" };
    }
    case "on_route":
      return { pct: clampPercentage(minPct), label: "En ruta" };
    case "delivered":
      return { pct: 100, label: "Entregado" };
    case "cancelled":
      return { pct: 0, label: "Cancelado" };
    default:
      return assertNever(status as never, "Estado no soportado");
  }
};

export const minutesLeftFor = (order: Order): number => {
  if (!order) return 0;
  const now = Date.now();
  const estMin = Math.max(5, toFinite(order.estimatedTime, 15));

  const s = normalizeStatus(order.status);
  if (s === "pending" || s === "cooking") {
    const created = toFinite(order.createdAt, now);
    const remain = Math.max(0, minToMs(estMin) - (now - created));
    return Math.ceil(msToMin(remain));
  }
  if (s === "ready" && order.packUntil) {
    return Math.ceil(msToMin(Math.max(0, order.packUntil - now)));
  }
  return 0;
};

export const etaFrom = (createdAt: number, minutes: number): number => {
  const end = createdAt + minToMs(minutes);
  return Math.max(0, Math.ceil(msToMin(end - Date.now())));
};

/* ========================= Selectores / filtros / orden ========================= */

export const getOrdersByStatus = (orders: Order[], status: Order["status"]): Order[] =>
  orders.filter(o => normalizeStatus(o.status) === normalizeStatus(status));

export const getOrdersByPaymentStatus = (orders: Order[], paymentStatus: Order["paymentStatus"]): Order[] =>
  orders.filter(o => o.paymentStatus === paymentStatus);

export const getActiveOrders = (orders: Order[]): Order[] =>
  orders.filter(o => normalizeStatus(o.status) !== "delivered");

export const sortOrdersByCreatedAt = (orders: Order[], descending = true): Order[] =>
  [...orders].sort((a, b) => (descending ? b.createdAt - a.createdAt : a.createdAt - b.createdAt));

export const isOrderOverdue = (order: Order): boolean => {
  if (normalizeStatus(order.status) === "delivered") return false;
  const estMin = Math.max(5, toFinite(order.estimatedTime, 15));
  const deadline = order.createdAt + minToMs(estMin);
  return Date.now() > deadline;
};

export const groupByStatus = (orders: Order[]): Record<Status, Order[]> => {
  const buckets: Record<Status, Order[]> = {
    pending: [], cooking: [], ready: [], on_route: [], delivered: [], cancelled: [],
  };
  for (const o of orders) buckets[normalizeStatus(o.status)].push(o);
  return buckets;
};

export const priorityCompare = (a: Order, b: Order): number => {
  const odA = isOrderOverdue(a), odB = isOrderOverdue(b);
  if (odA !== odB) return odA ? -1 : 1;

  const rank: Record<Status, number> = {
    cooking: 0, pending: 1, ready: 2, on_route: 3, delivered: 4, cancelled: 5,
  };
  const r = rank[normalizeStatus(a.status)] - rank[normalizeStatus(b.status)];
  if (r !== 0) return r;

  return a.createdAt - b.createdAt; // FIFO
};

/* ========================= Promos utils ========================= */

export const getPromotionById = (id: number): Promotion | undefined => PROMO_BY_ID.get(id);

export const applyExtraDiscount = (price: number, extraPct: number): number => {
  const p = Math.max(0, Math.min(100, extraPct));
  return Math.max(0, Math.round(price * (1 - p / 100)));
};

export const etaLabel = (order: Order): string => {
  if (normalizeStatus(order.status) === "delivered") return "Entregado";
  const left = minutesLeftFor(order);
  if (left <= 0) return normalizeStatus(order.status) === "ready" ? "Listo" : "~1 min";
  return `~${left} min`;
};
