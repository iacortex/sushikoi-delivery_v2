import React, { useCallback, useMemo, useState, Suspense } from "react";
import {
  Navigation,
  CheckCircle,
  CreditCard,
  MapPin,
  Phone,
  User,
  AlertCircle,
  Clock,
  Package,
  ExternalLink,
  Copy,
} from "lucide-react";
import type { Order } from "@/types";
import {
  formatCLP,
  formatKm,
  formatDur,
  shortCode,
  formatTimeRemaining,
} from "@/lib/format";
import {
  gmapsDir,
  wazeUrl,
  getWazeQRUrl,
  getTrackingQRUrl,
} from "@/lib/urls";
import { ORDER_STATUS_CONFIG } from "@/lib/constants";

// Lazy map (evita cargar Leaflet si no se usa)
const LazyLeafletMap = React.lazy(async () => {
  const mod = await import("@/features/map/LeafletMap");
  return { default: mod.LeafletMap };
});

type PaymentState = "paid" | "due" | "pending" | "refunded" | string;

export interface DeliveryOrderCardProps {
  order: Order;

  /** Callbacks principales */
  onMarkAsDelivered?: (orderId: number) => void | Promise<void>;
  onConfirmPayment?: (orderId: number) => void | Promise<void>;

  /** Compatibilidad con DeliveryPanel: asignar repartidor e iniciar ruta */
  onAssign?: (name: string, phone?: string) => void | Promise<void>;
  onStart?: () => void | Promise<void>;

  /** Alternativa legacy a onMarkAsDelivered */
  onDelivered?: () => void | Promise<void>;
}

function safeOpen(url?: string) {
  if (!url) return;
  try {
    window.open(url, "_blank", "noopener,noreferrer");
  } catch {}
}
function telHref(phone?: string) {
  return phone ? `tel:${phone.replace(/\s+/g, "")}` : undefined;
}
function waHref(phone?: string, text?: string) {
  if (!phone) return undefined;
  const clean = phone.replace(/[^\d]/g, "");
  const msg = encodeURIComponent(text || "Hola, voy en camino con tu pedido 🛵");
  return `https://wa.me/${clean}?text=${msg}`;
}

