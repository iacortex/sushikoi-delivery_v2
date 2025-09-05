import { useState, useEffect, useCallback } from 'react';
import type { Order } from '@/types';
import { normalizePhone, shortCode } from '@/lib/format';

interface UseClientTrackingReturn {
  searchOrder: (query: string) => Order | null;
  getOrderProgress: (order: Order) => {
    percentage: number;
    timeRemaining: number;
    nextStatus: string;
    estimatedCompletion: Date;
  };
  subscribeToOrderUpdates: (orderId: number, callback: (order: Order) => void) => () => void;
  getRecentActivity: () => {
    totalOrders: number;
    todayOrders: number;
    averageWaitTime: number;
  };
}

/**
 * Hook for client-side order tracking and management
 */
export const useClientTracking = (orders: Order[]): UseClientTrackingReturn => {
  const [subscribers, setSubscribers] = useState<Map<number, Set<(order: Order) => void>>>(new Map());

  // Search for order by phone or code
  const searchOrder = useCallback((query: string): Order | null => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return null;

    const normalizedQuery = normalizePhone(trimmedQuery);

    // Search by code first (exact match)
    const byCode = orders.find(order => shortCode(order.id) === normalizedQuery);
    if (byCode) return byCode;

    // Search by phone (latest order first)
    const byPhone = orders
      .slice()
      .reverse() // Most recent first
      .find(order => normalizePhone(order.phone) === normalizedQuery);
    
    return byPhone || null;
  }, [orders]);

  // Get detailed progress information for an order
  const getOrderProgress = useCallback((order: Order) => {
    const now = Date.now();
    const totalEstimatedTime = order.estimatedTime * 60 * 1000; // Convert to milliseconds
    const elapsed = now - order.createdAt;
    
    let percentage = 0;
    let timeRemaining = 0;
    let nextStatus = '';
    
    // Calculate progress based on status
    switch (order.status) {
      case 'pending':
        percentage = Math.min(50, (elapsed / totalEstimatedTime) * 50);
        timeRemaining = Math.max(0, totalEstimatedTime - elapsed);
        nextStatus = 'En preparación';
        break;
        
      case 'cooking':
        const cookingElapsed = order.cookingAt ? now - order.cookingAt : elapsed;
        percentage = 50 + Math.min(40, (cookingElapsed / totalEstimatedTime) * 40);
        timeRemaining = Math.max(0, totalEstimatedTime - elapsed);
        nextStatus = 'Empacando';
        break;
        
      case 'ready':
        percentage = 90;
        if (order.packUntil) {
          const packingProgress = Math.min(10, ((90_000 - Math.max(0, order.packUntil - now)) / 90_000) * 10);
          percentage += packingProgress;
          timeRemaining = Math.max(0, order.packUntil - now);
        }
        nextStatus = 'En camino';
        break;
        
      case 'delivered':
        percentage = 100;
        timeRemaining = 0;
        nextStatus = 'Entregado';
        break;
        
      default:
        percentage = 0;
        timeRemaining = totalEstimatedTime;
        nextStatus = 'Procesando';
    }

    const estimatedCompletion = new Date(order.createdAt + totalEstimatedTime);

    return {
      percentage: Math.round(percentage),
      timeRemaining: Math.round(timeRemaining / 60_000), // Convert to minutes
      nextStatus,
      estimatedCompletion,
    };
  }, []);

  // Subscribe to order updates
  const subscribeToOrderUpdates = useCallback((orderId: number, callback: (order: Order) => void) => {
    setSubscribers(prev => {
      const newMap = new Map(prev);
      if (!newMap.has(orderId)) {
        newMap.set(orderId, new Set());
      }
      newMap.get(orderId)!.add(callback);
      return newMap;
    });

    // Return unsubscribe function
    return () => {
      setSubscribers(prev => {
        const newMap = new Map(prev);
        const orderSubscribers = newMap.get(orderId);
        if (orderSubscribers) {
          orderSubscribers.delete(callback);
          if (orderSubscribers.size === 0) {
            newMap.delete(orderId);
          }
        }
        return newMap;
      });
    };
  }, []);

  // Notify subscribers when orders change
  useEffect(() => {
    subscribers.forEach((callbacks, orderId) => {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        callbacks.forEach(callback => callback(order));
      }
    });
  }, [orders, subscribers]);

  // Get recent activity statistics
  const getRecentActivity = useCallback(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const todayOrders = orders.filter(order => 
      order.createdAt >= today.getTime()
    );

    // Calculate average wait time for delivered orders today
    const deliveredToday = todayOrders.filter(order => order.status === 'delivered');
    const averageWaitTime = deliveredToday.length > 0
      ? deliveredToday.reduce((sum, order) => {
          // Estimate delivery time as order creation + estimated time
          const estimatedDeliveryTime = order.createdAt + (order.estimatedTime * 60 * 1000);
          const actualWaitTime = estimatedDeliveryTime - order.createdAt;
          return sum + actualWaitTime;
        }, 0) / deliveredToday.length / 60_000 // Convert to minutes
      : 0;

    return {
      totalOrders: orders.length,
      todayOrders: todayOrders.length,
      averageWaitTime: Math.round(averageWaitTime),
    };
  }, [orders]);

  return {
    searchOrder,
    getOrderProgress,
    subscribeToOrderUpdates,
    getRecentActivity,
  };
};