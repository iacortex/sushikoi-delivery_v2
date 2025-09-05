import React, { useEffect, useRef } from 'react';
import { Bell, Volume2, VolumeX } from 'lucide-react';
import type { Order } from '@/types';

interface KitchenNotificationsProps {
  orders: Order[];
  soundEnabled?: boolean;
  onToggleSound?: (enabled: boolean) => void;
}

export const KitchenNotifications: React.FC<KitchenNotificationsProps> = ({
  orders,
  soundEnabled = true,
  onToggleSound,
}) => {
  const prevOrdersRef = useRef<Order[]>([]);
  const notificationTimeoutRef = useRef<NodeJS.Timeout>();

  // Check for new orders and trigger notifications
  useEffect(() => {
    const prevOrders = prevOrdersRef.current;
    const currentOrders = orders;

    // Detect new orders
    const newOrders = currentOrders.filter(order =>
      !prevOrders.find(prev => prev.id === order.id)
    );

    // Detect orders that became overdue
    const newOverdue = currentOrders.filter(order => {
      const prev = prevOrders.find(p => p.id === order.id);
      if (!prev) return false;
      
      const now = Date.now();
      const estimatedEnd = order.createdAt + (order.estimatedTime * 60_000);
      const wasOverdue = now > estimatedEnd;
      const prevWasOverdue = prev.createdAt + (prev.estimatedTime * 60_000) < now;
      
      return wasOverdue && !prevWasOverdue;
    });

    // Detect packing expired
    const newPackingExpired = currentOrders.filter(order => {
      const prev = prevOrders.find(p => p.id === order.id);
      if (!prev || !order.packUntil) return false;
      
      const now = Date.now();
      const isExpired = now > order.packUntil && !order.packed;
      const wasExpired = prev.packUntil ? now > prev.packUntil && !prev.packed : false;
      
      return isExpired && !wasExpired;
    });

    // Trigger notifications
    if (newOrders.length > 0) {
      showNotification('new-order', `🍣 ${newOrders.length} nuevo(s) pedido(s)`);
      if (soundEnabled) playNotificationSound('new-order');
    }

    if (newOverdue.length > 0) {
      showNotification('overdue', `⚠️ ${newOverdue.length} pedido(s) atrasado(s)`);
      if (soundEnabled) playNotificationSound('alert');
    }

    if (newPackingExpired.length > 0) {
      showNotification('packing', `📦 ${newPackingExpired.length} empaque(s) vencido(s)`);
      if (soundEnabled) playNotificationSound('alert');
    }

    prevOrdersRef.current = currentOrders;
  }, [orders, soundEnabled]);

  // Show browser notification
  const showNotification = (type: string, message: string) => {
    // Clear previous timeout
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }

    // Request permission if needed
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Show notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('Sushi Delivery - Cocina', {
        body: message,
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        tag: type,
        requireInteraction: type === 'overdue',
      });

      // Auto close after 5 seconds
      notificationTimeoutRef.current = setTimeout(() => {
        notification.close();
      }, 5000);
    }
  };

  // Play notification sound (simple beep using Web Audio API)
  const playNotificationSound = (type: 'new-order' | 'alert') => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Different frequencies for different types
      if (type === 'new-order') {
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      } else {
        // Alert sound - three beeps
        [0, 0.2, 0.4].forEach((delay, index) => {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          
          osc.connect(gain);
          gain.connect(audioContext.destination);
          
          osc.frequency.setValueAtTime(1000, audioContext.currentTime + delay);
          gain.gain.setValueAtTime(0.1, audioContext.currentTime + delay);
          gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + delay + 0.15);
          
          osc.start(audioContext.currentTime + delay);
          osc.stop(audioContext.currentTime + delay + 0.15);
        });
      }
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  };

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleToggleSound = () => {
    onToggleSound?.(!soundEnabled);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleToggleSound}
        className={`p-2 rounded-lg transition-colors ${
          soundEnabled 
            ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
        }`}
        title={soundEnabled ? 'Desactivar sonidos' : 'Activar sonidos'}
        aria-label={soundEnabled ? 'Desactivar sonidos' : 'Activar sonidos'}
      >
        {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
      </button>

      <div className="text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Bell size={12} />
          <span>Notificaciones {
            'Notification' in window && Notification.permission === 'granted' 
              ? 'activas' 
              : 'bloqueadas'
          }</span>
        </div>
      </div>
    </div>
  );
};