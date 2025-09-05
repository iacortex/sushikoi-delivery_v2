import { useState, useEffect, useCallback } from 'react';
import type { Order } from '@/types';

interface DeliveryMetrics {
  averageDeliveryTime: number;
  totalDistance: number;
  fuelCost: number;
  deliveryEfficiency: number;
}

interface UseDeliveryTrackingReturn {
  isOnDelivery: boolean;
  currentRoute: Order[];
  metrics: DeliveryMetrics;
  startDeliveryRoute: (orderIds: number[]) => void;
  completeDelivery: (orderId: number) => void;
  cancelDeliveryRoute: () => void;
  getEstimatedArrival: (orderId: number) => Date | null;
}

/**
 * Hook for tracking delivery routes and performance metrics
 */
export const useDeliveryTracking = (orders: Order[]): UseDeliveryTrackingReturn => {
  const [isOnDelivery, setIsOnDelivery] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<Order[]>([]);
  const [deliveryStartTime, setDeliveryStartTime] = useState<number | null>(null);
  const [completedDeliveries, setCompletedDeliveries] = useState<Array<{
    orderId: number;
    completedAt: number;
    deliveryTime: number;
  }>>([]);

  // Load delivery state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('delivery_tracking_state');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setIsOnDelivery(parsed.isOnDelivery || false);
        setDeliveryStartTime(parsed.deliveryStartTime || null);
        setCompletedDeliveries(parsed.completedDeliveries || []);
      } catch (error) {
        console.warn('Failed to load delivery tracking state:', error);
      }
    }
  }, []);

  // Save delivery state to localStorage
  useEffect(() => {
    const state = {
      isOnDelivery,
      deliveryStartTime,
      completedDeliveries,
    };
    localStorage.setItem('delivery_tracking_state', JSON.stringify(state));
  }, [isOnDelivery, deliveryStartTime, completedDeliveries]);

  // Update current route based on order IDs
  useEffect(() => {
    if (isOnDelivery) {
      const savedRouteIds = localStorage.getItem('current_delivery_route');
      if (savedRouteIds) {
        try {
          const routeIds: number[] = JSON.parse(savedRouteIds);
          const routeOrders = routeIds
            .map(id => orders.find(order => order.id === id))
            .filter((order): order is Order => order !== undefined && order.status === 'ready');
          
          setCurrentRoute(routeOrders);
          
          // If no orders left in route, end delivery
          if (routeOrders.length === 0) {
            cancelDeliveryRoute();
          }
        } catch (error) {
          console.warn('Failed to load current route:', error);
        }
      }
    }
  }, [orders, isOnDelivery]);

  // Calculate delivery metrics
  const metrics = useCallback((): DeliveryMetrics => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayDeliveries = completedDeliveries.filter(
      delivery => delivery.completedAt >= today.getTime()
    );

    // Average delivery time
    const averageDeliveryTime = todayDeliveries.length > 0
      ? todayDeliveries.reduce((sum, d) => sum + d.deliveryTime, 0) / todayDeliveries.length
      : 0;

    // Total distance from current route
    const totalDistance = currentRoute.reduce(
      (sum, order) => sum + (order.routeMeta?.distance || 0), 0
    );

    // Estimated fuel cost (rough calculation)
    const fuelCost = (totalDistance / 1000) * 0.5; // $0.5 per km

    // Delivery efficiency (orders delivered vs total orders today)
    const todayOrders = orders.filter(
      order => order.createdAt >= today.getTime()
    ).length;
    const deliveryEfficiency = todayOrders > 0 
      ? (todayDeliveries.length / todayOrders) * 100 
      : 0;

    return {
      averageDeliveryTime: Math.round(averageDeliveryTime / 60000), // Convert to minutes
      totalDistance,
      fuelCost,
      deliveryEfficiency: Math.round(deliveryEfficiency),
    };
  }, [completedDeliveries, currentRoute, orders]);

  // Start a delivery route
  const startDeliveryRoute = useCallback((orderIds: number[]) => {
    const routeOrders = orderIds
      .map(id => orders.find(order => order.id === id))
      .filter((order): order is Order => order !== undefined && order.status === 'ready');

    if (routeOrders.length === 0) return;

    setCurrentRoute(routeOrders);
    setIsOnDelivery(true);
    setDeliveryStartTime(Date.now());
    
    // Save route to localStorage
    localStorage.setItem('current_delivery_route', JSON.stringify(orderIds));
    
    // Request notification permission for delivery updates
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [orders]);

  // Complete a single delivery
  const completeDelivery = useCallback((orderId: number) => {
    if (!deliveryStartTime) return;

    const completedAt = Date.now();
    const deliveryTime = completedAt - deliveryStartTime;

    setCompletedDeliveries(prev => [
      ...prev,
      { orderId, completedAt, deliveryTime }
    ]);

    // Remove from current route
    setCurrentRoute(prev => prev.filter(order => order.id !== orderId));

    // Update localStorage
    const updatedRoute = currentRoute
      .filter(order => order.id !== orderId)
      .map(order => order.id);
    
    if (updatedRoute.length > 0) {
      localStorage.setItem('current_delivery_route', JSON.stringify(updatedRoute));
    } else {
      localStorage.removeItem('current_delivery_route');
      setIsOnDelivery(false);
      setDeliveryStartTime(null);
    }

    // Show notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Entrega Completada', {
        body: `Pedido #${orderId.toString().slice(-4)} entregado correctamente`,
        icon: '/favicon.svg',
      });
    }
  }, [deliveryStartTime, currentRoute]);

  // Cancel current delivery route
  const cancelDeliveryRoute = useCallback(() => {
    setIsOnDelivery(false);
    setCurrentRoute([]);
    setDeliveryStartTime(null);
    localStorage.removeItem('current_delivery_route');
  }, []);

  // Get estimated arrival time for a specific order
  const getEstimatedArrival = useCallback((orderId: number): Date | null => {
    if (!isOnDelivery || !deliveryStartTime) return null;

    const orderIndex = currentRoute.findIndex(order => order.id === orderId);
    if (orderIndex === -1) return null;

    // Calculate cumulative time to reach this order
    let cumulativeTime = 0;
    for (let i = 0; i <= orderIndex; i++) {
      const order = currentRoute[i];
      cumulativeTime += (order.routeMeta?.duration || 600); // Default 10 min if no route data
      cumulativeTime += 300; // 5 min per delivery stop
    }

    return new Date(deliveryStartTime + cumulativeTime * 1000);
  }, [isOnDelivery, deliveryStartTime, currentRoute]);

  return {
    isOnDelivery,
    currentRoute,
    metrics: metrics(),
    startDeliveryRoute,
    completeDelivery,
    cancelDeliveryRoute,
    getEstimatedArrival,
  };
};