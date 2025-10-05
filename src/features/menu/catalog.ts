// src/features/menu/catalog.ts
export type MenuType = "promo" | "individual";

export interface MenuItem {
  id: number;
  type: MenuType;
  name: string;
  price: number;        // CLP
  time?: number;        // minutos estimados (UI)
  desc?: string;
  category: string;     // "PROMOCIONES" | "PRODUCTOS INDIVIDUALES"
  subgroup?: string;    // subcategoría visible
  tags?: string[];      // para buscador/filtros
  emoji?: string;       // mini icono visual
}

/** ====== Admin DB (compat para MenuAdminEditor) ====== */
export type MenuDB = {
  items: MenuItem[];
  updatedAt: number;
};

const STORAGE_KEY = "KOI_MENU_DB_V1";

/** Event bus simple para hot updates */
type MenuListener = (db: MenuDB) => void;
const MENU_LISTENERS = new Set<MenuListener>();
export function subscribeMenu(cb: MenuListener): () => void {
  MENU_LISTENERS.add(cb);
  return () => MENU_LISTENERS.delete(cb);
}
function notifyMenuUpdated(db: MenuDB) {
  MENU_LISTENERS.forEach((cb) => {
    try { cb(db); } catch {}
  });
}

/** Lee del storage o retorna el default. */
export function getMenuDB(): MenuDB {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<MenuDB>;
      if (Array.isArray(parsed?.items)) {
        return {
          items: parsed.items as MenuItem[],
          updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : Date.now(),
        };
      }
    }
  } catch {}
  return { items: DEFAULT_MENU, updatedAt: Date.now() };
}

/** Guarda y actualiza runtime + notifica listeners. */
export async function saveMenuDB(db: MenuDB): Promise<MenuDB> {
  const clean: MenuDB = {
    items: Array.isArray(db.items) ? db.items : DEFAULT_MENU,
    updatedAt: Date.now(),
  };
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
    }
  } catch {}
  RUNTIME_MENU = clean.items.slice();     // refresca runtime
  notifyMenuUpdated(clean);               // notifica
  return clean;
}

/** Acceso central al menú vigente (persistido o default). */
function currentMenu(): MenuItem[] {
  if (RUNTIME_MENU.length) return RUNTIME_MENU;
  const db = getMenuDB();
  RUNTIME_MENU = db.items.slice();
  return RUNTIME_MENU;
}

// ======= Zonas de delivery (usadas en PromotionDetailModal) =======
export const DELIVERY_ZONES: Record<string, number> = {
  "Centro": 1500,
  "Chinquihue": 2000,
  "Mirasol": 2500,
  "Alto La Paloma": 2500,
  "Alerce": 3500,
  "Valle Volcanes": 2500,
  "Libertad": 2000,
  "Angelmo": 2000,
  "Av. Presidente Ibáñez": 2000,
  "Cardonal": 2500,
};

// ================== Catálogo base (DEFAULT_MENU) ==================
let _id = 1000;
const ID = () => ++_id;

const P = (name: string, price: number, subgroup: string, desc?: string, emoji = "🎉", time = 15): MenuItem => ({
  id: ID(), type: "promo", name, price, time, desc,
  category: "PROMOCIONES", subgroup, tags: [name, subgroup, "promo", "promoción"], emoji,
});
const I = (name: string, price: number, subgroup: string, desc?: string, emoji = "🍣", time = 12): MenuItem => ({
  id: ID(), type: "individual", name, price, time, desc,
  category: "PRODUCTOS INDIVIDUALES", subgroup, tags: [name, subgroup, "individual"], emoji,
});

/* ===================== PROMOCIONES ===================== */
// FRITOS — Mixtos
const promosFritosMixtos: MenuItem[] = [
  P("Promo Fritos 36 (4 variedades x9)", 23990, "PROMOCIONES DE FRITOS • Fritos Mixtos", "36 bocados", "🔥"),
  P("Promo Fritos 45 (5 variedades x9)", 26990, "PROMOCIONES DE FRITOS • Fritos Mixtos", "45 bocados", "🔥"),
  P("Promo Fritos 54 (6 variedades x9)", 29990, "PROMOCIONES DE FRITOS • Fritos Mixtos", "54 bocados", "🔥"),
  P("Promo Fritos 63 (7 variedades x9)", 31990, "PROMOCIONES DE FRITOS • Fritos Mixtos", "63 bocados", "🔥"),
];
// FRITOS — Solo Pollo
const promosFritosPollo: MenuItem[] = [
  P("Promo Fritos 36 Solo Pollo", 24990, "PROMOCIONES DE FRITOS • Fritos Solo Pollo", undefined, "🍗"),
  P("Promo Fritos 45 Solo Pollo", 27990, "PROMOCIONES DE FRITOS • Fritos Solo Pollo", undefined, "🍗"),
  P("Promo Fritos 54 Solo Pollo", 30990, "PROMOCIONES DE FRITOS • Fritos Solo Pollo", undefined, "🍗"),
  P("Promo Fritos 63 Solo Pollo", 32990, "PROMOCIONES DE FRITOS • Fritos Solo Pollo", undefined, "🍗"),
];

