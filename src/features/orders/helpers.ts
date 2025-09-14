import type { Order, ProgressInfo, Promotion } from '@/types';
import { clampPercentage } from '@/lib/format';
import { ORDER_STATUS_CONFIG } from '@/lib/constants';

// Función helper para calcular porcentajes de descuento
const pct = (orig: number, now: number) => Math.max(0, Math.round((1 - now / orig) * 100));

// Hardcoded promotions data - SushiKoi
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
    description: "Envuelto en palta, relleno salmón y queso; coronado con ceviche (camarón, salmón, cebolla morada, morrón, ciboulette) y salsa acevichada. Autor: Maestro Francisco.",
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

/**
 * Calculate order progress based on status and timing
 */
export const progressFor = (order: Order): ProgressInfo => {
  if (!order) return { pct: 0, label: "—" };

  const now = Date.now();
  const config = ORDER_STATUS_CONFIG[order.status];
  const [minPct, maxPct] = config.progressRange;

  switch (order.status) {
    case 'pending': {
      const elapsed = (now - order.createdAt) / 60_000; // minutes
      const total = Math.max(5, order.estimatedTime || 15);
      const progressPct = (elapsed / total) * 100;
      return { 
        pct: clampPercentage(minPct + (progressPct * (maxPct - minPct)) / 100), 
        label: "En cola" 
      };
    }
    
    case 'cooking': {
      const cookingStart = order.cookingAt || order.createdAt;
      const elapsed = (now - cookingStart) / 60_000; // minutes
      const total = Math.max(5, order.estimatedTime || 15);
      const progressPct = (elapsed / total) * 100;
      return { 
        pct: clampPercentage(minPct + (progressPct * (maxPct - minPct)) / 100), 
        label: "Cocinando" 
      };
    }
    
    case 'ready': {
      if (order.packUntil) {
        const remain = Math.max(0, order.packUntil - now);
        const elapsed = 90_000 - remain; // 90 seconds total
        const progressPct = (elapsed / 90_000) * 100;
        return { 
          pct: clampPercentage(minPct + (progressPct * (maxPct - minPct)) / 100), 
          label: "Empaque" 
        };
      }
      return { pct: 95, label: "Listo" };
    }
    
    case 'delivered':
      return { pct: 100, label: "Entregado" };
    
    default:
      return { pct: 0, label: "—" };
  }
};

/**
 * Calculate minutes left for order completion
 */
export const minutesLeftFor = (order: Order): number => {
  if (!order) return 0;

  const now = Date.now();

  if (order.status === 'pending' || order.status === 'cooking') {
    const totalTime = Math.max(5, order.estimatedTime || 15) * 60_000; // milliseconds
    const elapsed = now - order.createdAt;
    return Math.max(0, Math.ceil((totalTime - elapsed) / 60_000));
  }
  
  if (order.status === 'ready' && order.packUntil) {
    return Math.ceil(Math.max(0, order.packUntil - now) / 60_000);
  }
  
  return 0;
};

/**
 * Calculate ETA from creation time and estimated minutes
 */
export const etaFrom = (createdAt: number, minutes: number): number => {
  const endTime = createdAt + minutes * 60_000;
  return Math.max(0, Math.ceil((endTime - Date.now()) / 60_000));
};

/**
 * Get orders filtered by status
 */
export const getOrdersByStatus = (orders: Order[], status: Order['status']): Order[] => {
  return orders.filter(order => order.status === status);
};

/**
 * Get orders filtered by payment status
 */
export const getOrdersByPaymentStatus = (orders: Order[], paymentStatus: Order['paymentStatus']): Order[] => {
  return orders.filter(order => order.paymentStatus === paymentStatus);
};

/**
 * Get active orders (not delivered)
 */
export const getActiveOrders = (orders: Order[]): Order[] => {
  return orders.filter(order => order.status !== 'delivered');
};

/**
 * Sort orders by creation time (newest first)
 */
export const sortOrdersByCreatedAt = (orders: Order[], descending = true): Order[] => {
  return [...orders].sort((a, b) => 
    descending ? b.createdAt - a.createdAt : a.createdAt - b.createdAt
  );
};

/**
 * Check if order is overdue based on estimated time
 */
export const isOrderOverdue = (order: Order): boolean => {
  if (order.status === 'delivered') return false;
  
  const now = Date.now();
  const estimatedEndTime = order.createdAt + (order.estimatedTime * 60_000);
  
  return now > estimatedEndTime;
};

/**
 * Get promotion by ID
 */
export const getPromotionById = (id: number): Promotion | undefined => {
  return PROMOTIONS.find(promo => promo.id === id);
};