export const DeliveryOrderCard: React.FC<DeliveryOrderCardProps> = React.memo(
  ({ order, onMarkAsDelivered, onConfirmPayment, onAssign, onStart, onDelivered }) => {
    const [showMap, setShowMap] = useState(false);

    /* =========================
       Payment / estado
       ========================= */
    const isPaid = order.paymentStatus === "paid";
    const paymentState = (order.paymentStatus ?? "pending") as PaymentState;
    const paymentMethod = isPaid ? order.paymentMethod : order.dueMethod;

    const statusCfg =
      ORDER_STATUS_CONFIG[order.status] ??
      ({ label: order.status, color: "bg-gray-100 text-gray-700" } as const);

    /* =========================
       Coordenadas / Ruta
       ========================= */
    const coordsOk =
      !!order.coordinates &&
      Number.isFinite(order.coordinates.lat) &&
      Number.isFinite(order.coordinates.lng);

    const hasRoute =
      !!order.routeMeta &&
      Number.isFinite(order.routeMeta.distance) &&
      Number.isFinite(order.routeMeta.duration);

    const canDeliver =
      order.status === "ready" && (isPaid || paymentState !== "due");

    /* =========================
       Empaque (countdown)
       ========================= */
    const packingInfo = useMemo(() => {
      if (order.status !== "ready" || !order.packUntil) return null;
      const now = Date.now();
      const timeLeft = Math.max(0, order.packUntil - now);
      const expired = timeLeft <= 0;
      return {
        timeLeft,
        expired,
        packed: !!order.packed,
        formattedTime: formatTimeRemaining(timeLeft),
        progressPct: Math.max(0, Math.min(100, (timeLeft / 90_000) * 100)),
      };
    }, [order.packUntil, order.packed, order.status]);

    const deliveredAt: number | undefined = (order as any)?.deliveredAt;

    /* =========================
       Handlers
       ========================= */
    const handleMarkAsDelivered = useCallback(async () => {
      if (!canDeliver) return;
      if (onMarkAsDelivered) await onMarkAsDelivered(order.id);
      else if (onDelivered) await onDelivered();
    }, [canDeliver, onMarkAsDelivered, onDelivered, order.id]);

    const handleConfirmPayment = useCallback(async () => {
      if (onConfirmPayment) await onConfirmPayment(order.id);
    }, [onConfirmPayment, order.id]);

    const handleOpenGoogleMaps = useCallback(() => {
      if (!coordsOk) return;
      safeOpen(gmapsDir(order.coordinates.lat, order.coordinates.lng));
    }, [coordsOk, order.coordinates]);

    const handleOpenWaze = useCallback(() => {
      if (!coordsOk) return;
      safeOpen(wazeUrl(order.coordinates.lat, order.coordinates.lng));
    }, [coordsOk, order.coordinates]);

    const handleCopyAddress = useCallback(async () => {
      try {
        await navigator.clipboard.writeText(
          [order.address, order.city].filter(Boolean).join(" - ")
        );
      } catch {}
    }, [order.address, order.city]);

    /* =========================
       Estilos card
       ========================= */
    const cardClasses = useMemo(() => {
      let c = "card transition-all duration-200 border rounded-xl overflow-hidden";
      if (order.status === "delivered") c += " border-blue-300 bg-blue-50";
      else if (!isPaid && paymentState === "due") c += " border-red-300 bg-red-50";
      else if (packingInfo?.expired && !packingInfo.packed) c += " border-amber-300 bg-amber-50";
      else c += " border-emerald-300 bg-emerald-50 hover:shadow-lg";
      return c;
    }, [order.status, isPaid, paymentState, packingInfo?.expired, packingInfo?.packed]);

    /* =========================
       Render
       ========================= */
    return (
      <section className={cardClasses} aria-live="polite">
        <div className="card-body p-4 md:p-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-gray-800 truncate">
                  Pedido #{order.id.toString().slice(-4)}
                </h3>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  {shortCode(order.id)}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-700 mb-1">
                <User size={14} aria-hidden />
                <span className="font-medium truncate">{order.name}</span>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Phone size={12} aria-hidden />
                {order.phone ? (
                  <a className="hover:underline" href={telHref(order.phone)} aria-label="Llamar al cliente">
                    {order.phone}
                  </a>
                ) : (
                  <span>Sin teléfono</span>
                )}
                {order.phone && (
                  <>
                    <span className="text-gray-400">•</span>
                    <a
                      className="hover:underline"
                      href={waHref(order.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Abrir WhatsApp"
                    >
                      WhatsApp
                    </a>
                  </>
                )}
              </div>

              <p className="text-[11px] text-gray-500 mt-1">
                Creado: {new Date(order.createdAt).toLocaleString("es-CL")}
              </p>
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className={`status-pill px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusCfg.color}`}>
                {order.status === "ready" && <Package size={14} aria-hidden />}
                {order.status === "delivered" && <CheckCircle size={14} aria-hidden />}
                <span>{statusCfg.label}</span>
              </div>

              {/* Método de pago (usa paymentMethod) */}
              <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md border bg-white text-xs text-gray-700">
                <CreditCard size={12} />
                <span className="capitalize">
                  {isPaid ? `Pagado: ${paymentMethod}` : `Por pagar: ${paymentMethod || "—"}`}
                </span>
              </div>

              {/* Asignar repartidor (si viene el callback) */}
              {onAssign && (
                <button
                  onClick={() => onAssign(order.name, order.phone)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md border bg-white text-xs hover:bg-gray-50"
                  aria-label="Asignar repartidor"
                  title="Asignar repartidor"
                >
                  <User size={12} />
                  Asignar repartidor
                </button>
              )}

              {!isPaid && paymentState === "due" && onConfirmPayment && (
                <button
                  onClick={handleConfirmPayment}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                  aria-label="Confirmar pago"
                >
                  <CreditCard size={12} aria-hidden />
                  Confirmar pago
                </button>
              )}
            </div>
          </div>

          {/* Dirección */}
          <div className="mb-4 p-3 bg-white rounded-lg border">
            <div className="flex items-start gap-2 mb-2">
              <MapPin size={16} className="text-gray-500 mt-0.5" aria-hidden />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate" title={order.address || undefined}>
                  {order.address || "Sin dirección"}
                </p>
                <p className="text-sm text-gray-600">{order.city || "—"}</p>

                {order.references && (
                  <p className="text-sm text-blue-700 mt-1">
                    <strong>Referencias:</strong> {order.references}
                  </p>
                )}

                {order.geocodePrecision && order.geocodePrecision !== "exact" && (
                  <div className="flex items-center gap-1 mt-2">
                    <AlertCircle size={12} className="text-amber-600" aria-hidden />
                    <span className="text-xs text-amber-700">
                      Ubicación aproximada ({order.geocodePrecision})
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={handleCopyAddress}
                className="ml-2 inline-flex items-center gap-1 text-xs px-2 py-1 rounded border bg-white hover:bg-gray-50"
                aria-label="Copiar dirección"
                title="Copiar dirección"
              >
                <Copy size={12} />
                Copiar
              </button>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-700 pt-2 border-t">
              <span className="flex items-center gap-1">
                <Clock size={14} aria-hidden />
                {hasRoute ? formatDur(order.routeMeta!.duration) : "—"}
              </span>
              <span className="flex items-center gap-1">
                🛣️ {hasRoute ? formatKm(order.routeMeta!.distance) : "—"}
              </span>
            </div>

            {!hasRoute && coordsOk && (
              <p className="text-xs text-amber-700 mt-2">
                Sin datos de ruta; usa Google Maps o Waze para navegar.
              </p>
            )}
          </div>

          {/* Items */}
          <div className="mb-4">
            <h4 className="font-semibold text-gray-700 mb-2 text-sm">Pedido</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              {order.cart.map((item, idx) => {
                const qty = item.quantity ?? 1;
                const unit = item.discountPrice ?? item.originalPrice ?? 0;
                const line = unit * qty;
                return (
                  <li key={`${item.id}-${idx}`} className="flex justify-between">
                    <span className="truncate">
                      {qty}× {item.name}
                    </span>
                    <span>${formatCLP(line)}</span>
                  </li>
                );
              })}
            </ul>

            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between font-bold text-gray-900">
                <span>Total</span>
                <span>${formatCLP(order.total)}</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                {isPaid ? `Pagado (${paymentMethod})` : `Por pagar (${paymentMethod || "—"})`}
              </p>
            </div>
          </div>

          {/* Empaque */}
          {packingInfo && order.status === "ready" && (
            <div className="mb-4">
              {packingInfo.packed ? (
                <div className="flex items-center gap-2 text-green-700 text-sm bg-green-50 p-2 rounded">
                  <CheckCircle size={14} aria-hidden />
                  <span className="font-medium">Empacado y listo para entregar</span>
                </div>
              ) : packingInfo.expired ? (
                <div className="flex items-center gap-2 text-amber-800 text-sm bg-amber-50 p-2 rounded">
                  <AlertCircle size={14} aria-hidden />
                  <span className="font-medium">Tiempo de empaque vencido</span>
                </div>
              ) : (
                <div className="bg-blue-50 p-2 rounded">
                  <div className="flex items-center justify-between text-sm text-blue-800 mb-1">
                    <span className="font-medium">Empacando…</span>
                    <span className="font-bold">{packingInfo.formattedTime}</span>
                  </div>
                  <div className="w-full h-2 bg-blue-200 rounded-full overflow-hidden" aria-label="Progreso de empaque">
                    <div
                      className="h-2 bg-blue-600 transition-all duration-700"
                      style={{ width: `${packingInfo.progressPct}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mapa / Navegación */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-semibold text-gray-700 text-sm">Ubicación y navegación</h5>

              <button
                onClick={() => setShowMap((v) => !v)}
                className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400"
                disabled={!coordsOk}
                aria-expanded={showMap}
                aria-controls={`map-${order.id}`}
              >
                {coordsOk ? (showMap ? "Ocultar mapa" : "Ver mapa") : "Sin coordenadas"}
              </button>
            </div>

            {/* Iniciar ruta (si el panel provee callback) */}
            {onStart && order.status === "ready" && (
              <div className="mb-2">
                <button
                  onClick={() => onStart()}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Navigation size={14} />
                  Iniciar ruta
                </button>
              </div>
            )}

            {showMap && coordsOk && (
              <div className="mb-3 rounded-lg overflow-hidden" id={`map-${order.id}`}>
                <Suspense fallback={<div className="h-[250px] bg-gray-100 animate-pulse rounded-lg" />}>
                  <LazyLeafletMap
                    center={order.coordinates}
                    destination={order.coordinates}
                    zoom={16}
                    height="250px"
                    draggableMarker={false}
                    showRoute
                    className="rounded-lg"
                  />
                </Suspense>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                onClick={handleOpenGoogleMaps}
                disabled={!coordsOk}
                className={`flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
                  coordsOk ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
                aria-label="Abrir Google Maps"
              >
                <Navigation size={14} aria-hidden />
                Google Maps
                <ExternalLink size={12} aria-hidden />
              </button>

              <button
                onClick={handleOpenWaze}
                disabled={!coordsOk}
                className={`flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
                  coordsOk ? "bg-cyan-600 hover:bg-cyan-700 text-white" : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
                aria-label="Abrir Waze"
              >
                <Navigation size={14} aria-hidden />
                Waze
                <ExternalLink size={12} aria-hidden />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="qr-container">
                <h6 className="text-xs font-medium text-gray-700 mb-2">QR Navegación Waze</h6>
                <img
                  src={coordsOk ? getWazeQRUrl(order.coordinates.lat, order.coordinates.lng, 120) : undefined}
                  alt="QR para abrir Waze con el destino"
                  className="qr-image w-24 h-24 bg-white rounded border object-contain"
                />
                <p className="text-xs text-gray-500">Escanear para navegar</p>
              </div>

              <div className="qr-container">
                <h6 className="text-xs font-medium text-gray-700 mb-2">QR Seguimiento</h6>
                <img
                  src={getTrackingQRUrl(shortCode(order.id), 120)}
                  alt="QR para seguimiento del pedido"
                  className="qr-image w-24 h-24 bg-white rounded border object-contain"
                />
                <p className="text-xs text-gray-500">Compartir con cliente</p>
              </div>
            </div>
          </div>

          {/* Acciones */}
          {order.status === "ready" && (
            <div className="space-y-2">
              <button
                onClick={handleMarkAsDelivered}
                disabled={!canDeliver}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  canDeliver ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
                aria-disabled={!canDeliver}
              >
                <CheckCircle size={16} aria-hidden />
                {canDeliver ? "Marcar como entregado" : "Confirma el pago primero"}
              </button>
            </div>
          )}

          {order.status === "delivered" && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-2 text-blue-700 mb-1">
                <CheckCircle size={16} aria-hidden />
                <span className="font-medium">Pedido entregado</span>
              </div>
              <p className="text-xs text-blue-700">
                {deliveredAt ? (
                  <>Entregado: {new Date(deliveredAt).toLocaleString("es-CL")}</>
                ) : (
                  <>Entregado</>
                )}
              </p>
            </div>
          )}
        </div>
      </section>
    );
  }
);

DeliveryOrderCard.displayName = "DeliveryOrderCard";