// MIXTO — Pequeñas (27–36)
const promosPeq: MenuItem[] = [
  P("Promo Sushi Sin Arroz (27 bocados)", 24990, "PROMOCIONES DE SUSHI MIXTO • Promociones Pequeñas", undefined, "🥢"),
  P("KOI 1 (35 bocados fríos)", 21990, "PROMOCIONES DE SUSHI MIXTO • Promociones Pequeñas"),
  P("KOI 2 (35 bocados mixtos)", 23990, "PROMOCIONES DE SUSHI MIXTO • Promociones Pequeñas"),
  P("KOI Chicken (36 bocados)", 21990, "PROMOCIONES DE SUSHI MIXTO • Promociones Pequeñas", undefined, "🐔"),
  P("KOI Hot (27 bocados + 5 korokes)", 21990, "PROMOCIONES DE SUSHI MIXTO • Promociones Pequeñas", undefined, "🔥"),
  P("Promoción 1 (36 bocados)", 21990, "PROMOCIONES DE SUSHI MIXTO • Promociones Pequeñas"),
];
// MIXTO — Medianas (42–54)
const promosMed: MenuItem[] = [
  P("Tako Fish (42 bocados)", 28990, "PROMOCIONES DE SUSHI MIXTO • Promociones Medianas", undefined, "🐙"),
  P("KOI 2.0 (44 bocados)", 26990, "PROMOCIONES DE SUSHI MIXTO • Promociones Medianas"),
  P("KOI 2.5 (45 bocados)", 25990, "PROMOCIONES DE SUSHI MIXTO • Promociones Medianas"),
  P("KOI Mix (45 bocados)", 25990, "PROMOCIONES DE SUSHI MIXTO • Promociones Medianas"),
  P("KOI Colors (45 bocados)", 26990, "PROMOCIONES DE SUSHI MIXTO • Promociones Medianas", undefined, "🌈"),
  P("Promoción 2 (45 bocados)", 25990, "PROMOCIONES DE SUSHI MIXTO • Promociones Medianas"),
  P("Promoción 3 (51 bocados)", 28990, "PROMOCIONES DE SUSHI MIXTO • Promociones Medianas"),
  P("KOI 3.0 (53 bocados)", 28990, "PROMOCIONES DE SUSHI MIXTO • Promociones Medianas"),
  P("KOI 54 (54 bocados)", 28990, "PROMOCIONES DE SUSHI MIXTO • Promociones Medianas"),
];
// MIXTO — Grandes (62–110)
const promosGrandes: MenuItem[] = [
  P("KOI 3 Especial (62 bocados)", 33990, "PROMOCIONES DE SUSHI MIXTO • Promociones Grandes"),
  P("KOI Montt (63 bocados)", 33990, "PROMOCIONES DE SUSHI MIXTO • Promociones Grandes"),
  P("Full KOI (82 bocados)", 41990, "PROMOCIONES DE SUSHI MIXTO • Promociones Grandes", undefined, "🧧"),
  P("Promo 100 (100 bocados)", 48990, "PROMOCIONES DE SUSHI MIXTO • Promociones Grandes", undefined, "💯"),
  P("KOI 4 (110 bocados)", 51990, "PROMOCIONES DE SUSHI MIXTO • Promociones Grandes"),
];
// Tortas sushi (24h)
const promosTortas: MenuItem[] = [
  P("Torta Sushi 70", 39990, "PROMOCIONES DE SUSHI MIXTO • Tortas Sushi (24hrs)", "Anticipación 24 hrs", "🎂"),
  P("Torta Sushi 100", 51990, "PROMOCIONES DE SUSHI MIXTO • Tortas Sushi (24hrs)", "Anticipación 24 hrs", "🎂"),
];

