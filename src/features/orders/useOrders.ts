import { useCallback, useEffect } from 'react';
import type { Order, OrderStatus, CartItem, Coordinates, RouteMeta, CustomerFormData } from '@/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { STORAGE_KEYS, PACKING_TIME_MS } from '@/lib/constants';
import { shortCode, formatAddress } from '@/lib/format';
import { gmapsDir, wazeUrl, getOSRMRouteUrl } from '@/lib/urls';

const ORDERS_SYNC_EVENT = 'ORDERS_SYNC';

interface UseOrdersReturn {
  orders: Order[];
  createOrder: (params: CreateOrderParams) => Promise<Order>;
  updateOrderStatus: (orderId: number, status: OrderStatus) => void;
  confirmPayment: (orderId: number) => void;
  getOrdersByStatus: (status: OrderStatus) => Order[];
  getOrderById: (id: number) => Order | undefined;
  getOrderByCode: (code: string) => Order | undefined;
  deleteOrder: (orderId: number) => void;
}

interface CreateOrderParams {
  customerData: CustomerFormData;
  cart: CartItem[];
  coordinates: Coordinates;
  geocodePrecision: string;
  routeMeta?: RouteMeta | null;
}

export const useOrders = (): UseOrdersReturn => {
  const [orders, setOrders] = useLocalStorage<Order[]>(STORAGE_KEYS.ORDERS, []);

  // sync helpers
  const broadcast = () => { try { window.dispatchEvent(new Event(ORDERS_SYNC_EVENT)); } catch {} };
  const pullFromStorage = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (!raw) return;
      setOrders(JSON.parse(raw) as Order[]);
    } catch {}
  }, [setOrders]);

  // autopack al vencer packUntil
  useEffect(() => {
    const id = setInterval(() => {
      setOrders(prev =>
        prev.map(o =>
          o.status === 'ready' && o.packUntil && !o.packed && Date.now() >= o.packUntil
            ? { ...o, packed: true }
            : o
        )
      );
    }, 1000);
    return () => clearInterval(id);
  }, [setOrders]);

  // sync same-tab + otras pestañas
  useEffect(() => {
    const onSync = () => pullFromStorage();
    const onStorage = (e: StorageEvent) => { if (e.key === STORAGE_KEYS.ORDERS) pullFromStorage(); };
    window.addEventListener(ORDERS_SYNC_EVENT, onSync);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(ORDERS_SYNC_EVENT, onSync);
      window.removeEventListener('storage', onStorage);
    };
  }, [pullFromStorage]);

  const fetchRoute = async (destLat: number, destLng: number): Promise<RouteMeta | null> => {
    try {
      const resp = await fetch(getOSRMRouteUrl(destLat, destLng));
      const data = await resp.json();
      if (!data?.routes?.[0]) return null;
      const route = data.routes[0];
      const points = route.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng] as [number, number]);
      return { distance: route.distance, duration: route.duration, points };
    } catch { return null; }
  };

  const getEstimatedCookingTime = (cart: CartItem[]): number =>
    cart.reduce((max, item) => Math.max(max, item.cookingTime), 0);

  const getCartTotal = (cart: CartItem[]): number =>
    cart.reduce((total, item) => total + (item.discountPrice * item.quantity), 0);

  const createOrder = useCallback(async (params: CreateOrderParams): Promise<Order> => {
    const { customerData, cart, coordinates, geocodePrecision, routeMeta } = params;

    const id = Date.now();
    const addr = formatAddress(customerData.street, customerData.number, customerData.sector);

    let finalRoute = routeMeta;
    if (!finalRoute) finalRoute = await fetchRoute(coordinates.lat, coordinates.lng);

    const newOrder: Order = {
      id,
      publicCode: shortCode(id),
      name: customerData.name,
      phone: customerData.phone,
      address: addr,
      city: customerData.city,
      references: customerData.references,
      cart: [...cart],
      total: getCartTotal(cart),
      coordinates,
      mapsUrl: gmapsDir(coordinates.lat, coordinates.lng),
      wazeUrl: wazeUrl(coordinates.lat, coordinates.lng),
      status: 'pending',
      timestamp: new Date().toLocaleString('es-CL'),
      createdAt: Date.now(),
      cookingAt: null,
      estimatedTime: getEstimatedCookingTime(cart),
      routeMeta: finalRoute,
      createdBy: 'Cajero',
      geocodePrecision: geocodePrecision as any,
      paymentMethod: customerData.paymentMethod,
      paymentStatus: customerData.paymentStatus,
      dueMethod: customerData.dueMethod,
      packUntil: null,
      packed: false,
    };

    setOrders(prev => [...prev, newOrder]);
    setTimeout(broadcast, 0);
    return newOrder;
  }, [setOrders]);

  const updateOrderStatus = useCallback((orderId: number, status: OrderStatus) => {
    setOrders(prev =>
      prev.map(o => {
        if (o.id !== orderId) return o;
        const up: Partial<Order> = { status };
        if (status === 'cooking' && !o.cookingAt) up.cookingAt = Date.now();
        if (status === 'ready' && !o.packUntil) { up.packUntil = Date.now() + PACKING_TIME_MS; up.packed = false; }
        return { ...o, ...up };
      })
    );
    setTimeout(broadcast, 0);
  }, [setOrders]);

  const confirmPayment = useCallback((orderId: number) => {
    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, paymentStatus: 'paid' as const, paidAt: new Date().toISOString() } : o))
    );
    setTimeout(broadcast, 0);
  }, [setOrders]);

  const getOrdersByStatus = useCallback((status: OrderStatus) => orders.filter(o => o.status === status), [orders]);
  const getOrderById = useCallback((id: number) => orders.find(o => o.id === id), [orders]);
  const getOrderByCode = useCallback((code: string) => orders.find(o => shortCode(o.id) === code), [orders]);

  const deleteOrder = useCallback((orderId: number) => {
    setOrders(prev => prev.filter(o => o.id !== orderId));
    setTimeout(broadcast, 0);
  }, [setOrders]);

  return { orders, createOrder, updateOrderStatus, confirmPayment, getOrdersByStatus, getOrderById, getOrderByCode, deleteOrder };
};
