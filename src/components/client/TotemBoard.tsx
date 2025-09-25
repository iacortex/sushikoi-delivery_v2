import React, { useMemo } from "react";
import { Monitor, Clock, Package, Bell, Timer } from "lucide-react";
import type { Order } from "@/types";
import { progressFor, minutesLeftFor } from "@/features/orders/helpers";
import { shortCode } from "@/lib/format";
import { getTrackingQRUrl } from "@/lib/urls";

interface TotemBoardProps { orders: Order[]; }

export const TotemBoard: React.FC<TotemBoardProps> = ({ orders }) => {
  const activeOrders = useMemo(
    () => orders.filter(o => o.status !== "delivered").sort((a, b) => b.createdAt - a.createdAt).slice(0, 12),
    [orders]
  );
  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter(o => o.status === "pending").length;
    const cooking = orders.filter(o => o.status === "cooking").length;
    const ready = orders.filter(o => o.status === "ready").length;
    const delivered = orders.filter(o => o.status === "delivered").length;
    return { total, pending, cooking, ready, delivered };
  }, [orders]);

  if (activeOrders.length === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-xl p-8 min-h-[600px] flex items-center justify-center">
        <div className="text-center">
          <Monitor size={64} className="mx-auto mb-4 text-gray-400" />
          <h2 className="text-3xl font-bold mb-4">🍣 Sushi Delivery</h2>
          <p className="text-xl text-gray-300 mb-2">Sin pedidos activos</p>
          <p className="text-gray-400">Los nuevos pedidos aparecerán aquí en tiempo real</p>
          <div className="mt-8 grid grid-cols-2 gap-4 max-w-md mx-auto">
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-gray-300">Total hoy</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-400">{stats.delivered}</p>
              <p className="text-sm text-gray-300">Entregados</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-xl p-6 min-h-[700px]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-red-500 p-3 rounded-full"><Monitor size={24} className="text-white" /></div>
          <div>
            <h2 className="text-2xl font-bold">🍣 Pedidos en Tiempo Real</h2>
            <p className="text-gray-300">Seguimiento automático • Actualización continua</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white/10 rounded-lg px-4 py-2 text-center">
            <p className="text-lg font-bold text-orange-400">{stats.pending + stats.cooking}</p>
            <p className="text-xs text-gray-300">Preparando</p>
          </div>
          <div className="bg-white/10 rounded-lg px-4 py-2 text-center">
            <p className="text-lg font-bold text-green-400">{stats.ready}</p>
            <p className="text-xs text-gray-300">Listos</p>
          </div>
          <div className="bg-white/10 rounded-lg px-4 py-2 text-center">
            <p className="text-lg font-bold">{activeOrders.length}</p>
            <p className="text-xs text-gray-300">Activos</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-300">EN VIVO</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {activeOrders.map((order) => (<TotemOrderCard key={order.id} order={order} />))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-700 flex items-center justify-between text-sm text-gray-400">
        <div className="flex items-center gap-2"><Timer size={16} /><span>Última actualización: {new Date().toLocaleTimeString("es-CL")}</span></div>
        <div><span>🍣 Sushi Delivery Puerto Montt • Sistema de seguimiento</span></div>
      </div>
    </div>
  );
};

const TotemOrderCard: React.FC<{ order: Order }> = ({ order }) => {
  const progress = useMemo(() => progressFor(order), [order]);
  const minutesLeft = useMemo(() => minutesLeftFor(order), [order]);

  const config = (() => {
    switch (order.status) {
      case "pending":   return { bg: "bg-yellow-500/20 border-yellow-500/50", text: "text-yellow-300", label: "En Cola", Icon: Clock };
      case "cooking":   return { bg: "bg-orange-500/20 border-orange-500/50", text: "text-orange-300", label: "Cocinando", Icon: Package };
      case "ready":     return { bg: "bg-green-500/20 border-green-500/50", text: "text-green-300", label: "Listo", Icon: Bell };
      default:          return { bg: "bg-gray-500/20 border-gray-500/50", text: "text-gray-300", label: "Procesando", Icon: Clock };
    }
  })();

  const { Icon } = config;

  return (
    <div className={`${config.bg} border-2 rounded-lg p-4 transition-all duration-300 hover:scale-105 ${order.status === "cooking" ? "animate-pulse" : ""}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-gray-400">Código</p>
          <p className="text-2xl font-black tracking-widest font-mono">{shortCode(order.id)}</p>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
          <Icon size={12} /><span>{config.label}</span>
        </div>
      </div>

      <div className="mb-3">
        <p className="text-sm text-gray-400">Cliente</p>
        <p className="font-medium text-white truncate" title={order.name}>{order.name}</p>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-400">{progress.label}</span>
          <span className={config.text}>{minutesLeft > 0 ? `${minutesLeft} min` : "Completado"}</span>
        </div>
        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
          <div className={`h-2 transition-all duration-1000 ${
              order.status === "pending" ? "bg-yellow-500" :
              order.status === "cooking" ? "bg-orange-500" :
              order.status === "ready"   ? "bg-green-500"  : "bg-gray-500"
            }`} style={{ width: `${progress.pct}%` }} />
        </div>
      </div>

      <div className="mb-3">
        <span className={`text-xs px-2 py-1 rounded ${
          order.paymentStatus === "paid" ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"
        }`}>
          {order.paymentStatus === "paid" ? "Pagado" : "Por pagar"}
        </span>
      </div>

      <div className="text-center">
        <p className="text-xs text-gray-400 mb-2">Seguimiento</p>
        <div className="bg-white p-2 rounded-lg inline-block">
          <img src={getTrackingQRUrl(shortCode(order.id), 80)} alt={`QR ${shortCode(order.id)}`} className="w-16 h-16" />
        </div>
      </div>

      <div className="mt-3 text-center">
        <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}</p>
      </div>
    </div>
  );
};