const PROMOS: MenuItem[] = [
  ...promosFritosMixtos,
  ...promosFritosPollo,
  ...promosPeq,
  ...promosMed,
  ...promosGrandes,
  ...promosTortas,
];

/* ===================== INDIVIDUALES ===================== */
// ENTRADAS Y APERITIVOS
const entradas: MenuItem[] = [
  I("Arrollados Primavera (5 unidades)", 3200, "ENTRADAS Y APERITIVOS", "", "🥟"),
  I("Ebi Furay (5 camarones)", 5190, "ENTRADAS Y APERITIVOS", "", "🍤"),
  I("Palitos de Pollo Furay (5 unidades)", 4290, "ENTRADAS Y APERITIVOS", "", "🍗"),
  I("Tequeños (5 unidades)", 3990, "ENTRADAS Y APERITIVOS", "", "🧀"),
  I("Empanadas de Queso (6 unidades)", 4290, "ENTRADAS Y APERITIVOS", "", "🧀"),
];

// PLATOS PRINCIPALES
const platos: MenuItem[] = [
  I("Ceviche (500g)", 9990, "PLATOS PRINCIPALES", "", "🥗"),
  I("Gohan", 8990, "PLATOS PRINCIPALES", "", "🍚"),
  I("Ramen", 5990, "PLATOS PRINCIPALES", "", "🍜"),
  I("Yakimeshi", 6290, "PLATOS PRINCIPALES", "", "🍚"),
  I("Yakisoba", 6290, "PLATOS PRINCIPALES", "", "🍝"),
];

// SUSHI BURGERS (incluye bebida)
const burgers: MenuItem[] = [
  I("Sushi Burger Pollo (incluye bebida)", 8990, "SUSHI BURGERS (incluye bebida)", "", "🍔"),
  I("Sushi Burger Vegetariana (incluye bebida)", 8990, "SUSHI BURGERS (incluye bebida)", "", "🥬"),
  I("Sushi Burger Salmón (incluye bebida)", 8990, "SUSHI BURGERS (incluye bebida)", "", "🐟"),
];

// HANDROLLS
const handrolls: MenuItem[] = [
  I("Handroll de Pulpo", 6000, "HANDROLLS"),
  I("Handroll Salmón Queso Cebollín", 5500, "HANDROLLS"),
  I("Handroll Salmón Queso Palta", 5500, "HANDROLLS"),
  I("Handroll Camarón Queso Cebollín", 5500, "HANDROLLS"),
  I("Handroll Camarón Queso Palta", 5500, "HANDROLLS"),
  I("Handroll Vegetariano", 5000, "HANDROLLS"),
  I("Handroll Pollo Queso Cebollín", 4600, "HANDROLLS"),
  I("Handroll Pollo Queso Palta", 4600, "HANDROLLS"),
  I("Handroll Kanikama Queso Cebollín", 4600, "HANDROLLS"),
  I("Handroll Kanikama Queso Palta", 4600, "HANDROLLS"),
];

// ROLLS PREMIUM (9)
const rollsPremium: MenuItem[] = [
  I("Fusion Tako Roll (9)", 9680, "ROLLS PREMIUM (9 bocados)"),
  I("Acevichado Roll Premium (9)", 9680, "ROLLS PREMIUM (9 bocados)"),
  I("Crispi Banana Roll (9)", 8990, "ROLLS PREMIUM (9 bocados)"),
  I("Takoyaki Roll (9)", 8990, "ROLLS PREMIUM (9 bocados)"),
  I("Deleite Koi (9)", 8990, "ROLLS PREMIUM (9 bocados)"),
  I("Tocino Furay Premium (9)", 8990, "ROLLS PREMIUM (9 bocados)"),
  I("Arcoíris Tako Loco (9)", 8790, "ROLLS PREMIUM (9 bocados)"),
  I("Tako Koi Premium (9)", 8790, "ROLLS PREMIUM (9 bocados)"),
  I("Mango Roll (9)", 8690, "ROLLS PREMIUM (9 bocados)"),
  I("Saltado Roll (9)", 8490, "ROLLS PREMIUM (9 bocados)"),
  I("Sin Arroz Surimi Roll (9)", 8490, "ROLLS PREMIUM (9 bocados)", "Sin arroz"),
  I("Loco Ebi Furay (9)", 8490, "ROLLS PREMIUM (9 bocados)"),
  I("Orochimaru Roll (9)", 8390, "ROLLS PREMIUM (9 bocados)"),
  I("Roll Gratinado (9)", 7990, "ROLLS PREMIUM (9 bocados)"),
  I("Tropical Roll (9)", 7890, "ROLLS PREMIUM (9 bocados)"),
  I("Futomaki Atún (9)", 7820, "ROLLS PREMIUM (9 bocados)"),
  I("Maguro Ebi (9)", 7800, "ROLLS PREMIUM (9 bocados)"),
  I("Premium Denki Furay (9)", 7690, "ROLLS PREMIUM (9 bocados)"),
  I("Futomaki Furay (9)", 7390, "ROLLS PREMIUM (9 bocados)"),
  I("Almendrado (9)", 6990, "ROLLS PREMIUM (9 bocados)"),
  I("Arcoíris Taki Taki (9)", 6600, "ROLLS PREMIUM (9 bocados)"),
];

