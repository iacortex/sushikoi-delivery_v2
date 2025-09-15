import React, { useMemo } from 'react';
import { Package, Clock, ChefHat, Bell } from 'lucide-react';
import type { Order, OrderStatus } from '@/types';
import { useOrders } from '@/features/orders/useOrders';
import { useTicker } from '@/hooks/useTicker';
import { OrderCard } from './OrderCard';
import { KitchenStats } from './KitchenStats';

type Props = {
  orders?: Order[];
  onStatusChange?: (orderId: number, newStatus: OrderStatus) => void;
};

const norm = (s: string) =>
  s.toLowerCase() as 'pending' | 'cooking' | 'ready' | 'delivered';

export const CookBoard: React.FC<Props> = ({
  orders: externalOrders,
  onStatusChange,
}) => {
  useTicker();

  // fallback al hook si no llegan props
  const { orders: hookOrders, updateOrderStatus } = useOrders();
  const orders = externalOrders ?? hookOrders;
  const changeStatus = onStatusChange ?? updateOrderStatus;

  // filtra estados de cocina (tolera PENDING en mayúsculas)
  const kitchenOrders = useMemo(
    () => orders.filter(o => ['pending', 'cooking', 'ready'].includes(norm(o.status as any))),
    [orders]
  );

  const groups = useMemo(() => ({
    pending: kitchenOrders.filter(o => norm(o.status as any) === 'pending'),
    cooking: kitchenOrders.filter(o => norm(o.status as any) === 'cooking'),
    ready:   kitchenOrders.filter(o => norm(o.status as any) === 'ready'),
  }), [kitchenOrders]);

  if (kitchenOrders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card">
          <div className="card-body">
            <div className="text-center py-12">
              <ChefHat size={64} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No hay pedidos en cocina</h3>
              <p className="text-gray-500 mb-6">Los nuevos pedidos aparecerán aquí automáticamente</p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                <Package size={16} />
                <span className="text-sm font-medium">Cocina lista para trabajar</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <KitchenStats orders={orders} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <KanbanColumn
          title="Pendientes"
          icon={Clock}
          color="yellow"
          orders={groups.pending}
          onStatusChange={changeStatus}
          nextStatus="cooking"
          actionLabel="Comenzar a Cocinar"
        />
        <KanbanColumn
          title="En Cocina"
          icon={Package}
          color="orange"
          orders={groups.cooking}
          onStatusChange={changeStatus}
          nextStatus="ready"
          actionLabel="Marcar como Listo"
        />
        <KanbanColumn
          title="Listos para Delivery"
          icon={Bell}
          color="green"
          orders={groups.ready}
          onStatusChange={changeStatus}
          isReadyColumn
        />
      </div>
    </div>
  );
};

interface KanbanColumnProps {
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: 'yellow' | 'orange' | 'green';
  orders: Order[];
  onStatusChange: (orderId: number, status: OrderStatus) => void;
  nextStatus?: OrderStatus;
  actionLabel?: string;
  isReadyColumn?: boolean;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  title, icon: Icon, color, orders, onStatusChange, nextStatus, actionLabel, isReadyColumn = false,
}) => {
  const colorClasses = {
    yellow: { header: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: 'text-yellow-600', count: 'bg-yellow-500' },
    orange: { header: 'bg-orange-100 text-orange-800 border-orange-200', icon: 'text-orange-600', count: 'bg-orange-500' },
    green:  { header: 'bg-green-100  text-green-800  border-green-200',  icon: 'text-green-600',  count: 'bg-green-500'  },
  } as const;

  const classes = colorClasses[color];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className={`p-4 rounded-lg border ${classes.header}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon size={20} className={classes.icon} />
            <h3 className="font-semibold">{title}</h3>
          </div>
          <span className={`px-2 py-1 ${classes.count} text-white text-sm font-bold rounded-full min-w-[24px] text-center`}>
            {orders.length}
          </span>
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-4 min-h-[400px]">
        {orders.length === 0 ? (
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
            <Icon size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-500">Sin pedidos</p>
          </div>
        ) : (
          orders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusChange={onStatusChange}
              nextStatus={nextStatus}
              actionLabel={actionLabel}
              isReadyColumn={isReadyColumn}
            />
          ))
        )}
      </div>
    </div>
  );
};
