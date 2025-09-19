// src/components/delivery/DeliveryPanel.tsx
import React, { useMemo, useState } from "react";
import { useOrders } from "@/features/orders/useOrders";
import { DeliveryOrderCard } from "./DeliveryOrderCard";
import { Search, RefreshCw } from "lucide-react";
import { TabNavigation } from "@/components/layout/TabNavigation"; // ⬅️ export nombrado
import type { Order } from "@/types";

/* ================= Utils ================= */
const isToday = (ts?: number | null) => {
  if (!ts) return false;
  const d = new Date(ts);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
};

const fmtMin = (ms: number) => {
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return `${h} h ${r} min`;
};

const CardStat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-xl border bg-white/70 p-3">
    <div className="text-xs text-gray-600">{label}</div>
    <div className="text-lg font-semibold text-gray-900">{value}</div>
  </div>
);

/* ========================================= */

const DeliveryPanel: React.FC = () => {
  const { orders, assignDriver, startRoute, markDelivered } = useOrders();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"ready" | "on_route" | "delivered_today">("ready");

  // Colecciones base
  const deliveryOrders: Order[] = useMemo(
    () => orders.filter((o: Order) => o.service === "delivery"),
    [orders]
  );

  // Filtro por búsqueda (solo aplica a ready/on_route)
  const searchable = useMemo(
    () => deliveryOrders.filter((o: Order) => o.status === "ready" || o.status === "on_route"),
    [deliveryOrders]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return searchable;
    return searchable.filter((o: Order) =>
      (o.publicCode || "").toLowerCase().includes(q) ||
      (o.name || "").toLowerCase().includes(q) ||
      (o.address || "").toLowerCase().includes(q) ||
      (o.driver?.name || "").toLowerCase().includes(q)
    );
  }, [query, searchable]);

  const ready: Order[] = filtered.filter((o: Order) => o.status === "ready");
  const onRoute: Order[] = filtered.filter((o: Order) => o.status === "on_route");

  // Entregados hoy (para métricas)
  const deliveredToday: Order[] = useMemo(
    () => deliveryOrders.filter((o: Order) => o.status === "delivered" && isToday((o as any).deliveredAt)),
    [deliveryOrders]
  );

  const metrics = useMemo(() => {
    if (deliveredToday.length === 0) {
      return { count: 0, avgRouteTimeMs: 0, totalKm: 0, avgKm: 0 };
    }
    let sumTime = 0;
    let sumKm = 0;
    let countWithTime = 0;
    let countWithKm = 0;

    for (const o of deliveredToday) {
      const pickupAt = (o as any).pickupAt as number | undefined;
      const deliveredAt = (o as any).deliveredAt as number | undefined;
      if (pickupAt && deliveredAt && deliveredAt >= pickupAt) {
        sumTime += deliveredAt - pickupAt;
        countWithTime++;
      }
      const d = (o.routeMeta as any)?.distance as number | undefined;
      if (typeof d === "number" && d >= 0) {
        sumKm += d;
        countWithKm++;
      }
    }

    const avgRouteTimeMs = countWithTime ? sumTime / countWithTime : 0;
    const totalKm = sumKm / 1000;
    const avgKm = countWithKm ? (sumKm / countWithKm) / 1000 : 0;

    return { count: deliveredToday.length, avgRouteTimeMs, totalKm, avgKm };
  }, [deliveredToday]);

  return (
    <div className="p-3 md:p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Panel Delivery</h2>
        <button
          className="h-9 px-3 rounded-lg border bg-white hover:bg-gray-50 flex items-center gap-2"
          onClick={() => window.location.reload()}
        >
          <RefreshCw size={16} /> Actualizar
        </button>
      </div>

      {/* Buscador (oculto en métricas) */}
      {tab !== "delivered_today" && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 border rounded-lg px-2 bg-white/70 w-full max-w-xl">
            <Search size={16} className="text-gray-500" />
            <input
              className="h-10 flex-1 outline-none text-sm"
              placeholder="Buscar por código, cliente, dirección o repartidor…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
      )}

      <TabNavigation
        activeTab={tab}
        onTabChange={(t: string) => setTab(t as any)}
        tabs={[
          { key: "ready", label: `Listos (${ready.length})`, icon: () => <span>🟡</span> },
          { key: "on_route", label: `En ruta (${onRoute.length})`, icon: () => <span>🔵</span> },
          { key: "delivered_today", label: `Entregados hoy (${metrics.count})`, icon: () => <span>✅</span> },
        ]}
      />

      {tab === "ready" && (
        <section className="space-y-2">
          {ready.length === 0 ? (
            <div className="text-sm text-gray-500 border rounded-lg p-3 bg-white/60">
              No hay pedidos listos.
            </div>
          ) : (
            ready.map((o: Order) => (
              <DeliveryOrderCard
                key={o.id}
                order={o}
                onAssign={(name: string, phone?: string) => assignDriver(o.id, name, phone)}
                onStart={() => startRoute(o.id)}
                onDelivered={() => {}}
              />
            ))
          )}
        </section>
      )}

      {tab === "on_route" && (
        <section className="space-y-2">
          {onRoute.length === 0 ? (
            <div className="text-sm text-gray-500 border rounded-lg p-3 bg-white/60">
              No hay pedidos en ruta.
            </div>
          ) : (
            onRoute.map((o: Order) => (
              <DeliveryOrderCard
                key={o.id}
                order={o}
                onAssign={(name: string, phone?: string) => assignDriver(o.id, name, phone)}
                onStart={() => {}}
                onDelivered={() => markDelivered(o.id)}
              />
            ))
          )}
        </section>
      )}

      {tab === "delivered_today" && (
        <section className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <CardStat label="Entregas hoy" value={`${metrics.count}`} />
            <CardStat
              label="Tiempo promedio en ruta"
              value={metrics.count ? fmtMin(metrics.avgRouteTimeMs) : "—"}
            />
            <CardStat
              label="Km promedio por entrega"
              value={metrics.count ? `${metrics.avgKm.toFixed(1)} km` : "—"}
            />
            <CardStat
              label="Km totales hoy"
              value={metrics.count ? `${metrics.totalKm.toFixed(1)} km` : "—"}
            />
          </div>

          {metrics.count > 0 ? (
            <div className="border rounded-xl bg-white/70">
              <div className="px-3 py-2 text-sm font-semibold border-b">
                Entregas de hoy
              </div>
              <div className="divide-y">
                {deliveredToday.map((o: Order) => {
                  const pickupAt = (o as any).pickupAt as number | undefined;
                  const deliveredAt = (o as any).deliveredAt as number | undefined;
                  const timeMs = pickupAt && deliveredAt && deliveredAt >= pickupAt ? deliveredAt - pickupAt : 0;
                  const km = (o.routeMeta as any)?.distance ? (o.routeMeta as any).distance / 1000 : 0;
                  return (
                    <div key={o.id} className="px-3 py-2 text-sm grid grid-cols-1 md:grid-cols-5 gap-1">
                      <div className="font-medium">#{o.publicCode} • {o.name}</div>
                      <div className="text-gray-600">{o.address || "—"}</div>
                      <div className="text-gray-600">{o.driver?.name ? `Repartidor: ${o.driver.name}` : "Repartidor: —"}</div>
                      <div className="text-gray-600">Ruta: {km ? `${km.toFixed(1)} km` : "—"}</div>
                      <div className="text-gray-600">Tiempo: {timeMs ? fmtMin(timeMs) : "—"}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500 border rounded-lg p-3 bg-white/60">
              Aún no hay entregas hoy.
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default DeliveryPanel;
