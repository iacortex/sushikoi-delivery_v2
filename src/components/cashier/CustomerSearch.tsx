import React, { useMemo, useState } from "react";
import { Search, User, Phone, MapPin, Clock } from "lucide-react";

interface Customer {
  name: string;
  phone: string;
  street: string;
  number: string;
  sector?: string;
  city?: string;
  references?: string;
  totalOrders?: number;
  totalSpent?: number;
  lastOrderAt?: number;
  // si existen en tu store, se usarán para ordenar:
  createdAt?: number;
  updatedAt?: number;
}

interface CustomerSearchProps {
  customers: Customer[];
  onSelectCustomer: (customer: Customer) => void;
  /** Opcional: limita cantidad mostrada sin cortar por defecto */
  maxResults?: number;
}

/* ============ helpers ============ */
const toKey = (s?: string) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();

const justDigits = (s?: string) => (s || "").replace(/[^\d]/g, "");
const formatCLP = (n: number) => new Intl.NumberFormat("es-CL").format(n);
const scoreDate = (c: Customer) =>
  c.lastOrderAt ?? c.updatedAt ?? c.createdAt ?? 0;

const relTime = (ts?: number) => {
  if (!ts) return "Primer pedido";
  const diff = Date.now() - ts;
  const m = Math.round(diff / 60000);
  if (m < 60) return `Hace ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `Hace ${h} h`;
  const d = Math.round(h / 24);
  if (d < 30) return `Hace ${d} día${d !== 1 ? "s" : ""}`;
  const mo = Math.round(d / 30);
  return `Hace ${mo} mes${mo !== 1 ? "es" : ""}`;
};

/* ============ component ============ */
export const CustomerSearch: React.FC<CustomerSearchProps> = ({
  customers,
  onSelectCustomer,
  maxResults,
}) => {
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    const base = [...customers].sort((a, b) => scoreDate(b) - scoreDate(a));

    // sin query → devolver todo (o hasta maxResults si se pasó)
    if (!q.trim()) {
      return typeof maxResults === "number" ? base.slice(0, maxResults) : base;
    }

    const key = toKey(q);
    const phoneQuery = justDigits(q);

    const filtered = base.filter((c) => {
      const name = toKey(c.name);
      const addr = toKey(
        `${c.street} ${c.number} ${c.sector ?? ""} ${c.city ?? ""} ${c.references ?? ""}`
      );
      const phone = justDigits(c.phone);
      const matchNameAddr = name.includes(key) || addr.includes(key);
      const matchPhone = phoneQuery ? phone.includes(phoneQuery) : false;
      return matchNameAddr || matchPhone;
    });

    return typeof maxResults === "number"
      ? filtered.slice(0, maxResults)
      : filtered;
  }, [customers, q, maxResults]);

  const handleSelect = (c: Customer) => {
    onSelectCustomer(c);
    setQ("");
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
            <Search size={18} />
            Buscar Cliente Existente
          </h4>
          <span className="text-xs text-gray-500">
            {list.length} resultado{list.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Search Input */}
        <div className="flex items-center gap-2 border rounded-xl px-3 bg-white w-full shadow-sm">
          <Search size={16} className="text-gray-500" />
          <input
            className="h-10 flex-1 outline-none text-sm bg-transparent"
            placeholder="Nombre, teléfono (+569...), calle, sector, ciudad…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Buscar cliente"
          />
          {q && (
            <button
              className="text-xs text-gray-500 hover:text-gray-700"
              onClick={() => setQ("")}
            >
              limpiar
            </button>
          )}
        </div>

        {/* Results */}
        {list.length === 0 ? (
          <EmptyState hasQuery={!!q} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {list.map((customer, i) => (
              <CustomerCard
                key={`${customer.phone}-${i}`}
                customer={customer}
                onSelect={() => handleSelect(customer)}
              />
            ))}
          </div>
        )}

        {/* Tips */}
        {!q && customers.length > (maxResults ?? Infinity) && (
          <p className="text-xs text-gray-500">
            Mostrando {maxResults} de {customers.length}. Sube <code>maxResults</code> para ver más.
          </p>
        )}
      </div>
    </div>
  );
};

/* ============ subcomponents ============ */

const EmptyState: React.FC<{ hasQuery: boolean }> = ({ hasQuery }) => (
  <div className="text-center py-10 text-gray-500">
    {hasQuery ? (
      <>
        <Search size={40} className="mx-auto mb-2 text-gray-300" />
        <p>No se encontraron clientes</p>
        <p className="text-sm">Prueba con otro criterio</p>
      </>
    ) : (
      <>
        <User size={40} className="mx-auto mb-2 text-gray-300" />
        <p>Sin clientes registrados aún</p>
        <p className="text-sm">Aparecerán aquí luego del primer pedido</p>
      </>
    )}
  </div>
);

const CustomerCard: React.FC<{
  customer: Customer;
  onSelect: () => void;
}> = ({ customer, onSelect }) => (
  <button
    onClick={onSelect}
    className="text-left border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-rose-300 transition-all duration-200 group w-full"
    aria-label={`Usar cliente ${customer.name}`}
  >
    <div className="flex justify-between items-start">
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <User size={16} className="text-gray-500" />
          <h6 className="font-semibold text-gray-800 group-hover:text-rose-600 truncate">
            {customer.name}
          </h6>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Phone size={14} className="text-gray-400" />
          <span className="truncate">{customer.phone}</span>
        </div>

        <div className="mt-1 flex items-center gap-2 text-sm text-gray-700">
          <MapPin size={14} className="text-gray-400" />
          <span className="truncate">
            {[customer.street, customer.number].filter(Boolean).join(" ")}
            {customer.sector ? `, ${customer.sector}` : ""}{" "}
            {customer.city ? `— ${customer.city}` : ""}
          </span>
        </div>

        {(customer.totalOrders || customer.totalSpent || customer.lastOrderAt) && (
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
            {customer.totalOrders ? (
              <span>
                {customer.totalOrders} pedido{customer.totalOrders !== 1 ? "s" : ""}
              </span>
            ) : null}
            {typeof customer.totalSpent === "number" ? (
              <span>${formatCLP(customer.totalSpent)}</span>
            ) : null}
            {customer.lastOrderAt ? (
              <span className="inline-flex items-center gap-1">
                <Clock size={10} /> {relTime(customer.lastOrderAt)}
              </span>
            ) : null}
          </div>
        )}
      </div>

      <span className="ml-3 px-3 py-1.5 bg-rose-600 group-hover:bg-rose-700 text-white text-sm rounded-md transition-colors flex-shrink-0">
        Usar
      </span>
    </div>
  </button>
);

export default CustomerSearch;
