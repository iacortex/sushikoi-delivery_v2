import React, { useMemo } from "react";
import {
  ArrowLeft, Clock, Package, Bell, CheckCircle, User, Phone, MapPin,
  CreditCard, QrCode, Share2, Timer, AlertCircle
} from "lucide-react";
import type { Order } from "@/types";
import { formatCLP, shortCode, formatTimeRemaining } from "@/lib/format";
import { progressFor, minutesLeftFor } from "@/features/orders/helpers";
import { getTrackingQRUrl } from "@/lib/urls";
import { ORDER_STATUS_CONFIG } from "@/lib/constants";

interface OrderTrackerProps {
  order: Order;
  onClear: () => void;
}

export const OrderTracker: React.FC<OrderTrackerProps> = ({ order, onClear }) => {
  const progress = useMemo(() => progressFor(order), [order]);
  const minutesLeft = useMemo(() => minutesLeftFor(order), [order]);
  const statusConfig = ORDER_STATUS_CONFIG[order.status];

  const estimatedCompletion = useMemo(() => {
    if (order.status === "delivered") return new Date(order.createdAt);
    const totalTime = (order.estimatedTime || 15) * 60 * 1000;
    return new Date(order.createdAt + totalTime);
  }, [order]);

  const packingInfo = useMemo(() => {
    if (order.status !== "ready" || !order.packUntil) return null;
    const now = Date.now();
    const timeLeft = Math.max(0, order.packUntil - now);
    const expired = timeLeft <= 0;
    return { timeLeft, expired, packed: order.packed, formattedTime: formatTimeRemaining(timeLeft) };
  }, [order.packUntil, order.packed, order.status]);

  const handleShare = async () => {
    const trackingUrl = `${window.location.origin}${window.location.pathname}#order-${shortCode(order.id)}`;
    try {
      if ((navigator as any).share) {
        await (navigator as any).share({
          title: `Seguimiento Pedido #${shortCode(order.id)}`,
          text: `Sigue el estado de tu pedido en tiempo real`,
          url: trackingUrl,
        });
      } else {
        await navigator.clipboard.writeText(trackingUrl);
        alert("📋 Link de seguimiento copiado al portapapeles");
      }
    } catch {
      try {
        await navigator.clipboard.writeText(trackingUrl);
        alert("📋 Link de seguimiento copiado al portapapeles");
      } catch {}
    }
  };

  const statusSteps = [
    { key: "pending", label: "Pedido Recibido", icon: Clock },
    { key: "cooking", label: "En Preparación", icon: Package },
    { key: "ready", label: "Listo/Empacando", icon: Bell },
    { key: "delivered", label: "Entregado", icon: CheckCircle },
  ] as const;
  const currentStepIndex = statusSteps.findIndex((s) => s.key === order.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button onClick={onClear} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Volver">
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Pedido #{String(order.id).slice(-4)}</h2>
                <p className="text-sm text-gray-600">
                  Código: <span className="font-mono font-semibold">{shortCode(order.id)}</span>
                </p>
              </div>
            </div>
            <button onClick={handleShare} className="flex items-center gap-2 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg">
              <Share2 size={16} />
              <span className="hidden sm:inline">Compartir</span>
            </button>
          </div>

          {/* Estado actual */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`status-pill ${statusConfig.color}`}>
                  {order.status === "pending" && <Clock size={14} />}
                  {order.status === "cooking" && <Package size={14} />}
                  {order.status === "ready" && <Bell size={14} />}
                  {order.status === "delivered" && <CheckCircle size={14} />}
                  <span>{statusConfig.label}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">
                  {minutesLeft > 0 ? `Quedan ${minutesLeft} min` : "Tiempo completado"}
                </p>
                <p className="text-xs text-gray-500">ETA: {estimatedCompletion.toLocaleTimeString("es-CL")}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">{progress.label}</span>
                <span className="text-gray-600">{progress.pct}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress.pct}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="card">
        <div className="card-header"><h3 className="font-semibold text-gray-800">Estado del Pedido</h3></div>
        <div className="card-body">
          <div className="space-y-4">
            {statusSteps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              return (
                <div key={step.key} className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    isCompleted ? "bg-green-500 border-green-500 text-white" :
                    isCurrent ? "bg-blue-500 border-blue-500 text-white animate-pulse" :
                    "bg-gray-100 border-gray-300 text-gray-400"
                  }`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${
                      isCompleted ? "text-green-700" : isCurrent ? "text-blue-700" : "text-gray-500"
                    }`}>{step.label}</p>
                    {isCurrent && (
                      <p className="text-sm text-blue-600 mt-1">
                        {order.status === "pending" && "Tu pedido está en cola para ser preparado"}
                        {order.status === "cooking" && "Nuestros chefs están preparando tu pedido"}
                        {order.status === "ready" && "Tu pedido está listo y siendo empacado"}
                        {order.status === "delivered" && "¡Tu pedido ha sido entregado!"}
                      </p>
                    )}
                    {isCompleted && !isCurrent && <p className="text-sm text-green-600 mt-1">✓ Completado</p>}
                  </div>
                  {isCurrent && (
                    <div className="text-right text-sm text-gray-600">
                      <Timer size={14} className="inline mr-1" />
                      {minutesLeft > 0 ? `${minutesLeft} min` : "Pronto"}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Empaque (si aplica) */}
      {packingInfo && order.status === "ready" && (
        <div className="card">
          <div className="card-body">
            {packingInfo.packed ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle size={16} /><span className="font-medium">¡Empacado y listo para entrega!</span>
              </div>
            ) : packingInfo.expired ? (
              <div className="flex items-center gap-2 text-amber-700">
                <AlertCircle size={16} /><span className="font-medium">Finalizando empaque...</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-blue-700">📦 Empacando tu pedido...</span>
                  <span className="font-bold text-blue-800">{packingInfo.formattedTime}</span>
                </div>
                <div className="w-full h-3 bg-blue-100 rounded-full overflow-hidden">
                  <div className="h-3 bg-blue-500 transition-all duration-1000"
                       style={{ width: `${Math.max(0, (packingInfo.timeLeft / 90_000) * 100)}%` }} />
                </div>
                <p className="text-sm text-blue-600">Tu pedido estará listo para delivery en menos de 2 minutos</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info del pedido */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header"><h3 className="font-semibold text-gray-800">Detalles del Pedido</h3></div>
          <div className="card-body space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2"><User size={16} className="text-gray-500" /><span className="font-medium text-gray-700">Cliente</span></div>
              <p className="text-gray-800">{order.name}</p>
              <div className="flex items-center gap-2 mt-1"><Phone size={12} className="text-gray-400" /><span className="text-sm text-gray-600">{order.phone}</span></div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2"><MapPin size={16} className="text-gray-500" /><span className="font-medium text-gray-700">Dirección</span></div>
              <p className="text-gray-800">{order.address}</p>
              <p className="text-sm text-gray-600">{(order as any).city}</p>
              {order.references && <p className="text-sm text-blue-600 mt-1"><strong>Referencias:</strong> {order.references}</p>}
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Pedido</h4>
              <ul className="space-y-2">
                {order.cart.map((it, idx) => (
                  <li key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-700">{it.quantity}x {it.name}</span>
                    <span className="font-medium text-gray-800">${formatCLP(it.discountPrice * it.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="border-t pt-2 mt-3 flex justify-between font-bold text-gray-800">
                <span>Total:</span><span>${formatCLP(order.total)}</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2"><CreditCard size={16} className="text-gray-500" /><span className="font-medium text-gray-700">Pago</span></div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  order.paymentStatus === "paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                }`}>
                  {order.paymentStatus === "paid" ? "Pagado" : "Por pagar en entrega"}
                </span>
                <span className="text-sm text-gray-600 capitalize">
                  {order.paymentStatus === "paid" ? order.paymentMethod : (order as any).dueMethod}
                </span>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Tiempos</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Pedido realizado:</span><span className="text-gray-800">{new Date(order.createdAt).toLocaleString("es-CL")}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Tiempo estimado:</span><span className="text-gray-800">{order.estimatedTime} minutos</span></div>
                <div className="flex justify-between"><span className="text-gray-600">ETA aproximado:</span><span className="text-gray-800">{estimatedCompletion.toLocaleTimeString("es-CL")}</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* QR */}
        <div className="card">
          <div className="card-header"><h3 className="font-semibold text-gray-800">Código QR de Seguimiento</h3></div>
          <div className="card-body">
            <div className="text-center space-y-4">
              <div className="bg-gray-50 rounded-lg p-6">
                <img
                  src={getTrackingQRUrl(shortCode(order.id), 200)}
                  alt={`QR Seguimiento Pedido ${shortCode(order.id)}`}
                  className="mx-auto border rounded-lg shadow-sm"
                />
              </div>
              <button onClick={handleShare} className="btn-primary w-full">
                <Share2 size={16} /> Compartir Seguimiento
              </button>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-blue-800 mb-1"><QrCode size={14} /><span className="text-xs font-medium">Código de pedido</span></div>
                <p className="font-mono text-lg font-bold text-blue-900">{shortCode(order.id)}</p>
                <p className="text-xs text-blue-600 mt-1">Guarda este código para futuras consultas</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mensaje final */}
      {order.status === "delivered" ? (
        <div className="card">
          <div className="card-body">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <CheckCircle size={32} className="mx-auto mb-3 text-green-600" />
              <h3 className="text-lg font-semibold text-green-800 mb-2">¡Pedido Entregado!</h3>
              <p className="text-green-700">Gracias por confiar en nosotros. ¡Que lo disfrutes!</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
