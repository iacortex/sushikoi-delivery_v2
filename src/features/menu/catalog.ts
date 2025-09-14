// src/features/menu/catalog.ts

/* ===================== Tipos base del catálogo ===================== */
export type MenuId = number;

export interface MenuItem {
  id: MenuId;
  name: string;
  price: number;          // CLP
  time: number;           // minutos
  desc: string;
  soyIncluded: number;    // soya incluida por ítem (para promos)
  img: string;            // emoji/imagen simple para tarjetas
}

/* ===================== Catálogo ===================== */
/** Catálogo base (igual a tu versión, con nombres y precios vigentes) */
export const MENU_CATALOG: Record<MenuId, MenuItem> = {
  1001: { id: 1001, name: "KOI 1 (35 Bocados fríos)",        price: 21990, time: 18, desc: "Selección fría con salmón, camarón y kanikama", img: "🍣", soyIncluded: 4 },
  1002: { id: 1002, name: "PROMOCIÓN 1 (36 Bocados mixtos)", price: 21990, time: 22, desc: "Mix frío + frito (panko)",                       img: "🥢", soyIncluded: 4 },
  1003: { id: 1003, name: "KOI MIX (45 Bocados mixtos)",     price: 25990, time: 24, desc: "Envueltos + fritos panko",                       img: "🍱", soyIncluded: 5 },
  1004: { id: 1004, name: "KOI 54 (54 Bocados mixtos)",      price: 28990, time: 28, desc: "6 variedades entre envueltos y fritos",         img: "🧧", soyIncluded: 6 },

  1101: { id: 1101, name: "ACEVICHADO ROLL PREMIUM",         price:  9680, time: 10, desc: "Envuelto palta + ceviche, salsa acevichada",    img: "🔥", soyIncluded: 1 },
  1201: { id: 1201, name: "AVOCADO (ENV PALTA)",             price:  5990, time:  9, desc: "Queso crema, salmón",                           img: "🥑", soyIncluded: 1 },
  1202: { id: 1202, name: "FURAY ( Panko)",                  price:  6390, time: 11, desc: "Salmón, queso, cebollín",                       img: "🍤", soyIncluded: 1 },
  1203: { id: 1203, name: "PANKO POLLO QUESO PALTA",         price:  6200, time: 10, desc: "Pollo panko, queso, palta",                     img: "🍗", soyIncluded: 1 },
  1204: { id: 1204, name: "TORI (FRITO)",                    price:  5800, time: 10, desc: "Pollo, queso, morrón",                           img: "🍗", soyIncluded: 1 },

  1301: { id: 1301, name: "Korokes Salmón, queso (5u)",      price:  4690, time:  8, desc: "Croquetas crujientes de salmón",                img: "🟠", soyIncluded: 0 },
  1302: { id: 1302, name: "Korokes pollo queso (5u)",        price:  3600, time:  8, desc: "Croquetas crujientes de pollo",                 img: "🟡", soyIncluded: 0 },
  1401: { id: 1401, name: "Sashimi Sake (6 cortes)",         price:  4990, time:  6, desc: "Salmón fresco",                                 img: "🔪", soyIncluded: 0 },
  1501: { id: 1501, name: "Gyozas de Camarón (5u)",          price:  3990, time:  7, desc: "Empanaditas japonesas",                          img: "🥟", soyIncluded: 0 },
};

/* Helpers del catálogo */
export function getMenuItem(id: MenuId): MenuItem | undefined {
  return MENU_CATALOG[id];
}
export function listMenu(): MenuItem[] {
  return Object.values(MENU_CATALOG);
}

/* ===================== Negocio: alias y extras ===================== */
/** Alias → proteína real (según tus apuntes) */
export type ProteinAlias = "Sake" | "Tako" | "Ebi" | "Kani" | "Tori";
export type Protein =
  | "salmon"   // Sake
  | "pulpo"    // Tako
  | "camaron"  // Ebi
  | "kanikama" // Kani
  | "pollo";   // Tori

export const PROTEIN_ALIASES: Record<ProteinAlias, Protein> = {
  Sake: "salmon",
  Tako: "pulpo",
  Ebi:  "camaron",
  Kani: "kanikama",
  Tori: "pollo",
};

/** Verduras extra ($800 c/u) */
export const VEG_OPTIONS = [
  "tomate",
  "pepino",
  "ciboulette",
  "choclo",
  "palmito",
  "palta",
  "champiñon",
  "verdura salteada",
] as const;
export const VEG_EXTRA_FEE = 800;

/* ===================== Delivery (zonas y tarifas) ===================== */
/** Zonas frecuentes (puedes ampliar aquí y usarlas en toda la app) */
export interface DeliveryZone {
  value: string;
  label: string;
  fee: number; // CLP
}

export const DELIVERY_ZONES: DeliveryZone[] = [
  { value: "melihuen",        label: "Melihuen",             fee: 1500 },
  { value: "altotepual",      label: "Alto Tepual",          fee: 1500 },
  { value: "senderos_tepual", label: "Senderos del Tepual",  fee: 1500 },
  { value: "cardonal_bajo",   label: "Cardonal Bajo",        fee: 2500 },

  // zonas que ya usabas:
  { value: "lider_cardonal",  label: "Líder Cardonal",       fee: 3000 },
  { value: "lagunita_copec",  label: "Lagunita hasta Copec", fee: 2500 },
  { value: "lagunita",        label: "Lagunita",             fee: 3500 },
  { value: "bosquemar",       label: "Bosquemar",            fee: 3000 },
  { value: "mirasol",         label: "Mirasol",              fee: 3000 },
];

/* ===================== Reglas de cambio de proteína ===================== */
/**
 * Regla desde tus notas:
 * - pollo/kanikama → salmón/camarón  = +$2.500
 * - salmón/camarón → loco/pulpo      = +$4.000
 * - iguales o “hacia abajo”          = $0
 */
export function changeProteinFee(from?: Protein | "loco" | "pulpo", to?: Protein | "loco" | "pulpo"): number {
  if (!from || !to || from === to) return 0;
  const cheap = new Set<Protein | "loco" | "pulpo">(["pollo", "kanikama"]);
  const mid   = new Set<Protein | "loco" | "pulpo">(["salmon", "camaron"]);
  const high  = new Set<Protein | "loco" | "pulpo">(["loco", "pulpo"]);

  const bucket = (p: Protein | "loco" | "pulpo") => (cheap.has(p) ? 0 : mid.has(p) ? 1 : 2);
  const delta = bucket(to) - bucket(from);
  if (delta <= 0) return 0;
  if (delta === 1) return 2500;
  return 4000;
}