// ROLLS ENVUELTOS EN PALTA (9)
const rollsPalta: MenuItem[] = [
  I("Hen (9)", 7590, "ROLLS ENVUELTOS EN PALTA (9 bocados)"),
  I("Crazy Cheese (9)", 7490, "ROLLS ENVUELTOS EN PALTA (9 bocados)"),
  I("Ebimako (9)", 7190, "ROLLS ENVUELTOS EN PALTA (9bocadoss)"),
  I("Tako Massago (9)", 7000, "ROLLS ENVUELTOS EN PALTA (9 bocados)"),
  I("Ebitem (9)", 6690, "ROLLS ENVUELTOS EN PALTA (9 bocados)"),
  I("Amenizu (9)", 6590, "ROLLS ENVUELTOS EN PALTA (9 bocados)"),
  I("Kanisake (9)", 6490, "ROLLS ENVUELTOS EN PALTA (9 bocados)"),
  I("Ebichesse (9)", 6390, "ROLLS ENVUELTOS EN PALTA (9 bocados)"),
  I("Ebikarai (9)", 6390, "ROLLS ENVUELTOS EN PALTA (9 bocados)"),
  I("Sake Spicy (9)", 6290, "ROLLS ENVUELTOS EN PALTA (9 bocados)"),
  I("Sake Ahumado (9)", 6200, "ROLLS ENVUELTOS EN PALTA (9 bocados)"),
  I("Core (9)", 6000, "ROLLS ENVUELTOS EN PALTA (9 bocados)"),
  I("Avocado (9)", 5990, "ROLLS ENVUELTOS EN PALTA (9 bocados)"),
  I("Toricheese (9)", 5800, "ROLLS ENVUELTOS EN PALTA (9 bocados)"),
  I("Juju (9)", 5690, "ROLLS ENVUELTOS EN PALTA (9 bocados)"),
  I("Yasai (9)", 5490, "ROLLS ENVUELTOS EN PALTA (9 bocados)"),
];

// ROLLS ENVUELTOS EN SALMÓN (9)
const rollsSalmon: MenuItem[] = [
  I("Chispi (9)", 7890, "ROLLS ENVUELTOS EN SALMÓN (9 unidades)"),
  I("Kyoki (9)", 7800, "ROLLS ENVUELTOS EN SALMÓN (9 unidades)"),
  I("Loco Avocado (9)", 7700, "ROLLS ENVUELTOS EN SALMÓN (9 unidades)"),
  I("Rafa (9)", 6790, "ROLLS ENVUELTOS EN SALMÓN (9 unidades)"),
  I("Denki (9)", 6700, "ROLLS ENVUELTOS EN SALMÓN (9 unidades)"),
  I("Hitomi (9)", 6490, "ROLLS ENVUELTOS EN SALMÓN (9 unidades)"),
  I("Ebi Spicy (9)", 6490, "ROLLS ENVUELTOS EN SALMÓN (9 unidades)"),
  I("Sake (9)", 6490, "ROLLS ENVUELTOS EN SALMÓN (9 unidades)"),
  I("Kani (9)", 6000, "ROLLS ENVUELTOS EN SALMÓN (9 unidades)"),
  I("Kappa (9)", 5790, "ROLLS ENVUELTOS EN SALMÓN (9 unidades)"),
];

