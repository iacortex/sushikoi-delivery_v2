import React, { useMemo } from 'react';
import { Package, Clock, ChefHat } from 'lucide-react';
import type { Order, OrderStatus } from '@/types';
import { useTicker } from '@/hooks/useTicker';
import { OrderCard } from './OrderCard';
import { useOrders } from '@/features/orders/useOrders';

type OrdersApi = ReturnType<typeof useOrders>;

// ✅ ahora Cocina recibe el store completo
type Props = {
  ordersApi: OrdersApi;
};

export const CookBoard: React.FC<Props> = ({ ordersApi }) => {
  useTicker();

  // no mostrar entregadas
  const kitchenOrders = useMemo(
    () => ordersApi.orders.filter(o => o.status !== 'delivered'),
    [ordersApi.orders]
  );

  const pending = useMemo(
    () => kitchenOrders.filter(o => o.status === 'pending'),
    [kitchenOrders]
  );
  const cooking = useMemo(
    () => kitchenOrders.filter(o => o.status === 'cooking'),
    [kitchenOrders]
  );
  const ready = useMemo(
    () => kitchenOrders.filter(o => o.status === 'ready'),
    [kitchenOrders]
  );

  const counts = {
    pending: pending.length,
    cooking: cooking.length,
    ready: ready.length,
    total: kitchenOrders.length,
  };

  const onStatusChange = (orderId: number, status: OrderStatus) => {
    ordersApi.updateOrderStatus(orderId, status);
  };

  return (
    <div className="space-y-6">
      {/* Header con contadores */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChefHat className="text-orange-500" />
            <div>
              <h3 className="text-lg font-semibold">Cocina</h3>
              <p className="text-xs text-gray-500">
                {counts.total} orden{counts.total !== 1 ? 'es' : ''} en proceso
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-yellow-100 text-yellow-800">
              <Clock size={14} /> Pendientes: {counts.pending}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-orange-100 text-orange-800">
              🍳 En cocina: {counts.cooking}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-100 text-green-800">
              <Package size={14} /> Listos: {counts.ready}
            </span>
          </div>
        </div>
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KanbanColumn
          title="Pendiente"
          icon={Clock}
          color="yellow"
          orders={pending}
          onStatusChange={onStatusChange}
          nextStatus="cooking"
          actionLabel="A cocina"
        />

        <KanbanColumn
          title="En cocina"
          icon={ChefHat}
          color="orange"
          orders={cooking}
          onStatusChange={onStatusChange}
          nextStatus="ready"
          actionLabel="Marcar listo"
        />

        <KanbanColumn
          title="Listo"
          icon={Package}
          color="green"
          orders={ready}
          onStatusChange={onStatusChange}
          nextStatus="delivered"
          actionLabel="Entregar"
          isReadyColumn
        />
      </div>
    </div>
  );
};

type ColumnColor = 'yellow' | 'orange' | 'green';

interface KanbanColumnProps {
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: ColumnColor;
  orders: Order[];
  onStatusChange: (orderId: number, status: OrderStatus) => void;
  nextStatus: OrderStatus;
  actionLabel: string;
  isReadyColumn?: boolean;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  title,
  icon: Icon,
  color,
  orders,
  onStatusChange,
  nextStatus,
  actionLabel,
  isReadyColumn = false,
}) => {
  const headerColor =
    color === 'yellow'
      ? 'bg-yellow-50 text-yellow-800 border-yellow-200'
      : color === 'orange'
      ? 'bg-orange-50 text-orange-800 border-orange-200'
      : 'bg-green-50 text-green-800 border-green-200';

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
      <div className={`flex items-center justify-between px-4 py-3 border-b ${headerColor}`}>
        <div className="flex items-center gap-2">
          <Icon size={18} className="opacity-80" />
          <h4 className="font-semibold">{title}</h4>
        </div>
        <span className="text-sm">{orders.length}</span>
      </div>

      <div className="p-3 space-y-3 min-h-[200px]">
        {orders.length === 0 ? (
          <div className="text-center text-sm text-gray-400 py-6">Sin órdenes</div>
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
