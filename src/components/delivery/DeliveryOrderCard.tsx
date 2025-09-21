import React, { useCallback, useMemo, useState, Suspense } from "react";
import {
  Navigation, CheckCircle2, CreditCard, MapPin, Phone, User, AlertCircle,
  Clock, Package, ExternalLink, Copy
} from "lucide-react";
import type { Order } from "@/types";
import { normalizeStatus } from "@/features/orders/helpers";
import { ORDER_STATUS_CONFIG } from "@/lib/constants";
import { shortCode, formatCLP, formatKm, formatDur, formatTimeRemaining } from "@/lib/format";
import { gmapsDir, wazeUrl, getWazeQRUrl, getTrackingQRUrl } from "@/lib/urls";

const LazyLeafletMap = React.lazy(async () => {
  const mod = await import("@/features/map/LeafletMap");
  return { default: mod.LeafletMap };
});

export interface DeliveryOrderCardProps {
  order: Order;
  onMarkAsDelivered?: (orderId: number) => void | Promise<void>;
  onAssign?: (name: string, phone?: string) => void | Promise<void>;
  onStart?: () => void | Promise<void>;
}

const telHref = (phone?: string) => phone ? `tel:${phone.replace(/\s+/g,"")}` : undefined;
const waHref  = (phone?: string, text?: string) => {
  if (!phone) return undefined;
  const clean = phone.replace(/[^\d]/g, "");
  const msg = encodeURIComponent(text || "Hola, voy en camino con tu pedido 🛵");
  return `https://wa.me/${clean}?text=${msg}`;
};
const safeOpen = (url?: string) => { try { if (url) window.open(url, "_blank", "noopener,noreferrer"); } catch {} };