// CALIFORNIA (9)
const california: MenuItem[] = [
  I("California Crazy (9)", 7590, "CALIFORNIA ROLLS (9 unidades)"),
  I("California Tempura (9)", 6700, "CALIFORNIA ROLLS (9 unidades)"),
  I("California Ebi (9)", 6500, "CALIFORNIA ROLLS (9 unidades)"),
  I("California Sake (9)", 6290, "CALIFORNIA ROLLS (9 unidades)"),
  I("California Sake Spicy (9)", 6000, "CALIFORNIA ROLLS (9 unidades)"),
  I("California Tori (9)", 5600, "CALIFORNIA ROLLS (9 unidades)"),
  I("California Roll (9)", 5490, "CALIFORNIA ROLLS (9 unidades)"),
  I("California Natura (9)", 5390, "CALIFORNIA ROLLS (9 unidades)"),
  I("California Vegeta (9)", 5290, "CALIFORNIA ROLLS (9 unidades)"),
];

// QUESO (9)
const queso: MenuItem[] = [
  I("Gomablanc (9)", 7690, "ROLLS ENVUELTOS EN QUESO (9 unidades)"),
  I("Cocoloco (9)", 7600, "ROLLS ENVUELTOS EN QUESO (9 unidades)"),
  I("Sake Ebi (9)", 7000, "ROLLS ENVUELTOS EN QUESO (9 unidades)"),
  I("Topi (9)", 6900, "ROLLS ENVUELTOS EN QUESO (9 unidades)"),
  I("Julu (9)", 6700, "ROLLS ENVUELTOS EN QUESO (9 unidades)"),
  I("Pame (9)", 6690, "ROLLS ENVUELTOS EN QUESO (9 unidades)"),
  I("Sakecheese (9)", 6300, "ROLLS ENVUELTOS EN QUESO (9 unidades)"),
  I("Tory Snow (9)", 6200, "ROLLS ENVUELTOS EN QUESO (9 unidades)"),
];

// ARCOÍRIS (9)
const rainbow: MenuItem[] = [
  I("Arcoíris 3 (9)", 7800, "ROLLS ARCOÍRIS (9 unidades)"),
  I("Arcoíris 5 (9)", 7890, "ROLLS ARCOÍRIS (9 unidades)"),
  I("Arcoíris 4 (9)", 7690, "ROLLS ARCOÍRIS (9 unidades)"),
  I("Arcoíris 1 (9)", 6900, "ROLLS ARCOÍRIS (9 unidades)"),
  I("Arcoíris 2 (9)", 6800, "ROLLS ARCOÍRIS (9 unidades)"),
];

// FUTOMAKI (9)
const futomaki: MenuItem[] = [
  I("Futomaki Tako Avocado (9)", 7690, "FUTOMAKI (9 unidades)"),
  I("Futomaki Loco (9)", 7500, "FUTOMAKI (9 unidades)"),
  I("Futomaki Ebi Avocado (9)", 7000, "FUTOMAKI (9 unidades)"),
  I("Futomaki Sake Avocado (9)", 6490, "FUTOMAKI (9 unidades)"),
  I("Futomaki Sake Fresh (9)", 6490, "FUTOMAKI (9 unidades)"),
  I("Futomaki Tori Avocado (9)", 6190, "FUTOMAKI (9 unidades)"),
  I("Futomaki Vegeta (9)", 5790, "FUTOMAKI (9 unidades)"),
];

// SIN ARROZ (9)
const sinArroz: MenuItem[] = [
  I("Sin Arroz Frito Pulpo (9)", 8030, "ROLLS SIN ARROZ (9 unidades)", "Sin arroz", "🥢"),
  I("Sin Arroz Envuelto en Salmón (9)", 7690, "ROLLS SIN ARROZ (9 unidades)", "Sin arroz", "🥢"),
  I("Sin Arroz Envuelto en Palta (9)", 6990, "ROLLS SIN ARROZ (9 unidades)", "Sin arroz", "🥢"),
  I("Sin Arroz Frito Kani Sake (9)", 6930, "ROLLS SIN ARROZ (9 unidades)", "Sin arroz", "🥢"),
  I("Sin Arroz Vegetariano (9)", 5940, "ROLLS SIN ARROZ (9 unidades)", "Sin arroz", "🥢"),
];

