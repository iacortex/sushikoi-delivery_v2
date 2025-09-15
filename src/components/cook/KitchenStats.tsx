import React, { useMemo } from 'react';
import { Clock, Flame, Package, AlertTriangle, TrendingUp, Timer } from 'lucide-react';
import type { Order } from '@/types';

interface KitchenStatsProps {
  orders: Order[];
}

export const KitchenStats: React.FC<KitchenStatsProps> = ({ orders }) => {
  const stats = useMemo(() => {
    const now = Date.now();

    const kitchenOrders = orders.filter(order =>
      ['pending', 'cooking', 'ready'].includes((order.status as string).toLowerCase())
    );

    const lc = (s: string) => s.toLowerCase();
    const pending = kitchenOrders.filter(o => lc(o.status as any) === 'pending').length;
    const cooking = kitchenOrders.filter(o => lc(o.status as any) === 'cooking').length;
    const ready   = kitchenOrders.filter(o => lc(o.status as any) === 'ready').length;

    const overdue = kitchenOrders.filter(order => {
      const estimatedEnd = order.createdAt + (order.estimatedTime * 60_000);
      return now > estimatedEnd;
    });

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayOrders = orders.filter(order =>
      order.createdAt >= today.getTime() && lc(order.status as any) === 'delivered' && order.cookingAt
    );

    const avgCookingTime = todayOrders.length > 0
      ? todayOrders.reduce((sum, order) => {
          const cookingTime = (order.cookingAt! - order.createdAt) / 60_000;
          return sum + cookingTime;
        }, 0) / todayOrders.length
      : 0;

    const longestWaiting = kitchenOrders.reduce((longest, order) => {
      const waitTime = now - order.createdAt;
      return waitTime > (longest?.waitTime || 0)
        ? { ...order, waitTime }
        : longest;
    }, null as (Order & { waitTime: number }) | null);

    const packingExpired = kitchenOrders.filter(order =>
      lc(order.status as any) === 'ready' && order.packUntil && now > order.packUntil && !order.packed
    ).length;

    return {
      total: kitchenOrders.length,
      pending,
      cooking,
      ready,
      overdue: overdue.length,
      packingExpired,
      avgCookingTime: Math.round(avgCookingTime),
      longestWaiting,
      todayCompleted: todayOrders.length,
    };
  }, [orders]);

  const statCards = [
    { title: 'En Cola', value: stats.pending, icon: Clock, color: 'yellow', description: 'Esperando cocinar' },
    { title: 'Cocinando', value: stats.cooking, icon: Flame, color: 'orange', description: 'En preparación' },
    { title: 'Listos', value: stats.ready, icon: Package, color: 'green', description: 'Para delivery' },
    { title: 'Atrasados', value: stats.overdue, icon: AlertTriangle, color: stats.overdue > 0 ? 'red' : 'gray', description: 'Pasaron tiempo estimado' },
  ];

  const performanceCards = [
    { title: 'Completados Hoy', value: stats.todayCompleted, icon: TrendingUp, color: 'blue', description: 'Pedidos entregados' },
    { title: 'Tiempo Promedio', value: stats.avgCookingTime > 0 ? `${stats.avgCookingTime} min` : '--', icon: Timer, color: 'purple', description: 'Cocción promedio hoy' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => <StatCard key={i} {...stat} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {performanceCards.map((stat, i) => <StatCard key={`perf-${i}`} {...stat} />)}
      </div>

      {(stats.overdue > 0 || stats.packingExpired > 0 || stats.longestWaiting) && (
        <div className="card">
          <div className="card-body">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-500" />
              Alertas de Cocina
            </h4>
            <div className="space-y-2">
              {stats.overdue > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 font-medium">
                    ⚠️ {stats.overdue} pedido(s) han superado el tiempo estimado
                  </p>
                </div>
              )}
              {stats.packingExpired > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-amber-800 font-medium">
                    📦 {stats.packingExpired} pedido(s) con tiempo de empaque vencido
                  </p>
                </div>
              )}
              {stats.longestWaiting && stats.longestWaiting.waitTime > 1800_000 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-blue-800 font-medium">
                    ⏰ Pedido #{stats.longestWaiting.id.toString().slice(-4)} lleva {Math.round(stats.longestWaiting.waitTime / 60_000)} minutos esperando
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ size?: number }>;
  color: string;
  description: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, description }) => {
  const colorMap: Record<string, string> = {
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    orange: 'bg-orange-100 text-orange-800 border-orange-200',
    green: 'bg-green-100 text-green-800 border-green-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    gray: 'bg-gray-100 text-gray-600 border-gray-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
  };

  return (
    <div className={`p-4 rounded-lg border ${colorMap[color] ?? colorMap.gray}`}>
      <div className="flex items-center gap-3">
        <Icon size={20} />
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
    </div>
  );
};
