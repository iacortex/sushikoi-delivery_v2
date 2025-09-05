import React from 'react';
import { DollarSign, Clock, Package, AlertCircle } from 'lucide-react';
import { formatCLP } from '@/lib/format';

interface StatsCardsProps {
  stats: {
    total: number;
    byStatus: Record<string, number>;
    due: number;
    deliveredCount: number;
  };
}

interface StatCard {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  bgColor: string;
  description?: string;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const cards: StatCard[] = [
    {
      title: 'Ventas Totales',
      value: `$${formatCLP(stats.total)}`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      description: 'Ingresos acumulados',
    },
    {
      title: 'Pendientes',
      value: stats.byStatus.pending || 0,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      description: 'Órdenes en cola',
    },
    {
      title: 'Listos/Delivery',
      value: stats.byStatus.ready || 0,
      icon: Package,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Para entregar',
    },
    {
      title: 'Por Cobrar',
      value: stats.due,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description: 'Pagos pendientes',
    },
  ];

  return (
    <div className="grid-dashboard">
      {cards.map((card, index) => {
        const Icon = card.icon;
        
        return (
          <div key={index} className="card fade-in">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {card.title}
                  </p>
                  <p className={`text-2xl font-bold ${card.color}`}>
                    {card.value}
                  </p>
                  {card.description && (
                    <p className="text-xs text-gray-500 mt-1">
                      {card.description}
                    </p>
                  )}
                </div>
                <div className={`p-3 rounded-full ${card.bgColor}`}>
                  <Icon size={24} className={card.color} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};