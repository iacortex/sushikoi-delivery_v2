import React, { useMemo, useState } from "react";
import { Search, RefreshCw, Truck, Route, CheckCircle2, Filter } from "lucide-react";
import type { Order } from "@/types";
import { useOrders } from "@/features/orders/useOrders";
import { DeliveryOrderCard } from "./DeliveryOrderCard";
import { normalizeStatus } from "@/features/orders/helpers";

/* ======================= helpers ======================= */

const isToday = (ts?: number | null) => {
  if (!ts) return false;
  const a = new Date(ts), b = new Date();
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
};

const looksLikeDelivery = (s?: string | null) => {
  const k = String(s ?? "").toLowerCase();
  return k.includes("delivery") || k.includes("envio") || k.includes("entrega") || k.includes("repart");
};

/* ======================= UI bits ======================= */

const Pill: React.FC<{ children: React.ReactNode; tone?: "gray" | "green" | "blue" | "amber" }>=({children,tone="gray"})=>(
  <span className={
    "inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full " +
    (tone==="green" ? "bg-emerald-100 text-emerald-700" :
     tone==="blue"  ? "bg-blue-100 text-blue-700" :
     tone==="amber" ? "bg-amber-100 text-amber-800" :
                      "bg-gray-100 text-gray-700")
  }>{children}</span>
);

/* ======================= component ======================= */

const DeliveryPanel: React.FC = () => {
  const { orders, assignDriver, startRoute, markDelivered } = useOrders();

  const [tab, setTab] = useState<"ready"|"on_route"|"delivered_today">("ready");
  const [query, setQuery] = useState("");
  const [onlyDelivery, setOnlyDelivery] = useState(false); // ← filtro opcional

  // 1) dataset base: incluimos TODO y luego filtramos por tab
  const base: Order[] = useMemo(() => {
    const list = orders ?? [];
    if (!onlyDelivery) return list;
    // si activan el filtro, dejamos solo los que parecen delivery
    return list.filter(o => looksLikeDelivery((o as any).service));
  }, [orders, onlyDelivery]);

  // 2) búsqueda simple
  const bySearch = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter(o =>
      String(o.publicCode ?? o.id).toLowerCase().includes(q) ||
      (o.name ?? "").toLowerCase().includes(q) ||
      (o.address ?? "").toLowerCase().includes(q) ||
      (o.driver?.name ?? "").toLowerCase().includes(q)
    );
  }, [base, query]);

  // 3) buckets por estado NORMALIZADO
  const ready = useMemo(
    () => bySearch.filter(o => normalizeStatus(o.status) === "ready"),
    [bySearch]
  );
  const onRoute = useMemo(
    () => bySearch.filter(o => normalizeStatus(o.status) === "on_route"),
    [bySearch]
  );
  const deliveredToday = useMemo(
    () => base.filter(o => normalizeStatus(o.status)==="delivered" && isToday((o as any).deliveredAt)),
    [base]
  );

  // 4) métricas
  const deliveredCount = deliveredToday.length;
  const headerCount =
    tab === "ready" ? ready.length :
    tab === "on_route" ? onRoute.length :
    deliveredCount;

  return (
    <div className="p-4 md:p-6">
      {/* Sticky subheader */}
      <div className="sticky top-0 z-10 bg-gradient-to-b from-white/90 to-transparent backdrop-blur supports-[backdrop-filter]:backdrop-blur-md pb-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2">
            <Truck className="text-pink-600" size={22} /> Panel de Delivery
          </h2>
          <button
            onClick={() => window.location.reload()}
            className="h-9 px-3 rounded-lg border bg-white hover:bg-gray-50 flex items-center gap-2 text-sm"
          >
            <RefreshCw size={16} /> Actualizar
          </button>
        </div>

        {/* search + filters */}
        {tab !== "delivered_today" && (
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <div className="flex items-center gap-2 border rounded-xl px-3 bg-white/90 w-full md:max-w-xl shadow-sm">
              <Search size={16} className="text-gray-500" />
              <input
                className="h-10 flex-1 outline-none text-sm bg-transparent"
                placeholder="Buscar por código, cliente, dirección o repartidor…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button onClick={()=>setQuery("")} className="text-xs text-gray-500 hover:text-gray-700">limpiar</button>
              )}
            </div>

            <button
              onClick={() => setOnlyDelivery(v=>!v)}
              className={"inline-flex items-center gap-2 h-10 px-3 rounded-lg text-sm border shadow-sm " +
                (onlyDelivery ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-white hover:bg-gray-50")}
              title="Mostrar solo pedidos con servicio 'delivery'"
            >
              <Filter size={14} />
              {onlyDelivery ? "Solo delivery" : "Todos los servicios"}
            </button>
          </div>
        )}

        {/* tabs */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={()=>setTab("ready")}
            className={`h-9 px-3 rounded-lg text-sm font-medium inline-flex items-center gap-2 ${
              tab==="ready" ? "bg-red-600 text-white" : "bg-white border hover:bg-gray-50"
            }`}
          >
            <span className="inline-block w-2 h-2 rounded-full bg-yellow-400" />
            Listos ({ready.length})
          </button>
          <button
            onClick={()=>setTab("on_route")}
            className={`h-9 px-3 rounded-lg text-sm font-medium inline-flex items-center gap-2 ${
              tab==="on_route" ? "bg-blue-600 text-white" : "bg-white border hover:bg-gray-50"
            }`}
          >
            <Route size={16} />
            En ruta ({onRoute.length})
          </button>
          <button
            onClick={()=>setTab("delivered_today")}
            className={`h-9 px-3 rounded-lg text-sm font-medium inline-flex items-center gap-2 ${
              tab==="delivered_today" ? "bg-emerald-600 text-white" : "bg-white border hover:bg-gray-50"
            }`}
          >
            <CheckCircle2 size={16} />
            Entregados hoy ({deliveredCount})
          </button>

          <div className="ml-auto">
            <Pill tone={tab==="ready" ? "amber" : tab==="on_route" ? "blue" : "green"}>
              {tab==="ready" ? "Listos" : tab==="on_route" ? "En ruta" : "Resumen de hoy"} • {headerCount}
            </Pill>
          </div>
        </div>
      </div>

      {/* contenido */}
      <div className="mt-4 space-y-3">
        {tab === "ready" && (
          ready.length === 0 ? (
            <EmptyState
              title="No hay pedidos listos."
              subtitle="Cuando Cocina marque un pedido como listo, aparecerá aquí."
              hint="¿Cocina está usando 'ready', 'listo' o 'ready_for_pickup'? Todo eso lo normalizamos."
            />
          ) : (
            <div className="grid gap-3">
              {ready.map(o => (
                <DeliveryOrderCard
                  key={o.id}
                  order={o}
                  onAssign={(name, phone)=>assignDriver(o.id, name, phone)}
                  onStart={()=>startRoute(o.id)}
                  onMarkAsDelivered={()=>markDelivered(o.id)}
                />
              ))}
            </div>
          )
        )}

        {tab === "on_route" && (
          onRoute.length === 0 ? (
            <EmptyState
              title="No hay pedidos en ruta."
              subtitle="Inicia la ruta desde un pedido listo para moverlo aquí."
              hint="También puedes navegar con Google Maps o Waze desde la tarjeta."
            />
          ) : (
            <div className="grid gap-3">
              {onRoute.map(o => (
                <DeliveryOrderCard
                  key={o.id}
                  order={o}
                  onAssign={(name, phone)=>assignDriver(o.id, name, phone)}
                  onMarkAsDelivered={()=>markDelivered(o.id)}
                />
              ))}
            </div>
          )
        )}

        {tab === "delivered_today" && (
          deliveredCount === 0 ? (
            <EmptyState
              title="Aún no hay entregas hoy."
              subtitle="Cuando marques un pedido como entregado, se listará aquí."
              hint="Puedes ver tiempo y km por entrega si registras la ruta."
            />
          ) : (
            <DeliveredList orders={deliveredToday} />
          )
        )}
      </div>
    </div>
  );
};

