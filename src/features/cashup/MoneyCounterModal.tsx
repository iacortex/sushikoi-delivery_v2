import React from "react";
import { Coins, Banknote, X, Minus, Plus } from "lucide-react";

export type CashCount = {
  total: number;
  breakdown: Array<{ denom: number; qty: number }>;
  ts: number;
  by?: string;
  notes?: string;
};

type Props = {
  open: boolean;
  title: string;
  subtitle?: string;
  by?: string;
  onClose: () => void;
  onConfirm: (data: CashCount) => void;
  initialNotes?: string;
};

const DENOMS = [
  20000, 10000, 5000, 2000, 1000, // billetes
  500, 100, 50, 10 // monedas
];

const CLP = (n: number) =>
  new Intl.NumberFormat("es-CL").format(Math.max(0, Math.round(n || 0)));

const MoneyCounterModal: React.FC<Props> = ({
  open,
  title,
  subtitle,
  by,
  onClose,
  onConfirm,
  initialNotes = "",
}) => {
  const [counts, setCounts] = React.useState<Record<number, number>>({});
  const [notes, setNotes] = React.useState<string>(initialNotes || "");

  React.useEffect(() => {
    if (!open) return;
    setCounts({});
    setNotes(initialNotes || "");
  }, [open, initialNotes]);

  if (!open) return null;

  const rows = DENOMS.map((d) => {
    const qty = counts[d] ?? 0;
    const subtotal = qty * d;
    return { denom: d, qty, subtotal };
  });

  const total = rows.reduce((acc, r) => acc + r.subtotal, 0);
  const anyQty = rows.some((r) => r.qty > 0);

  const setQty = (denom: number, v: number) =>
    setCounts((p) => ({ ...p, [denom]: Math.max(0, Math.floor(v || 0)) }));

  const inc = (denom: number) => setQty(denom, (counts[denom] ?? 0) + 1);
  const dec = (denom: number) => setQty(denom, (counts[denom] ?? 0) - 1);

  const confirm = () => {
    const breakdown = rows
      .filter((r) => r.qty > 0)
      .map((r) => ({ denom: r.denom, qty: r.qty }));
    onConfirm({
      total,
      breakdown,
      ts: Date.now(),
      by,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-[90] bg-black/40 flex items-center justify-center p-3">
      <div className="bg-white w-full max-w-3xl rounded-xl shadow-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div>
            <div className="font-semibold">{title}</div>
            {subtitle && (
              <div className="text-xs text-gray-500">{subtitle}</div>
            )}
          </div>
          <button
            className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50"
            onClick={onClose}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 grid md:grid-cols-5 gap-4">
          {/* Billetes */}
          <div className="md:col-span-3 border rounded-lg">
            <div className="px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-600">
              Billetes
            </div>
            <div className="divide-y">
              {[20000, 10000, 5000, 2000, 1000].map((d) => {
                const qty = counts[d] ?? 0;
                const sub = qty * d;
                return (
                  <div
                    key={d}
                    className="px-3 py-2 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2">
                      <Banknote size={16} className="text-emerald-600" />
                      <div className="text-sm font-medium">${CLP(d)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label={`Disminuir billete ${d}`}
                        onClick={() => dec(d)}
                        disabled={qty <= 0}
                        className="px-2 py-1 border rounded-md hover:bg-gray-50 disabled:opacity-40"
                      >
                        <Minus className="size-4" />
                      </button>
                      <div className="min-w-10 text-center font-medium select-none">
                        {qty}
                      </div>
                      <button
                        type="button"
                        aria-label={`Aumentar billete ${d}`}
                        onClick={() => inc(d)}
                        className="px-2 py-1 border rounded-md hover:bg-gray-50"
                      >
                        <Plus className="size-4" />
                      </button>
                      <div className="text-sm text-gray-700 w-28 text-right">
                        ${CLP(sub)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Monedas */}
          <div className="md:col-span-2 border rounded-lg">
            <div className="px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-600">
              Monedas
            </div>
            <div className="divide-y">
              {[500, 100, 50, 10].map((d) => {
                const qty = counts[d] ?? 0;
                const sub = qty * d;
                return (
                  <div
                    key={d}
                    className="px-3 py-2 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2">
                      <Coins size={16} className="text-amber-600" />
                      <div className="text-sm font-medium">${CLP(d)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label={`Disminuir moneda ${d}`}
                        onClick={() => dec(d)}
                        disabled={qty <= 0}
                        className="px-2 py-1 border rounded-md hover:bg-gray-50 disabled:opacity-40"
                      >
                        <Minus className="size-4" />
                      </button>
                      <div className="min-w-10 text-center font-medium select-none">
                        {qty}
                      </div>
                      <button
                        type="button"
                        aria-label={`Aumentar moneda ${d}`}
                        onClick={() => inc(d)}
                        className="px-2 py-1 border rounded-md hover:bg-gray-50"
                      >
                        <Plus className="size-4" />
                      </button>
                      <div className="text-sm text-gray-700 w-28 text-right">
                        ${CLP(sub)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notas y total */}
          <div className="md:col-span-5 grid md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <div className="text-sm text-gray-700 mb-1">Notas</div>
              <textarea
                className="w-full min-h-24 border rounded-md px-3 py-2 text-sm"
                placeholder="Observaciones de apertura/cierre (opcional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="border rounded-lg p-3">
              <div className="text-sm text-gray-700 mb-1">Total contado</div>
              <div className="text-2xl font-bold text-emerald-700">
                ${CLP(total)}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="md:col-span-5 flex justify-end gap-2 pt-2">
            <button
              className="px-3 py-1.5 text-sm rounded-md border hover:bg-gray-50"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              disabled={!anyQty}
              className={`px-3 py-1.5 text-sm rounded-md text-white ${
                anyQty ? "bg-emerald-600 hover:bg-emerald-700" : "bg-gray-300"
              }`}
              onClick={confirm}
              title="Confirmar conteo"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoneyCounterModal;
