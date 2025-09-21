// src/features/orders/helpers.ts
// Nivel: SENIOR/PREMIUM – robusto, puro y con fallbacks seguros.

// Dejamos solo Order desde tu módulo global
import type { Order } from "@/types";
import { clampPercentage } from "@/lib/format";
import { ORDER_STATUS_CONFIG } from "@/lib/constants";

/** Resultado de progreso para la UI */
export interface ProgressInfo {
  pct: number;   // 0..100 (entero)
  label: string; // texto como "En cola", "Cocinando", etc.
}

/** Tipo de promoción usado por PROMOTIONS */
export interface Promotion {
  id: number;
  name: string;
  description: string;
  items: string[];        // bullets para la composición
  originalPrice: number;  // precio sin descuento
  discountPrice: number;  // precio con descuento
  discount: number;       // % entero (ej. 15)
  image: string;          // emoji o URL
  popular: boolean;
  cookingTime: number;    // minutos estimados
}

/* ============================================================================
 * Utilidades internas (puras y tipadas)
 * ==========================================================================*/

/** Nunca debería pasar; útil para exhaustividad en switches */
const assertNever = (x: never, msg = "Unreachable"): never => {
  throw new Error(`${msg}: ${String(x)}`);
};

/** Numero seguro (evita NaN/Infinity) */
const toFinite = (n: unknown, fallback = 0): number =>
  typeof n === "number" && Number.isFinite(n) ? n : fallback;

/** Ms → minutos (float) */
const msToMin = (ms: number): number => ms / 60_000;

/** Minutos → ms */
const minToMs = (m: number): number => m * 60_000;

/** Lineal de A→B con clamp de 0..1 (si total <= 0 ⇒ 1) */
const lerp01 = (elapsed: number, total: number): number => {
  if (total <= 0) return 1;
  const r = elapsed / total;
  return r < 0 ? 0 : r > 1 ? 1 : r;
};

/** Lerp de porcentaje en un rango [minPct,maxPct] (0..100), clamped. */
const lerpPct = (t01: number, minPct: number, maxPct: number): number => {
  const min = toFinite(minPct, 0);
  const max = toFinite(maxPct, 100);
  const t = t01 < 0 ? 0 : t01 > 1 ? 1 : t01;
  return clampPercentage(min + (max - min) * t);
};

/** Extrae un número (ms) válido de un posible undefined */
const pickTs = (...candidates: Array<number | undefined | null>): number | undefined => {
  for (const c of candidates) if (typeof c === "number" && Number.isFinite(c)) return c;
  return undefined;
};

/* ============================================================================
 * Fallbacks de configuración (por si ORDER_STATUS_CONFIG no trae progressRange)
 * ==========================================================================*/

type Status = NonNullable<Order["status"]>;

/** Rangos de progreso por estado (fallback) */
const DEFAULT_PROGRESS_RANGES: Record<Status, readonly [number, number]> = {
  pending: [0, 25],
  cooking: [25, 85],
  ready: [85, 100],
  on_route: [90, 100],
  delivered: [100, 100],
  cancelled: [0, 0],
};

/** Obtiene rango [min,max] seguro desde constants o fallback */
const progressRangeFor = (status: Status): readonly [number, number] => {
  const cfg = (ORDER_STATUS_CONFIG as any)?.[status];
  const rng = cfg?.progressRange as readonly [number, number] | undefined;
  if (Array.isArray(rng) && rng.length === 2) return rng;
  return DEFAULT_PROGRESS_RANGES[status];
};

/* ============================================================================
 * Promos (data) + helpers de precio
 * ==========================================================================*/

/** % descuento entero, sin negativos */
const pct = (orig: number, now: number) =>
  Math.max(0, Math.round((1 - now / orig) * 100));

