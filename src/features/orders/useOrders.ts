import { useCallback, useEffect } from 'react';
import type { Order, OrderStatus, CartItem, Coordinates, RouteMeta, CustomerFormData } from '@/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { STORAGE_KEYS, PACKING_TIME_MS } from '@/lib/constants';
import { shortCode, formatAddress } from '@/lib/format';
import { gmapsDir, wazeUrl, getOSRMRouteUrl } from '@/lib/urls';

// Hook return interface
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

// Create order parameters
interface CreateOrderParams {
  customerData: CustomerFormData;
  cart: CartItem[];
  coordinates: Coordinates;
  geocodePrecision: string;
  routeMeta?: RouteMeta | null;
}

/**
 * Hook for managing orders with localStorage persistence
 */
export const useOrders = (): UseOrdersReturn => {
  const [orders, setOrders] = useLocalStorage<Order[]>(STORAGE_KEYS.ORDERS, []);

  // Auto-mark packed orders when packing time expires
  useEffect(() => {
    const intervalId = setInterval(() => {
      setOrders(prevOrders => 
        prevOrders.map(order => {
          if (
            order.status === 'ready' &&
            order.packUntil &&
            !order.packed &&
            Date.now() >= order.packUntil
          ) {
            return { ...order, packed: true };
          }
          return order;
        })
      );
    }, 1000);

    return () => clearInterval(intervalId);
  }, [setOrders]);

  // Fetch route data from OSRM
  const fetchRoute = async (destLat: number, destLng: number): Promise<RouteMeta | null> => {
    try {
      const response = await fetch(getOSRMRouteUrl(destLat, destLng));
      const data = await response.json();
      
      if (!data?.routes?.[0]) return null;
      
      const route = data.routes[0];
      const points = route.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng] as [number, number]);
      
      return {
        distance: route.distance,
        duration: route.duration,
        points,
      };
    } catch (error) {
      console.warn('Route fetching failed:', error);
      return null;
    }
  };

  // Calculate estimated cooking time from cart
  const getEstimatedCookingTime = (cart: CartItem[]): number => {
    return cart.reduce((max, item) => Math.max(max, item.cookingTime), 0);
  };

  // Calculate cart total
  const getCartTotal = (cart: CartItem[]): number => {
    return cart.reduce((total, item) => total + (item.discountPrice * item.quantity), 0);
  };

  // Create new order
  const createOrder = useCallback(async (params: CreateOrderParams): Promise<Order> => {
    const { customerData, cart, coordinates, geocodePrecision, routeMeta } = params;
    
    const orderId = Date.now();
    const addressStr = formatAddress(customerData.street, customerData.number, customerData.sector);
    
    // Fetch route if not provided
    let finalRouteMeta = routeMeta;
    if (!finalRouteMeta) {
      finalRouteMeta = await fetchRoute(coordinates.lat, coordinates.lng);
    }

    const newOrder: Order = {
      id: orderId,
      publicCode: shortCode(orderId),
      name: customerData.name,
      phone: customerData.phone,
      address: addressStr,
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
      routeMeta: finalRouteMeta,
      createdBy: 'Cajero',
      geocodePrecision: geocodePrecision as any,
      paymentMethod: customerData.paymentMethod,
      paymentStatus: customerData.paymentStatus,
      dueMethod: customerData.dueMethod,
      packUntil: null,
      packed: false,
    };

    setOrders(prevOrders => [...prevOrders, newOrder]);
    return newOrder;
  }, [setOrders]);

  // Update order status
  const updateOrderStatus = useCallback((orderId: number, newStatus: OrderStatus) => {
    setOrders(prevOrders =>
      prevOrders.map(order => {
        if (order.id !== orderId) return order;

        const updates: Partial<Order> = { status: newStatus };

        // Set cooking timestamp when moving to cooking
        if (newStatus === 'cooking' && !order.cookingAt) {
          updates.cookingAt = Date.now();
        }

        // Set packing timer when moving to ready
        if (newStatus === 'ready' && !order.packUntil) {
          updates.packUntil = Date.now() + PACKING_TIME_MS;
          updates.packed = false;
        }

        return { ...order, ...updates };
      })
    );
  }, [setOrders]);

  // Confirm payment for order
  const confirmPayment = useCallback((orderId: number) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId
          ? {
              ...order,
              paymentStatus: 'paid' as const,
              paidAt: new Date().toISOString(),
            }
          : order
      )
    );
  }, [setOrders]);

  // Get orders by status
  const getOrdersByStatus = useCallback((status: OrderStatus) => {
    return orders.filter(order => order.status === status);
  }, [orders]);

  // Get order by ID
  const getOrderById = useCallback((id: number) => {
    return orders.find(order => order.id === id);
  }, [orders]);

  // Get order by public code
  const getOrderByCode = useCallback((code: string) => {
    return orders.find(order => shortCode(order.id) === code);
  }, [orders]);

  // Delete order
  const deleteOrder = useCallback((orderId: number) => {
    setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
  }, [setOrders]);

  return {
    orders,
    createOrder,
    updateOrderStatus,
    confirmPayment,
    getOrdersByStatus,
    getOrderById,
    getOrderByCode,
    deleteOrder,
  };
};