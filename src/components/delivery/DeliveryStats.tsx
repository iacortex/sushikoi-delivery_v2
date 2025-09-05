import React from 'react';
import { Package, CheckCircle, DollarSign, TrendingUp, Clock, MapPin } from 'lucide-react';
import { formatCLP } from '@/lib/format';

interface DeliveryStatsProps {
  stats: {
    ready: number;
    delivered: number;
    unpaid: number;
    todayDelivered: number;
    todayRevenue: number;
    total: number;
  };
}

export const DeliveryStats: React.FC<DeliveryStatsProps> = ({ stats }) => {
  const mainStats = [
    {
      title: 'Para Entregar',
      value: stats.ready,
      icon: Package,
      color: 'green',
      description: 'Listos para delivery',
      priority: 'high',
    },
    {
      title: 'Por Cobrar',
      value: stats.unpaid,
      icon: DollarSign,
      color: stats.unpaid > 0 ? 'red' : 'gray',
      description: 'Pagos pendientes',
      priority: stats.unpaid > 0 ? 'high' : 'normal',
    },
    {
      title: 'Entregados Hoy',
      value: stats.todayDelivered,
      icon: CheckCircle,
      color: 'blue',
      description: 'Completados hoy',
      priority: 'normal',
    },
    {
      title: 'Ingresos Hoy',
      value: `$${formatCLP(stats.todayRevenue)}`,
      icon: TrendingUp,
      color: 'purple',
      description: 'Revenue del día',
      priority: 'normal',
    },
  ];

  const performanceMetrics = [
    {
      label: 'Eficiencia de entrega',
      value: stats.total > 0 ? `${Math.round((stats.delivered / stats.total) * 100)}%` : '0%',
      description: 'Pedidos entregados vs total',
    },
    {
      label: 'Pendientes de pago',
      value: stats.total > 0 ? `${Math.round((stats.unpaid / stats.total) * 100)}%` : '0%',
      description: 'Porcentaje por cobrar',
    },
    {
      label: 'Actividad hoy',
      value: `${stats.todayDelivered} entregas`,
      description: 'Pedidos completados hoy',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Main Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {mainStats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Performance Metrics */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <TrendingUp size={18} className="text-purple-600" />
            Métricas de Rendimiento
          </h3>
        </div>
        
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {performanceMetrics.map((metric, index) => (
              <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-lg font-bold text-gray-800">{metric.value}</p>
                <p className="text-sm font-medium text-gray-700">{metric.label}</p>
                <p className="text-xs text-gray-500">{metric.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions & Alerts */}
      {(stats.ready > 0 || stats.unpaid > 0) && (
        <div className="card">
          <div className="card-body">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Clock size={18} className="text-orange-500" />
              Estado Actual
            </h4>
            
            <div className="space-y-2">
              {stats.ready > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Package size={16} className="text-green-600" />
                    <span className="text-green-800 font-medium">
                      {stats.ready} pedido(s) listo(s) para entregar
                    </span>
                  </div>
                </div>
              )}
              
              {stats.unpaid > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <DollarSign size={16} className="text-red-600" />
                    <span className="text-red-800 font-medium">
                      {stats.unpaid} pedido(s) con pago pendiente
                    </span>
                  </div>
                </div>
              )}
              
              {stats.ready === 0 && stats.unpaid === 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-blue-600" />
                    <span className="text-blue-800 font-medium">
                      Todo al día - Sin entregas pendientes
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Stat card component
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: 'green' | 'red' | 'blue' | 'purple' | 'gray';
  description: string;
  priority?: 'high' | 'normal';
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  color,
  description,
  priority = 'normal',
}) => {
  const colorClasses = {
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-600',
      value: 'text-green-800',
      title: 'text-green-700',
    },
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-600',
      value: 'text-red-800',
      title: 'text-red-700',
    },
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-600',
      value: 'text-blue-800',
      title: 'text-blue-700',
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      icon: 'text-purple-600',
      value: 'text-purple-800',
      title: 'text-purple-700',
    },
    gray: {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      icon: 'text-gray-600',
      value: 'text-gray-800',
      title: 'text-gray-700',
    },
  };

  const classes = colorClasses[color];
  const isPriority = priority === 'high';

  return (
    <div className={`
      ${classes.bg} ${classes.border} border rounded-lg p-4 transition-all duration-200
      ${isPriority ? 'ring-2 ring-offset-1 ring-red-300 shadow-lg' : 'hover:shadow-md'}
    `}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className={`text-sm font-medium ${classes.title} mb-1`}>
            {title}
          </p>
          <p className={`text-2xl font-bold ${classes.value} ${isPriority ? 'animate-pulse' : ''}`}>
            {value}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {description}
          </p>
        </div>
        <div className={`p-3 rounded-full ${classes.bg} ${isPriority ? 'animate-bounce' : ''}`}>
          <Icon size={20} className={classes.icon} />
        </div>
      </div>
      
      {isPriority && (
        <div className="mt-2 text-xs text-red-600 font-medium flex items-center gap-1">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
          Requiere atención
        </div>
      )}
    </div>
  );
};