export const PROMOTIONS: Promotion[] = [
  {
    id: 1001,
    name: "KOI 1 (35 Bocados fríos)",
    description: "Selección fría con salmón, camarón y kanikama. Ideal para 2-3 personas.",
    items: [
      "9 Envuelto en palta: salmón, queso",
      "9 Envuelto en salmón: camarón, palta",
      "6 Hosomaki en nori: relleno salmón",
      "2 Nigiri: arroz cubierto de salmón",
      "9 Envuelto en sésamo: kanikama, palta",
    ],
    originalPrice: 23990,
    discountPrice: 21990,
    discount: pct(23990, 21990),
    image: "🍣",
    popular: false,
    cookingTime: 18,
  },
  {
    id: 1002,
    name: "PROMOCIÓN 1 (36 Bocados mixtos)",
    description: "Mix frío + frito (panko). Perfecta para compartir sin pelear por el último.",
    items: [
      "9 Envuelto en palta: queso, salmón",
      "9 California envuelto sésamo/ciboulette/merquén: palta, kanikama",
      "9 Frito Panko: salmón, cebollín, queso",
      "9 Frito Panko: pollo, morrón, queso",
    ],
    originalPrice: 23990,
    discountPrice: 21990,
    discount: pct(23990, 21990),
    image: "🔥",
    popular: true,
    cookingTime: 22,
  },
  {
    id: 1003,
    name: "KOI MIX (45 Bocados mixtos)",
    description: "Combo completo: envueltos + fritos (salmón, pollo y veggies).",
    items: [
      "9 Envuelto en palta: salmón, queso",
      "9 Envuelto en salmón: camarón, palta",
      "9 Frito Panko: pollo, queso, morrón",
      "9 Frito Panko: salmón, queso, cebollín",
      "9 Frito Panko: choclo, queso, morrón",
    ],
    originalPrice: 28990,
    discountPrice: 25990,
    discount: pct(28990, 25990),
    image: "🥢",
    popular: true,
    cookingTime: 25,
  },
  {
    id: 1004,
    name: "KOI 54 (54 Bocados mixtos)",
    description: "La mesa feliz: 6 variedades entre envueltos y fritos para 3-4 personas.",
    items: [
      "9 Envuelto en palta: camarón, queso, morrón",
      "9 Envuelto en queso: kanikama, palta",
      "9 Envuelto en nori: salmón, palta",
      "9 Frito Panko: salmón, queso, cebollín",
      "9 Frito Panko: pollo, queso, choclo",
      "9 Frito Panko: verduras salteadas, queso, palta",
    ],
    originalPrice: 31990,
    discountPrice: 28990,
    discount: pct(31990, 28990),
    image: "🎉",
    popular: true,
    cookingTime: 28,
  },
  {
    id: 1101,
    name: "ACEVICHADO ROLL PREMIUM",
    description:
      "Envuelto en palta con salmón y queso; topping ceviche y salsa acevichada. Autor: Maestro Francisco.",
    items: ["Roll premium con topping de ceviche", "Salsa acevichada de la casa"],
    originalPrice: 10990,
    discountPrice: 9680,
    discount: pct(10990, 9680),
    image: "🥑",
    popular: false,
    cookingTime: 16,
  },
  {
    id: 1201,
    name: "AVOCADO (Envuelto en Palta)",
    description: "Queso crema y salmón.",
    items: ["Roll 8-10 cortes (según gramaje)"],
    originalPrice: 6990,
    discountPrice: 5990,
    discount: pct(6990, 5990),
    image: "🥑",
    popular: false,
    cookingTime: 14,
  },
  {
    id: 1202,
    name: "FURAY (Panko)",
    description: "Salmón, queso, cebollín (roll frito panko).",
    items: ["Roll 8-10 cortes (según gramaje)"],
    originalPrice: 6990,
    discountPrice: 6390,
    discount: pct(6990, 6390),
    image: "🔥",
    popular: false,
    cookingTime: 15,
  },
  {
    id: 1203,
    name: "PANKO POLLO QUESO PALTA",
    description: "Roll frito panko con pollo, queso y palta.",
    items: ["Roll 8-10 cortes"],
    originalPrice: 6590,
    discountPrice: 6200,
    discount: pct(6590, 6200),
    image: "🍗",
    popular: false,
    cookingTime: 15,
  },
  {
    id: 1204,
    name: "TORI (FRITO)",
    description: "Pollo, queso, morrón (roll frito panko).",
    items: ["Roll 8-10 cortes"],
    originalPrice: 6290,
    discountPrice: 5800,
    discount: pct(6290, 5800),
    image: "🍗",
    popular: false,
    cookingTime: 15,
  },
  {
    id: 1301,
    name: "Korokes Salmón & Queso (5u)",
    description: "Croquetas crujientes rellenas de salmón y queso.",
    items: ["5 unidades"],
    originalPrice: 4990,
    discountPrice: 4690,
    discount: pct(4990, 4690),
    image: "🧆",
    popular: false,
    cookingTime: 8,
  },
  {
    id: 1302,
    name: "Korokes Pollo & Queso (5u)",
    description: "Croquetas crujientes de pollo con queso.",
    items: ["5 unidades"],
    originalPrice: 3990,
    discountPrice: 3600,
    discount: pct(3990, 3600),
    image: "🧆",
    popular: false,
    cookingTime: 8,
  },
  {
    id: 1401,
    name: "Sashimi Sake",
    description: "Cortes de salmón fresco (elige 6 / 9 / 12 cortes).",
    items: ["Desde 6 cortes (precio base)"],
    originalPrice: 5490,
    discountPrice: 4990,
    discount: pct(5490, 4990),
    image: "🐟",
    popular: false,
    cookingTime: 10,
  },
  {
    id: 1501,
    name: "Gyozas de Camarón (5u)",
    description: "Empanaditas japonesas rellenas de camarón.",
    items: ["5 unidades"],
    originalPrice: 4290,
    discountPrice: 3990,
    discount: pct(4290, 3990),
    image: "🥟",
    popular: false,
    cookingTime: 7,
  },
];

