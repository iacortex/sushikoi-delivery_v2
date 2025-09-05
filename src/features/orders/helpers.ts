import type { Order, ProgressInfo, Promotion } from '@/types';
import { clampPercentage } from '@/lib/format';
import { ORDER_STATUS_CONFIG } from '@/lib/constants';

// Hardcoded promotions data
export const PROMOTIONS: Promotion[] = [
  {
    id: 1,
    name: "Promo Familiar",
    description: "40 piezas variadas + 2 bebidas + salsa extra",
    items: [
      "20 Makis Salmón",
      "10 Uramakis California",
      "10 Nigiris variados",
      "2 Bebidas 350ml",
      "Salsa Teriyaki",
    ],
    originalPrice: 18900,
    discountPrice: 14900,
    discount: 21,
    image: "🍣",
    popular: true,
    cookingTime: 25,
  },
  {
    id: 2,
    name: "Combo Ejecutivo",
    description: "Perfecto para almuerzo o cena individual",
    items: [
      "10 Makis Philadelphia",
      "6 Uramakis Ebi",
      "4 Nigiris Salmón",
      "1 Miso Soup",
      "Wasabi y Jengibre",
    ],
    originalPrice: 8500,
    discountPrice: 6900,
    discount: 19,
    image: "🥢",
    popular: false,
    cookingTime: 15,
  },
  {
    id: 3,
    name: "Mega Promo Puerto Montt",
    description: "La promoción más grande para compartir",
    items: [
      "30 Makis variados",
      "20 Uramakis especiales",
      "15 Nigiris premium",
      "3 Temakis",
      "4 Bebidas",
      "Postres Mochi (4 unidades)",
    ],
    originalPrice: 28900,
    discountPrice: 22900,
    discount: 21,
    image: "🏮",
    popular: true,
    cookingTime: 35,
  },
  {
    id: 4,
    name: "Vegetariano Deluxe",
    description: "Opciones frescas sin pescado ni mariscos",
    items: [
      "15 Makis Palta",
      "10 Uramakis Vegetales",
      "8 Inari",
      "Ensalada Wakame",
      "Salsa Soya",
    ],
    originalPrice: 7900,
    discountPrice: 5900,
    discount: 25,
    image: "🥒",
    popular: false,
    cookingTime: 12,
  },
  {
    id: 5,
    name: "Especial Salmón",
    description: "Para los amantes del salmón fresco",
    items: [
      "20 Makis Salmón",
      "12 Uramakis Philadelphia",
      "8 Nigiris Salmón",
      "4 Sashimis Salmón",
      "Salsa Especial",
    ],
    originalPrice: 15900,
    discountPrice: 12900,
    discount: 19,
    image: "🐟",
    popular: true,
    cookingTime: 20,
  },
  {
    id: 6,
    name: "Mariscos del Sur",
    description: "Sabores del mar de Los Lagos",
    items: [
      "15 Uramakis Camarón",
      "10 Makis Pulpo",
      "8 Nigiris Mariscos",
      "6 Gyozas Camarón",
      "Salsa Anguila",
    ],
    originalPrice: 17900,
    discountPrice: 13900,
    discount: 22,
    image: "🦐",
    popular: false,
    cookingTime: 30,
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