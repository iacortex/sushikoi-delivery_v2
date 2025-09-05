import { useState, useEffect, useRef } from 'react';
import type { Order } from '@/types';

interface NotificationSettings {
  soundEnabled: boolean;
  browserNotifications: boolean;
  newOrderAlert: boolean;
  overdueAlert: boolean;
  packingAlert: boolean;
}

interface UseKitchenNotificationsReturn {
  settings: NotificationSettings;
  updateSettings: (newSettings: Partial<NotificationSettings>) => void;
  requestPermission: () => Promise<boolean>;
  hasPermission: boolean;
}

/**
 * Hook for managing kitchen notifications and sounds
 */
export const useKitchenNotifications = (orders: Order[]): UseKitchenNotificationsReturn => {
  const [settings, setSettings] = useState<NotificationSettings>({
    soundEnabled: true,
    browserNotifications: true,
    newOrderAlert: true,
    overdueAlert: true,
    packingAlert: true,
  });

  const [hasPermission, setHasPermission] = useState(false);
  const prevOrdersRef = useRef<Order[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Check notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setHasPermission(Notification.permission === 'granted');
    }
  }, []);

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('kitchen_notification_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.warn('Failed to load notification settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('kitchen_notification_settings', JSON.stringify(settings));
  }, [settings]);

  // Initialize audio context
  useEffect(() => {
    if (settings.soundEnabled && !audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.warn('Web Audio API not supported:', error);
      }
    }
  }, [settings.soundEnabled]);

  // Monitor orders for changes
  useEffect(() => {
    const prevOrders = prevOrdersRef.current;
    const currentOrders = orders;

    // Skip first run
    if (prevOrders.length === 0) {
      prevOrdersRef.current = currentOrders;
      return;
    }

    const notifications: Array<{ type: string; message: string; soundType: 'new-order' | 'alert' }> = [];

    // Check for new orders
    if (settings.newOrderAlert) {
      const newOrders = currentOrders.filter(order =>
        order.status === 'pending' && !prevOrders.find(prev => prev.id === order.id)
      );
      
      if (newOrders.length > 0) {
        notifications.push({
          type: 'new-order',
          message: `🍣 ${newOrders.length} nuevo(s) pedido(s) recibido(s)`,
          soundType: 'new-order',
        });
      }
    }

    // Check for overdue orders
    if (settings.overdueAlert) {
      const now = Date.now();
      const newOverdue = currentOrders.filter(order => {
        const prev = prevOrders.find(p => p.id === order.id);
        if (!prev || order.status === 'delivered') return false;
        
        const estimatedEnd = order.createdAt + (order.estimatedTime * 60_000);
        const isOverdue = now > estimatedEnd;
        const prevEstimatedEnd = prev.createdAt + (prev.estimatedTime * 60_000);
        const wasOverdue = now > prevEstimatedEnd;
        
        return isOverdue && !wasOverdue;
      });

      if (newOverdue.length > 0) {
        notifications.push({
          type: 'overdue',
          message: `⚠️ ${newOverdue.length} pedido(s) han superado el tiempo estimado`,
          soundType: 'alert',
        });
      }
    }

    // Check for packing expired
    if (settings.packingAlert) {
      const now = Date.now();
      const newPackingExpired = currentOrders.filter(order => {
        const prev = prevOrders.find(p => p.id === order.id);
        if (!prev || !order.packUntil) return false;
        
        const isExpired = now > order.packUntil && !order.packed;
        const wasExpired = prev.packUntil ? now > prev.packUntil && !prev.packed : false;
        
        return isExpired && !wasExpired;
      });

      if (newPackingExpired.length > 0) {
        notifications.push({
          type: 'packing',
          message: `📦 ${newPackingExpired.length} empaque(s) han vencido`,
          soundType: 'alert',
        });
      }
    }

    // Trigger notifications
    notifications.forEach(notification => {
      if (settings.browserNotifications && hasPermission) {
        showBrowserNotification(notification.type, notification.message);
      }
      
      if (settings.soundEnabled) {
        playNotificationSound(notification.soundType);
      }
    });

    prevOrdersRef.current = currentOrders;
  }, [orders, settings, hasPermission]);

  // Request notification permission
  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      setHasPermission(granted);
      return granted;
    } catch (error) {
      console.warn('Failed to request notification permission:', error);
      return false;
    }
  };

  // Show browser notification
  const showBrowserNotification = (type: string, message: string) => {
    if (!hasPermission) return;

    try {
      const notification = new Notification('Sushi Delivery - Cocina', {
        body: message,
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        tag: type,
        requireInteraction: type === 'overdue',
        silent: !settings.soundEnabled,
      });

      // Auto close after 5 seconds (except for critical alerts)
      if (type !== 'overdue') {
        setTimeout(() => {
          notification.close();
        }, 5000);
      }

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.warn('Failed to show notification:', error);
    }
  };

  // Play notification sound
  const playNotificationSound = (type: 'new-order' | 'alert') => {
    if (!audioContextRef.current) return;

    try {
      const audioContext = audioContextRef.current;
      
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      if (type === 'new-order') {
        // Pleasant notification sound
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      } else {
        // Alert sound - three urgent beeps
        [0, 0.15, 0.3].forEach((delay) => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + delay);
          
          gainNode.gain.setValueAtTime(0, audioContext.currentTime + delay);
          gainNode.gain.exponentialRampToValueAtTime(0.15, audioContext.currentTime + delay + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + delay + 0.1);

          oscillator.start(audioContext.currentTime + delay);
          oscillator.stop(audioContext.currentTime + delay + 0.1);
        });
      }
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
    }
  };

  // Update settings
  const updateSettings = (newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return {
    settings,
    updateSettings,
    requestPermission,
    hasPermission,
  };
};