/** Índice rápido de promociones por id (O(1)) */
export const PROMO_BY_ID: ReadonlyMap<number, Promotion> = new Map(
  PROMOTIONS.map((p) => [p.id, p])
);

/* ============================================================================
 * PROGRESO / TIEMPOS
 * ==========================================================================*/

/**
 * Calcula progreso visual de la orden (0..100) + label semántico.
 * – Evita “undefined is not iterable” con fallbacks.
 * – Lineal por etapa usando timestamps reales cuando existen.
 */
export const progressFor = (order: Order): ProgressInfo => {
  if (!order) return { pct: 0, label: "—" };

  const now = Date.now();
  const status = order.status as Status;
  const [minPct, maxPct] = progressRangeFor(status);

  switch (status) {
    case "pending": {
      const created = toFinite(order.createdAt, now);
      const totalMin = Math.max(5, toFinite(order.estimatedTime, 15));
      const elapsed = msToMin(now - created);
      return {
        pct: lerpPct(lerp01(elapsed, totalMin), minPct, maxPct),
        label: "En cola",
      };
    }
    case "cooking": {
      const cookingStart = pickTs(order.cookingAt, order.createdAt) ?? now;
      const totalMin = Math.max(5, toFinite(order.estimatedTime, 15));
      const elapsed = msToMin(now - cookingStart);
      return {
        pct: lerpPct(lerp01(elapsed, totalMin), minPct, maxPct),
        label: "Cocinando",
      };
    }
    case "ready": {
      // Si existe packUntil, usa una ventana de 90s “en empaque”
      if (order.packUntil) {
        const remain = Math.max(0, order.packUntil - now);
        const elapsedMs = 90_000 - remain; // total 90s
        return {
          pct: lerpPct(lerp01(elapsedMs, 90_000), minPct, maxPct),
          label: "Empaque",
        };
      }
      return { pct: clampPercentage(maxPct ?? 95), label: "Listo" };
    }
    case "on_route": {
      // Si quieres algo dinámico, puedes usar un ETA de delivery aquí.
      return { pct: clampPercentage(minPct), label: "En ruta" };
    }
    case "delivered":
      return { pct: 100, label: "Entregado" };
    case "cancelled":
      return { pct: 0, label: "Cancelado" };
    default:
      return assertNever(status, "Estado no soportado");
  }
};

