import React, { useMemo } from 'react';
import {
  Clock, Package, Bell, User, Phone, MapPin,
  AlertTriangle, CheckCircle, Timer, Flame
} from 'lucide-react';
import type { Order, OrderStatus } from '@/types';
import { formatTimeRemaining, shortCode, formatCLP } from '@/lib/format';
import { progressFor, minutesLeftFor } from '@/features/orders/helpers';
import { ORDER_STATUS_CONFIG } from '@/lib/constants';

interface OrderCardProps {
  order: Order;
  onStatusChange: (orderId: number, status: OrderStatus) => void;
  nextStatus?: OrderStatus;
  actionLabel?: string;
  isReadyColumn?: boolean;
}

const norm = (s: string) =>
  s.toLowerCase() as 'pending' | 'cooking' | 'ready' | 'delivered';

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onStatusChange,
  nextStatus,
  actionLabel,
  isReadyColumn = false,
}) => {
  const progress = useMemo(() => progressFor(order), [order]);
  const minutesLeft = useMemo(() => minutesLeftFor(order), [order]);

  const statusKey = norm(order.status as any);
  const statusConfig = ORDER_STATUS_CONFIG[statusKey];

  const timeInfo = useMemo(() => {
    const now = Date.now();
    const estimatedEnd = order.createdAt + order.estimatedTime * 60_000;
    const isOverdue = now > estimatedEnd && statusKey !== 'delivered';

    let cookingElapsed = 0;
    if (statusKey === 'cooking' && order.cookingAt) {
      cookingElapsed = Math.floor((now - order.cookingAt) / 60_000);
    }

    let packingTimeLeft = 0;
    let packingExpired = false;
    if (statusKey === 'ready' && order.packUntil) {
      const remaining = order.packUntil - now;
      packingTimeLeft = Math.max(0, remaining);
      packingExpired = remaining <= 0 && !order.packed;
    }

    return { isOverdue, cookingElapsed, packingTimeLeft, packingExpired, estimatedEnd };
  }, [order, statusKey]);

  const handleStatusChange = () => {
    if (nextStatus) onStatusChange(order.id, nextStatus);
  };

  const getCardClasses = () => {
    let classes = 'card hover:shadow-lg transition-all duration-200 ';
    if (timeInfo.isOverdue) classes += 'border-red-300 bg-red-50 ';
    else if (timeInfo.packingExpired) classes += 'border-amber-300 bg-amber-50 ';
    else if (statusKey === 'ready') classes += 'border-green-300 bg-green-50 ';
    else classes += 'border-gray-200 ';
    if (isReadyColumn && statusKey === 'ready') classes += ' ring-1 ring-green-300 ';
    return classes;
  };

  return (
    <div className={getCardClasses()}>
      <div className="card-body">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-lg font-bold text-gray-800">
                #{order.id.toString().slice(-4)}
              </h4>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                {shortCode(order.id)}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <User size={14} />
              <span className="font-medium">{order.name}</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Phone size={12} />
              <span>{order.phone}</span>
            </div>

            <p className="text-xs text-gray-500 mt-1">
              {new Date(order.createdAt).toLocaleTimeString('es-CL')}
            </p>
          </div>

          {/* Status Badge */}
          <div className={`status-pill ${statusConfig.color}`}>
            {statusKey === 'pending' && <Clock size={14} />}
            {statusKey === 'cooking' && <Package size={14} />}
            {statusKey === 'ready' && <Bell size={14} />}
            <span>{statusConfig.label}</span>
          </div>
        </div>

        {isReadyColumn && statusKey === 'ready' && (
          <div className="flex items-center gap-2 text-green-700 text-xs mb-3">
            <CheckCircle size={14} />
            <span className="font-medium">Listo para entregar</span>
          </div>
        )}

        {/* Items */}
        <div className="mb-4">
          <h5 className="font-semibold text-gray-700 mb-2 text-sm">Pedido:</h5>
          <ul className="text-sm space-y-1">
            {order.cart.map((item, index) => (
              <li key={index} className="flex justify-between items-center">
                <span className="text-gray-600">
                  {item.quantity}x {item.name}
                </span>
                <div className="flex items-center gap-2 text-xs text-orange-600">
                  <Clock size={10} />
                  <span>{item.cookingTime}min</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Time Info */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Tiempo estimado:</span>
            <span className="font-medium text-orange-600">
              {order.estimatedTime} min
            </span>
          </div>

          {statusKey === 'cooking' && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Cocinando:</span>
              <span className="font-medium text-blue-600">
                {timeInfo.cookingElapsed} min
              </span>
            </div>
          )}

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">{progress.label}</span>
              <span className="text-gray-500">
                {minutesLeft > 0 ? `${minutesLeft} min` : 'Completado'}
              </span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress.pct}%` }}
              />
            </div>
          </div>

          {timeInfo.isOverdue && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertTriangle size={14} />
              <span className="font-medium">¡Pedido atrasado!</span>
            </div>
          )}
        </div>

        {/* Packing Timer */}
        {statusKey === 'ready' && order.packUntil && (
          <div className="mb-4">
            <PackingTimer
              packUntil={order.packUntil}
              packed={order.packed}
              expired={timeInfo.packingExpired}
            />
          </div>
        )}

        {/* Payment */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total:</span>
            <span className="font-bold text-gray-800">
              ${formatCLP(order.total)}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs mt-1">
            <span className="text-gray-500">Pago:</span>
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded text-xs ${
                  order.paymentStatus === 'paid'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {order.paymentStatus === 'paid' ? 'Pagado' : 'Por pagar'}
              </span>
              <span className="text-gray-500 capitalize">
                {order.paymentStatus === 'paid'
                  ? order.paymentMethod
                  : order.dueMethod}
              </span>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="mb-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <MapPin size={10} />
            <span>
              {order.address}, {order.city}
            </span>
          </div>
          {order.references && (
            <p className="mt-1 text-blue-600">
              <strong>Ref:</strong> {order.references}
            </p>
          )}
        </div>

        {/* Action */}
        {nextStatus && actionLabel && (
          <button
            onClick={handleStatusChange}
            className={`w-full font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 ${
              nextStatus === 'cooking'
                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                : nextStatus === 'ready'
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-gray-500 hover:bg-gray-600 text-white'
            }`}
          >
            {nextStatus === 'cooking' && <Flame size={16} />}
            {nextStatus === 'ready' && <Bell size={16} />}
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
};

interface PackingTimerProps {
  packUntil: number;
  packed: boolean;
  expired: boolean;
}

const PackingTimer: React.FC<PackingTimerProps> = ({
  packUntil,
  packed,
  expired,
}) => {
  const timeRemaining = Math.max(0, packUntil - Date.now());
  const formattedTime = formatTimeRemaining(timeRemaining);

  if (packed) {
    return (
      <div className="flex items-center gap-2 text-green-600 text-sm">
        <CheckCircle size={14} />
        <span className="font-medium">Empacado completado</span>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="flex items-center gap-2 text-red-600 text-sm">
        <AlertTriangle size={14} />
        <span className="font-medium">¡Tiempo de empaque vencido!</span>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-amber-800">
          <Timer size={14} />
          <span className="font-medium text-sm">Tiempo de empaque:</span>
        </div>
        <span className="font-bold text-lg text-amber-800">
          {formattedTime}
        </span>
      </div>

      <div className="mt-2">
        <div className="w-full h-2 bg-amber-200 rounded-full overflow-hidden">
          <div
            className="h-2 bg-amber-500 transition-all duration-1000 ease-linear"
            style={{ width: `${Math.max(0, (timeRemaining / 90_000) * 100)}%` }}
          />
        </div>
      </div>

      <p className="text-xs text-amber-700 mt-1 text-center">
        Se marcará automáticamente como empacado cuando expire
      </p>
    </div>
  );
};
