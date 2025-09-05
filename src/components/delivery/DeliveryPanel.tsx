import React, { useMemo, useState } from 'react';
import { Truck, Package, CheckCircle, MapPin, Clock, DollarSign } from 'lucide-react';
import type { Order } from '@/types';
import { useOrders } from '@/features/orders/useOrders';
import { useTicker } from '@/hooks/useTicker';
import { DeliveryOrderCard } from './DeliveryOrderCard';
import { DeliveryStats } from './DeliveryStats';
import { ORDER_STATUS_CONFIG } from '@/lib/constants';

type DeliveryFilter = 'all' | 'ready' | 'delivered' | 'unpaid';

export const DeliveryPanel: React.FC = () => {
  // Real-time updates
  useTicker();
  
  // State
  const [activeFilter, setActiveFilter] = useState<DeliveryFilter>('ready');
  
  // Orders management
  const { orders, updateOrderStatus, confirmPayment } = useOrders();

  // Filter orders for delivery (ready + delivered)
  const deliveryOrders = useMemo(() => {
    return orders.filter(order => 
      ['ready', 'delivered'].includes(order.status)
    );
  }, [orders]);

  // Apply filters
  const filteredOrders = useMemo(() => {
    switch (activeFilter) {
      case 'ready':
        return deliveryOrders.filter(order => order.status === 'ready');
      case 'delivered':
        return deliveryOrders.filter(order => order.status === 'delivered');
      case 'unpaid':
        return deliveryOrders.filter(order => order.paymentStatus === 'due');
      default:
        return deliveryOrders;
    }
  }, [deliveryOrders, activeFilter]);

  // Sort orders - ready first, then by creation time
  const sortedOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => {
      // Ready orders first
      if (a.status === 'ready' && b.status !== 'ready') return -1;
      if (b.status === 'ready' && a.status !== 'ready') return 1;
      
      // Then by creation time (newest first)
      return b.createdAt - a.createdAt;
    });
  }, [filteredOrders]);

  // Statistics
  const stats = useMemo(() => {
    const ready = deliveryOrders.filter(o => o.status === 'ready').length;
    const delivered = deliveryOrders.filter(o => o.status === 'delivered').length;
    const unpaid = deliveryOrders.filter(o => o.paymentStatus === 'due').length;
    
    // Today's deliveries
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayDelivered = deliveryOrders.filter(o => 
      o.status === 'delivered' && o.createdAt >= today.getTime()
    ).length;

    // Calculate total revenue from delivered orders today
    const todayRevenue = deliveryOrders
      .filter(o => o.status === 'delivered' && o.createdAt >= today.getTime())
      .reduce((sum, o) => sum + o.total, 0);

    return {
      ready,
      delivered,
      unpaid,
      todayDelivered,
      todayRevenue,
      total: deliveryOrders.length,
    };
  }, [deliveryOrders]);

  // Handle order actions
  const handleMarkAsDelivered = (orderId: number) => {
    updateOrderStatus(orderId, 'delivered');
  };

  const handleConfirmPayment = (orderId: number) => {
    confirmPayment(orderId);
  };

  // Filter configuration
  const filters = [
    {
      key: 'ready' as const,
      label: 'Para Entregar',
      icon: Package,
      count: stats.ready,
      color: 'bg-green-500',
    },
    {
      key: 'delivered' as const,
      label: 'Entregados',
      icon: CheckCircle,
      count: stats.delivered,
      color: 'bg-blue-500',
    },
    {
      key: 'unpaid' as const,
      label: 'Por Cobrar',
      icon: DollarSign,
      count: stats.unpaid,
      color: 'bg-red-500',
    },
    {
      key: 'all' as const,
      label: 'Todos',
      icon: Truck,
      count: stats.total,
      color: 'bg-gray-500',
    },
  ];

  if (deliveryOrders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <EmptyDelivery />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Delivery Statistics */}
      <DeliveryStats stats={stats} />

      {/* Filter Tabs */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Truck className="text-green-500" />
              Gestión de Entregas
            </h2>
            
            {/* Active Orders Count */}
            <div className="text-sm text-gray-600">
              Mostrando {sortedOrders.length} de {deliveryOrders.length} pedidos
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => {
              const Icon = filter.icon;
              const isActive = activeFilter === filter.key;
              
              return (
                <button
                  key={filter.key}
                  onClick={() => setActiveFilter(filter.key)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
                    ${isActive 
                      ? `${filter.color} text-white shadow-lg transform scale-105` 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                    }
                  `}
                  aria-pressed={isActive}
                >
                  <Icon size={16} />
                  <span>{filter.label}</span>
                  <span className={`
                    px-2 py-0.5 rounded-full text-xs font-bold min-w-[20px] text-center
                    ${isActive ? 'bg-white/20' : filter.color + ' text-white'}
                  `}>
                    {filter.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Orders List or Route Optimizer */}
      <div className="space-y-6">
        {activeFilter === 'optimize' ? (
          <RouteOptimizer orders={deliveryOrders} />
        ) : (
          <>
            {sortedOrders.length === 0 ? (
              <div className="card">
                <div className="card-body">
                  <div className="text-center py-8">
                    <Package size={48} className="mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                      No hay pedidos en esta categoría
                    </h3>
                    <p className="text-gray-500">
                      {activeFilter === 'ready' && 'Los pedidos listos aparecerán aquí automáticamente'}
                      {activeFilter === 'delivered' && 'Los pedidos entregados aparecerán aquí'}
                      {activeFilter === 'unpaid' && 'Los pedidos por cobrar aparecerán aquí'}
                      {activeFilter === 'all' && 'Todos los pedidos para delivery aparecerán aquí'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {sortedOrders.map((order) => (
                  <DeliveryOrderCard
                    key={order.id}
                    order={order}
                    onMarkAsDelivered={handleMarkAsDelivered}
                    onConfirmPayment={handleConfirmPayment}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Quick Actions Footer */}
      {stats.ready > 0 && (
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="text-green-500" size={20} />
                <span className="font-medium text-gray-800">
                  {stats.ready} pedido(s) listo(s) para entregar
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock size={16} />
                <span>Actualización en tiempo real</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Empty state component
const EmptyDelivery: React.FC = () => (
  <div className="card">
    <div className="card-body">
      <div className="text-center py-12">
        <Truck size={64} className="mx-auto mb-4 text-gray-300" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">
          No hay pedidos para delivery
        </h3>
        <p className="text-gray-500 mb-6">
          Los pedidos listos para entregar aparecerán aquí automáticamente
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg">
          <MapPin size={16} />
          <span className="text-sm font-medium">Esperando pedidos de cocina</span>
        </div>
      </div>
    </div>
  </div>
);