/** Minutos restantes estimados para completar la orden */
export const minutesLeftFor = (order: Order): number => {
  if (!order) return 0;

  const now = Date.now();
  const estMin = Math.max(5, toFinite(order.estimatedTime, 15));

  if (order.status === "pending" || order.status === "cooking") {
    const created = toFinite(order.createdAt, now);
    const totalMs = minToMs(estMin);
    const remain = Math.max(0, totalMs - (now - created));
    return Math.ceil(msToMin(remain));
  }

  if (order.status === "ready" && order.packUntil) {
    return Math.ceil(msToMin(Math.max(0, order.packUntil - now)));
  }

  return 0;
};

/** ETA en minutos a partir de un createdAt + minutos estimados */
export const etaFrom = (createdAt: number, minutes: number): number => {
  const end = createdAt + minToMs(minutes);
  return Math.max(0, Math.ceil(msToMin(end - Date.now())));
};

/* ============================================================================
 * SELECTORES / FILTROS / SORTERS
 * ==========================================================================*/

export const getOrdersByStatus = (orders: Order[], status: Order["status"]): Order[] =>
  orders.filter((o) => o.status === status);

export const getOrdersByPaymentStatus = (
  orders: Order[],
  paymentStatus: Order["paymentStatus"]
): Order[] => orders.filter((o) => o.paymentStatus === paymentStatus);

export const getActiveOrders = (orders: Order[]): Order[] =>
  orders.filter((o) => o.status !== "delivered");

export const sortOrdersByCreatedAt = (orders: Order[], descending = true): Order[] =>
  [...orders].sort((a, b) =>
    descending ? b.createdAt - a.createdAt : a.createdAt - b.createdAt
  );

/** ¿Se pasó del tiempo estimado (si no está entregada)? */
export const isOrderOverdue = (order: Order): boolean => {
  if (order.status === "delivered") return false;
  const estMin = Math.max(5, toFinite(order.estimatedTime, 15));
  const deadline = order.createdAt + minToMs(estMin);
  return Date.now() > deadline;
};

/** Agrupa por estado (útil para la vista de cocina) */
export const groupByStatus = (orders: Order[]): Record<Status, Order[]> => {
  const map = {
    pending: [] as Order[],
    cooking: [] as Order[],
    ready: [] as Order[],
    on_route: [] as Order[],
    delivered: [] as Order[],
    cancelled: [] as Order[],
  };
  for (const o of orders) {
    (map[o.status as Status] ?? map.pending).push(o);
  }
  return map;
};

/** Orden de prioridad sugerido para cocina (tunéalo si quieres) */
export const priorityCompare = (a: Order, b: Order): number => {
  // 1) overdue primero
  const odA = isOrderOverdue(a);
  const odB = isOrderOverdue(b);
  if (odA !== odB) return odA ? -1 : 1;

  // 2) estado (cooking > pending > ready > on_route > delivered/cancelled)
  const rank: Record<Status, number> = {
    cooking: 0,
    pending: 1,
    ready: 2,
    on_route: 3,
    delivered: 4,
    cancelled: 5,
  };
  const r = rank[a.status as Status] - rank[b.status as Status];
  if (r !== 0) return r;

  // 3) más antiguo primero (FIFO dentro de la misma prioridad)
  return a.createdAt - b.createdAt;
};

/* ============================================================================
 * PROMOS / UTILIDADES
 * ==========================================================================*/

export const getPromotionById = (id: number): Promotion | undefined =>
  PROMO_BY_ID.get(id);

/** Precio final con descuento en porcentaje adicional (ej.: cupones) */
export const applyExtraDiscount = (price: number, extraPct: number): number => {
  const p = Math.max(0, Math.min(100, extraPct));
  return Math.max(0, Math.round(price * (1 - p / 100)));
};

/** Texto humano para ETA: “~12 min”, “Listo”, “Entregado” */
export const etaLabel = (order: Order): string => {
  if (order.status === "delivered") return "Entregado";
  const left = minutesLeftFor(order);
  if (left <= 0) return order.status === "ready" ? "Listo" : "~1 min";
  return `~${left} min`;
};