export default DeliveryPanel;

/* ======================= subcomponents ======================= */

const EmptyState: React.FC<{title:string; subtitle?:string; hint?:string}> = ({title, subtitle, hint}) => (
  <div className="border border-dashed rounded-2xl p-6 text-center bg-white/70">
    <div className="text-lg font-semibold text-gray-800">{title}</div>
    {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
    {hint && <p className="text-xs text-gray-500 mt-2">{hint}</p>}
  </div>
);

const DeliveredList: React.FC<{orders: Order[]}> = ({ orders }) => (
  <div className="border rounded-2xl bg-white/80 overflow-hidden">
    <div className="px-4 py-3 border-b text-sm font-semibold">Entregas de hoy</div>
    <div className="divide-y">
      {orders.map(o=>{
        const deliveredAt = (o as any).deliveredAt as number | undefined;
        const pickupAt = (o as any).pickupAt as number | undefined;
        const time = deliveredAt && pickupAt && deliveredAt>=pickupAt ? deliveredAt - pickupAt : 0;
        const km = (o as any).routeMeta?.distance ? (o as any).routeMeta.distance/1000 : 0;
        return (
          <div key={o.id} className="px-4 py-3 grid grid-cols-1 md:grid-cols-5 gap-1 text-sm">
            <div className="font-medium">#{String(o.publicCode ?? o.id)}</div>
            <div className="text-gray-700">{o.name} · {o.phone ?? "—"}</div>
            <div className="text-gray-600">{o.address ?? "—"}</div>
            <div className="text-gray-600">{km ? `${km.toFixed(1)} km` : "—"}</div>
            <div className="text-gray-600">{time ? `${Math.round(time/60000)} min` : "—"}</div>
          </div>
        );
      })}
    </div>
  </div>
);