// FRITOS PANKO (9)
const fritosPanko: MenuItem[] = [
  I("Pulpo Furay (9)", 7200, "ROLLS FRITOS PANKO (9 unidades)", "", "🔥"),
  I("Loco Furay (9)", 7200, "ROLLS FRITOS PANKO (9 unidades)", "", "🔥"),
  I("Ebisake (9)", 6900, "ROLLS FRITOS PANKO (9 unidades)", "", "🔥"),
  I("Smokefried (9)", 6790, "ROLLS FRITOS PANKO (9 unidades)", "", "🔥"),
  I("Ebirroll (9)", 6590, "ROLLS FRITOS PANKO (9 unidades)", "", "🔥"),
  I("Furay (9)", 6390, "ROLLS FRITOS PANKO (9 unidades)", "", "🔥"),
  I("Panko Pollo Queso Palta (9)", 6200, "ROLLS FRITOS PANKO (9 unidades)", "", "🔥"),
  I("Kanikama Furay (9)", 6100, "ROLLS FRITOS PANKO (9 unidades)", "", "🔥"),
  I("Vegeta Furay 2 (9)", 5900, "ROLLS FRITOS PANKO (9 unidades)", "", "🔥"),
  I("Tori (9)", 5800, "ROLLS FRITOS PANKO (9 unidades)", "", "🔥"),
  I("Toriweed (9)", 5800, "ROLLS FRITOS PANKO (9 unidades)", "", "🔥"),
  I("Vegeta Furay 3 (9)", 5590, "ROLLS FRITOS PANKO (9 unidades)", "", "🔥"),
  I("Vegeta Furay 1 (9)", 5500, "ROLLS FRITOS PANKO (9 unidades)", "", "🔥"),
];

// VEGETARIANOS (9)
const vegetarianos: MenuItem[] = [
  I("Vegeta 4 (9)", 5890, "ROLLS VEGETARIANOS (9 unidades)", "", "🥬"),
  I("Vegeta 2 (9)", 5600, "ROLLS VEGETARIANOS (9 unidades)", "", "🥬"),
  I("Vegeta 3 (9)", 4990, "ROLLS VEGETARIANOS (9 unidades)", "", "🥬"),
  I("Vegeta 1 (9)", 4500, "ROLLS VEGETARIANOS (9 unidades)", "", "🥬"),
];

// HOSOMAKI (6)
const hosomaki: MenuItem[] = [
  I("Hosomaki Loco Avocado (6)", 5100, "HOSOMAKI (6 unidades)"),
  I("Hosomaki Loco (6)", 4490, "HOSOMAKI (6 unidades)"),
  I("Hosomaki Atún (6)", 4350, "HOSOMAKI (6 unidades)"),
  I("Hosomaki Tako (6)", 4350, "HOSOMAKI (6 unidades)"),
  I("Hosomaki Ebi Avocado (6)", 3990, "HOSOMAKI (6 unidades)"),
  I("Hosomaki Sake Avocado (6)", 3790, "HOSOMAKI (6 unidades)"),
  I("Hosomaki Ebi (6)", 3500, "HOSOMAKI (6 unidades)"),
  I("Hosomaki Sake (6)", 3490, "HOSOMAKI (6 unidades)"),
  I("Hosomaki Cheese (6)", 3100, "HOSOMAKI (6 unidades)"),
  I("Hosomaki Veggie (6)", 2990, "HOSOMAKI (6 unidades)"),
  I("Hosomaki Maki (6)", 2900, "HOSOMAKI (6 unidades)"),
  I("Hosomaki Fresh (6)", 2800, "HOSOMAKI (6 unidades)"),
];

// KOROKES (5)
const korokes: MenuItem[] = [
  I("Korokes Pulpo Queso (5)", 5600, "KOROKES (5 unidades)", "", "🟠"),
  I("Korokes Camarón Queso Choclo (5)", 5100, "KOROKES (5 unidades)", "", "🟠"),
  I("Korokes Pollo Queso Champiñón (5)", 5000, "KOROKES (5 unidades)", "", "🟠"),
  I("Korokes Camarón Queso (5)", 4950, "KOROKES (5 unidades)", "", "🟠"),
  I("Korokes Salmón Queso (5)", 4690, "KOROKES (5 unidades)", "", "🟠"),
  I("Korokes Pollo Queso Choclo (5)", 4000, "KOROKES (5 unidades)", "", "🟠"),
  I("Korokes Pollo Queso (5)", 3600, "KOROKES (5 unidades)", "", "🟠"),
  I("Korokes Solo Arroz (5)", 3400, "KOROKES (5 unidades)", "", "🟠"),
];