export const DeliveryOrderCard: React.FC<DeliveryOrderCardProps> = React.memo(({ order, onMarkAsDelivered, onAssign, onStart }) => {
  const [showMap, setShowMap] = useState(false);

  const status = normalizeStatus(order.status);
  const cfg = ORDER_STATUS_CONFIG[status] ?? { label: status, color: "bg-gray-100 text-gray-700" };
  const isPaid = order.paymentStatus === "paid";
  const isDue  = order.paymentStatus === "due";

  const coordsOk = !!order.coordinates && Number.isFinite(order.coordinates.lat) && Number.isFinite(order.coordinates.lng);
  const hasRoute = !!order.routeMeta && Number.isFinite(order.routeMeta.distance) && Number.isFinite(order.routeMeta.duration);

  const canMarkDelivered =
    (status === "ready" || status === "on_route") && (isPaid || !isDue);

  const packingInfo = useMemo(() => {
    if (status !== "ready" || !order.packUntil) return null;
    const now = Date.now();
    const left = Math.max(0, order.packUntil - now);
    const expired = left <= 0;
    return {
      expired,
      packed: !!order.packed,
      pct: Math.max(0, Math.min(100, (left / 90_000) * 100)),
      label: formatTimeRemaining(left),
    };
  }, [order.packUntil, order.packed, status]);

  const onMaps = useCallback(() => {
    if (!coordsOk) return;
    safeOpen(gmapsDir(order.coordinates.lat, order.coordinates.lng));
  }, [coordsOk, order.coordinates]);

  const onWaze = useCallback(() => {
    if (!coordsOk) return;
    safeOpen(wazeUrl(order.coordinates.lat, order.coordinates.lng));
  }, [coordsOk, order.coordinates]);

  const copyAddr = useCallback(() => {
    const txt = [order.address, order.city].filter(Boolean).join(" - ");
    if (!txt) return;
    navigator.clipboard?.writeText(txt).catch(()=>{});
  }, [order.address, order.city]);

  return (
    <section className="rounded-2xl border shadow-sm bg-white/90 overflow-hidden">
      <div className="p-4 md:p-5">
        {/* header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-gray-900 truncate">
                Pedido #{String(order.id).slice(-4)}
              </h3>
              <span className="text-[11px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                {shortCode(order.id)}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                {status === "ready" && <span className="mr-1"><Package size={12} /></span>}
                {status === "on_route" && <span className="mr-1"><Navigation size={12} /></span>}
                {status === "delivered" && <span className="mr-1"><CheckCircle2 size={12} /></span>}
                {cfg.label}
              </span>
            </div>

            <div className="mt-1 flex items-center gap-2 text-sm text-gray-800">
              <User size={14} />
              <span className="font-medium truncate">{order.name}</span>
              {order.phone ? (
                <>
                  <span className="text-gray-400">•</span>
                  <a className="hover:underline" href={telHref(order.phone)}>{order.phone}</a>
                  <a className="text-blue-700 hover:underline" target="_blank" rel="noreferrer" href={waHref(order.phone)}>
                    WhatsApp
                  </a>
                </>
              ) : <span className="text-gray-500">Sin teléfono</span>}
            </div>

            <p className="text-[11px] text-gray-500 mt-1">
              Creado: {new Date(order.createdAt).toLocaleString("es-CL")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onAssign && (
              <button
                onClick={() => onAssign(order.name, order.phone)}
                className="h-8 px-3 rounded-lg border bg-white hover:bg-gray-50 text-sm"
                title="Asignar repartidor"
              >
                Asignar repartidor
              </button>
            )}
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border bg-white">
              <CreditCard size={12} />
              {isPaid ? `Pagado (${order.paymentMethod})` : isDue ? `Por cobrar (${order.dueMethod || "—"})` : "Pago pendiente"}
            </span>
          </div>
        </div>

        {/* dirección */}
        <div className="mt-3 p-3 rounded-xl border bg-white">
          <div className="flex items-start gap-2">
            <MapPin size={16} className="text-gray-500 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate">{order.address || "Sin dirección"}</div>
              <div className="text-sm text-gray-600">{order.city || "—"}</div>
              {order.references && <div className="text-xs text-blue-700 mt-1"><b>Referencias:</b> {order.references}</div>}
              {order.geocodePrecision && order.geocodePrecision !== "exact" && (
                <div className="flex items-center gap-1 mt-2 text-xs text-amber-700">
                  <AlertCircle size={12} /> Ubicación aproximada ({order.geocodePrecision})
                </div>
              )}
            </div>
            <button onClick={copyAddr} className="h-8 px-2 text-xs rounded border bg-white hover:bg-gray-50 inline-flex items-center gap-1">
              <Copy size={12}/> Copiar
            </button>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-700 mt-2 pt-2 border-t">
            <span className="flex items-center gap-1">
              <Clock size={14} /> {hasRoute ? formatDur(order.routeMeta!.duration) : "—"}
            </span>
            <span>🛣️ {hasRoute ? formatKm(order.routeMeta!.distance) : "—"}</span>
          </div>
        </div>

        {/* items + total */}
        <div className="mt-3">
          <h4 className="font-semibold text-gray-800 text-sm mb-2">Pedido</h4>
          <ul className="text-sm text-gray-800 space-y-1">
            {order.cart.map((it, i) => {
              const qty = it.quantity ?? 1;
              const unit = it.discountPrice ?? it.originalPrice ?? 0;
              return (
                <li key={`${it.id}-${i}`} className="flex justify-between">
                  <span className="truncate">{qty}× {it.name}</span>
                  <span>${formatCLP(unit * qty)}</span>
                </li>
              );
            })}
          </ul>
          <div className="border-t pt-2 mt-2 flex items-center justify-between font-bold">
            <span>Total</span><span>${formatCLP(order.total)}</span>
          </div>
        </div>

        {/* empaque */}
        {packingInfo && status === "ready" && (
          <div className="mt-3">
            {packingInfo.packed ? (
              <div className="text-green-700 bg-green-50 border border-green-200 rounded-lg p-2 text-sm flex items-center gap-2">
                <CheckCircle2 size={14}/> Empacado y listo
              </div>
            ) : packingInfo.expired ? (
              <div className="text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2 text-sm flex items-center gap-2">
                <AlertCircle size={14}/> Tiempo de empaque vencido
              </div>
            ) : (
              <div className="bg-blue-50 p-2 rounded-lg">
                <div className="flex items-center justify-between text-sm text-blue-800 mb-1">
                  <span className="font-medium">Empacando…</span>
                  <span className="font-bold">{packingInfo.label}</span>
                </div>
                <div className="w-full h-2 bg-blue-200 rounded-full overflow-hidden">
                  <div className="h-2 bg-blue-600 transition-all" style={{ width: `${packingInfo.pct}%` }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* navegación */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h5 className="font-semibold text-gray-800 text-sm">Navegación</h5>
            <button
              onClick={()=>setShowMap(v=>!v)}
              className="text-sm text-blue-700 hover:text-blue-800 disabled:text-gray-400"
              disabled={!coordsOk}
            >
              {coordsOk ? (showMap ? "Ocultar mapa" : "Ver mapa") : "Sin coordenadas"}
            </button>
          </div>

          {status === "ready" && onStart && (
            <div className="mb-2">
              <button
                onClick={()=>onStart()}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Navigation size={16}/> Iniciar ruta
              </button>
            </div>
          )}

          {showMap && coordsOk && (
            <div className="mb-3 rounded-xl overflow-hidden">
              <Suspense fallback={<div className="h-[240px] bg-gray-100 animate-pulse rounded-xl" />}>
                <LazyLeafletMap
                  center={order.coordinates}
                  destination={order.coordinates}
                  zoom={16}
                  height="240px"
                  draggableMarker={false}
                  showRoute
                  className="rounded-xl"
                />
              </Suspense>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              onClick={onMaps}
              disabled={!coordsOk}
              className={`h-10 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${
                coordsOk ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-gray-300 text-gray-500"
              }`}
            >
              <Navigation size={16}/> Google Maps <ExternalLink size={12}/>
            </button>
            <button
              onClick={onWaze}
              disabled={!coordsOk}
              className={`h-10 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${
                coordsOk ? "bg-cyan-600 hover:bg-cyan-700 text-white" : "bg-gray-300 text-gray-500"
              }`}
            >
              <Navigation size={16}/> Waze <ExternalLink size={12}/>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <h6 className="text-xs font-medium text-gray-700 mb-1">QR Waze</h6>
              <img
                src={coordsOk ? getWazeQRUrl(order.coordinates.lat, order.coordinates.lng, 120) : undefined}
                alt="QR Waze"
                className="w-24 h-24 bg-white rounded border object-contain"
              />
            </div>
            <div>
              <h6 className="text-xs font-medium text-gray-700 mb-1">QR Seguimiento</h6>
              <img
                src={getTrackingQRUrl(shortCode(order.id), 120)}
                alt="QR tracking"
                className="w-24 h-24 bg-white rounded border object-contain"
              />
            </div>
          </div>
        </div>

        {/* acción principal */}
        {(status === "ready" || status === "on_route") && (
          <div className="mt-4">
            <button
              onClick={() => canMarkDelivered && onMarkAsDelivered?.(order.id)}
              disabled={!canMarkDelivered}
              className={`w-full h-11 rounded-xl font-semibold flex items-center justify-center gap-2 ${
                canMarkDelivered ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-gray-300 text-gray-600"
              }`}
            >
              <CheckCircle2 size={18}/>
              {canMarkDelivered ? "Marcar como entregado" : "Confirma o cobra el pago para entregar"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
});
DeliveryOrderCard.displayName = "DeliveryOrderCard";
