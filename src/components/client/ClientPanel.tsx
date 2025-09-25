import React, { useEffect, useMemo, useState } from "react";
import { Monitor, UserSearch, QrCode, X, ArrowLeftRight, Info } from "lucide-react";
import { useOrders } from "@/features/orders/useOrders";
import type { Order } from "@/types";
import { OrderSearch } from "./OrderSearch";
import { OrderTracker } from "./OrderTracker";
import { TotemBoard } from "./TotemBoard";
import { shortCode } from "@/lib/format";

// Panel del cliente: buscar pedido, ver tracking y (opcional) tablero tipo tótem.
const ClientPanel: React.FC = () => {
  const { orders } = useOrders();
  const [tracked, setTracked] = useState<Order | null>(null);
  const [showTotem, setShowTotem] = useState<boolean>(false);

  // Soporta deep-link/hash: #order-ABCD
  useEffect(() => {
    const h = window.location.hash || "";
    const m = h.match(/#order\-([A-Za-z0-9]+)/);
    if (!m) return;
    const code = (m[1] || "").toUpperCase();
    // Busca por "shortCode" (últimos 4 chars base36 / helper shortCode)
    const found = orders.find((o) => shortCode(o.id).toUpperCase() === code);
    if (found) setTracked(found);
  }, [orders]);

  const activeOrders = useMemo(() => orders.filter(o => o.status !== "delivered"), [orders]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 text-white flex items-center justify-center text-xl">🙋</div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Panel de Cliente</h2>
              <p className="text-gray-600 text-sm">Rastrea tu pedido y compártelo por QR o link</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className={`px-3 py-2 rounded-lg border text-sm transition ${showTotem ? "bg-gray-900 text-white border-gray-900" : "bg-white hover:bg-gray-50"}`}
              title="Mostrar tablero tipo tótem"
              onClick={() => setShowTotem((v) => !v)}
            >
              <Monitor size={16} className="inline mr-2" />
              {showTotem ? "Ocultar Tótem" : "Ver Tótem"}
            </button>
          </div>
        </div>
      </div>

      {/* Barra informativa rápida */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 flex items-start gap-2">
        <Info size={16} className="mt-0.5" />
        <div>
          <b>Sugerencia:</b> puedes buscar por <b>teléfono</b> o por <b>código corto</b> (ej: ABCD). 
          Si ya tenías el link, el sistema arranca con el pedido seleccionado automáticamente.
        </div>
      </div>

      {/* Búsqueda + tracking */}
      {!tracked ? (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Buscar pedido */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <UserSearch size={18} className="text-gray-700" />
              <h3 className="font-semibold text-gray-800">Buscar pedido</h3>
            </div>
            <OrderSearch
              orders={orders}
              onResult={(o) => setTracked(o)}
            />
          </div>

          {/* Vista mini de pedidos activos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <QrCode size={18} className="text-gray-700" />
              <h3 className="font-semibold text-gray-800">Pedidos activos (hoy)</h3>
            </div>
            {activeOrders.length === 0 ? (
              <div className="text-sm text-gray-500">No hay pedidos activos por ahora.</div>
            ) : (
              <ul className="space-y-2">
                {activeOrders.slice(0, 6).map((o) => (
                  <li key={o.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">
                        {o.name} • #{String(o.id).slice(-4)}
                      </div>
                      <div className="text-xs text-gray-600">
                        {o.status.toUpperCase()} • {o.paymentStatus === "paid" ? "PAGADO" : "POR PAGAR"}
                      </div>
                    </div>
                    <button
                      className="text-rose-600 hover:text-rose-700 text-sm px-2 py-1 rounded-lg"
                      onClick={() => setTracked(o)}
                    >
                      Ver
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setTracked(null)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-gray-50"
            >
              <ArrowLeftRight size={16} />
              Cambiar pedido
            </button>
            <div className="text-sm text-gray-600">
              Código corto: <b className="font-mono">{shortCode(tracked.id)}</b>
            </div>
          </div>
          <OrderTracker order={tracked} onClear={() => setTracked(null)} />
        </div>
      )}

      {/* Tótem (opcional) */}
      {showTotem && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <TotemBoard orders={orders} />
        </div>
      )}
    </div>
  );
};

export default ClientPanel;