// ONIGIRI (4)
const onigiri: MenuItem[] = [
  I("Onigiri Atún (4)", 5590, "ONIGIRI (4 unidades)"),
  I("Onigiri Ebi (4)", 5290, "ONIGIRI (4 unidades)"),
  I("Onigiri Sake (4)", 4990, "ONIGIRI (4 unidades)"),
  I("Onigiri Tory (4)", 4000, "ONIGIRI (4 unidades)"),
  I("Onigiri Cheese (4)", 3900, "ONIGIRI (4 unidades)"),
];

// GYOZAS (5)
const gyozas: MenuItem[] = [
  I("Gyozas de Camarón (5)", 3990, "GYOZAS (5 unidades)"),
  I("Gyozas de Cerdo (5)", 3990, "GYOZAS (5 unidades)"),
  I("Gyozas de Pollo (5)", 3990, "GYOZAS (5 unidades)"),
  I("Gyozas de Verdura (5)", 3990, "GYOZAS (5 unidades)"),
];

// NIGIRI (2)
const nigiri: MenuItem[] = [
  I("Nigiri Tako (2)", 4000, "NIGIRI (2 unidades)"),
  I("Nigiri Ebi (2)", 3800, "NIGIRI (2 unidades)"),
  I("Nigiri Sake (2)", 2990, "NIGIRI (2 unidades)"),
];

// SASHIMI
const sashimi: MenuItem[] = [
  I("Sashimi Sake (desde)", 4990, "SASHIMI", "Desde 200g/según disponibilidad", "🧊"),
];

// OMAKASE KOI (solo para servir)
const omakase: MenuItem[] = [
  I("Fusión Tricolor (5 cortes)", 8990, "OMAKASE KOI (Solo para servir)"),
  I("Mango Cheese Roll (9 cortes)", 7290, "OMAKASE KOI (Solo para servir)"),
  I("Fresh Koi Roll (5 cortes)", 6590, "OMAKASE KOI (Solo para servir)"),
  I("Nigiri Koi (4 unidades)", 6000, "OMAKASE KOI (Solo para servir)"),
  I("Koroke Koi Sake (4 unidades)", 5500, "OMAKASE KOI (Solo para servir)"),
  I("Koroke Koi Tako (4 unidades)", 5500, "OMAKASE KOI (Solo para servir)"),
];

const INDIVIDUALES: MenuItem[] = [
  ...entradas,
  ...platos,
  ...burgers,
  ...handrolls,
  ...rollsPremium,
  ...rollsPalta,
  ...rollsSalmon,
  ...california,
  ...queso,
  ...rainbow,
  ...futomaki,
  ...sinArroz,
  ...fritosPanko,
  ...vegetarianos,
  ...hosomaki,
  ...korokes,
  ...onigiri,
  ...gyozas,
  ...nigiri,
  ...sashimi,
  ...omakase,
];

// Menú base inmutable (snapshot)
const DEFAULT_MENU: MenuItem[] = [...PROMOS, ...INDIVIDUALES];

/** Cache runtime (se sobreescribe al cargar/guardar) */
let RUNTIME_MENU: MenuItem[] = [];

/** Export legado: snapshot del default (compat) */
export const MENU: MenuItem[] = DEFAULT_MENU;

/** Búsqueda por ID contra el menú vigente (runtime). */
export function getMenuItem(id: number): MenuItem | undefined {
  return currentMenu().find((m) => m.id === id);
}

/** Agrupa (usando el menú vigente, no el snapshot), con filtro de texto. */
export function groupMenu(query: string) {
  const base = currentMenu();
  const q = (query || "").trim().toLowerCase();
  const items = q
    ? base.filter((m) =>
        [m.name, m.desc, m.category, m.subgroup, ...(m.tags || [])]
          .filter(Boolean)
          .some((s) => String(s).toLowerCase().includes(q))
      )
    : base;

  const sections: Record<string, Record<string, MenuItem[]>> = {};
  for (const it of items) {
    if (!sections[it.category]) sections[it.category] = {};
    const sub = it.subgroup || "Otros";
    if (!sections[it.category][sub]) sections[it.category][sub] = [];
    sections[it.category][sub].push(it);
  }
  for (const cat of Object.keys(sections)) {
    for (const sub of Object.keys(sections[cat])) {
      sections[cat][sub].sort((a, b) => a.name.localeCompare(b.name));
    }
  }
  return sections;
}
