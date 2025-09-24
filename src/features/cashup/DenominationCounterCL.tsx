import { useEffect, useMemo, useState } from "react";
import type { CLPDenoms } from "./cashupContext";

const ROWS: Array<{ label: string; key: keyof CLPDenoms }> = [
  { label: "$20.000", key: 20000 },
  { label: "$10.000", key: 10000 },
  { label: "$5.000",  key: 5000  },
  { label: "$2.000",  key: 2000  },
  { label: "$1.000",  key: 1000  },
  { label: "$500",    key: 500   },
  { label: "$100",    key: 100   },
  { label: "$50",     key: 50    },
  { label: "$10",     key: 10    },
];

function fmt(n: number) { return new Intl.NumberFormat("es-CL").format(n); }

export default function DenominationCounterCL({
  value,
  onChange,
  disabled,
}: {
  value?: Partial<CLPDenoms>;
  onChange?: (d: Partial<CLPDenoms>) => void;
  disabled?: boolean;
}) {
  const [local, setLocal] = useState<Partial<CLPDenoms>>(value || {});
  useEffect(() => setLocal(value || {}), [value]);

  const total = useMemo(
    () => ROWS.reduce((s, r) => s + (Number(r.key) * (Number(local[r.key]) || 0)), 0),
    [local]
  );

  function setQty(k: keyof CLPDenoms, qty: number) {
    const q = Math.max(0, Math.floor(qty || 0));
    const next = { ...local, [k]: q };
    setLocal(next);
    onChange?.(next);
  }

  return (
    <div className="space-y-2">
      {ROWS.map((r) => {
        const qty = Number(local[r.key]) || 0;
        const line = qty * Number(r.key);
        return (
          <div key={String(r.key)} className="grid grid-cols-3 gap-2 items-center">
            <div className="text-sm text-gray-600">{r.label}</div>
            <input
              className="border rounded px-2 py-1 text-sm"
              type="number"
              min={0}
              inputMode="numeric"
              value={qty}
              disabled={disabled}
              onChange={(e) => setQty(r.key, Number(e.target.value))}
            />
            <div className="text-right font-medium">${fmt(line)}</div>
          </div>
        );
      })}
      <div className="border-t pt-2 mt-2 flex justify-between text-sm">
        <span className="text-gray-600">Total contado</span>
        <b>${fmt(total)}</b>
      </div>
    </div>
  );
}
