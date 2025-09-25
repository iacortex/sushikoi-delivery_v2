import React, { useMemo, useState } from "react";
import { Search, Phone, Hash, X } from "lucide-react";
import type { Order } from "@/types";
import { shortCode } from "@/lib/format";

type Props = {
  orders: Order[];
  onResult: (order: Order | null) => void;
};

export const OrderSearch: React.FC<Props> = ({ orders, onResult }) => {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");

  const normalizedPhone = phone.replace(/\D/g, "");

  const byPhone = useMemo(() => {
    if (!normalizedPhone) return [];
    return orders
      .filter(o => (o.phone || "").replace(/\D/g, "").includes(normalizedPhone))
      .slice(0, 8);
  }, [orders, normalizedPhone]);

  const byCode = useMemo(() => {
    if (!code.trim()) return [];
    const codeUp = code.trim().toUpperCase();
    return orders.filter(o => shortCode(o.id).toUpperCase() === codeUp);
  }, [orders, code]);

  const handlePick = (o: Order) => onResult(o);

  return (
    <div className="space-y-4">
      {/* Search by phone */}
      <div>
        <label className="text-sm text-gray-700 mb-1 block">Buscar por teléfono</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-9"
              placeholder="+56 9 1234 5678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            {!!phone && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setPhone("")}
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            className="btn-light"
            onClick={() => {
              const first = byPhone[0];
              onResult(first || null);
            }}
          >
            <Search size={16} /> Buscar
          </button>
        </div>

        {normalizedPhone && (
          <div className="mt-3">
            {byPhone.length === 0 ? (
              <div className="text-sm text-gray-500">No se encontraron pedidos con ese teléfono.</div>
            ) : (
              <ul className="space-y-1">
                {byPhone.map((o) => (
                  <li key={o.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                    <div className="text-sm text-gray-800 truncate">
                      {o.name} • #{String(o.id).slice(-4)} • {o.status.toUpperCase()}
                    </div>
                    <button className="text-rose-600 hover:text-rose-700 text-sm" onClick={() => handlePick(o)}>
                      Ver
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Search by short code */}
      <div>
        <label className="text-sm text-gray-700 mb-1 block">Buscar por código corto</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-9 uppercase"
              placeholder="ABCD"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={8}
            />
            {!!code && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setCode("")}
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            className="btn-primary"
            onClick={() => {
              const first = byCode[0];
              onResult(first || null);
            }}
          >
            <Search size={16} /> Buscar
          </button>
        </div>

        {code.trim() && (
          <div className="mt-3">
            {byCode.length === 0 ? (
              <div className="text-sm text-gray-500">Código no encontrado. Revisa mayúsculas/minúsculas.</div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                Pedido encontrado: #{String(byCode[0].id).slice(-4)} — <b>{byCode[0].name}</b>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
