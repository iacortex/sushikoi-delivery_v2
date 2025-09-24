import React from "react";
import type { CashCount } from "./types";
import { clp, toInt } from "@/utils/currency";

const DEFAULTS = [
  { denom: 20000, kind: "BILL" as const },
  { denom: 10000, kind: "BILL" as const },
  { denom: 5000,  kind: "BILL" as const },
  { denom: 2000,  kind: "BILL" as const },
  { denom: 1000,  kind: "BILL" as const },
  { denom: 500,   kind: "COIN" as const },
  { denom: 100,   kind: "COIN" as const },
  { denom: 50,    kind: "COIN" as const },
  { denom: 10,    kind: "COIN" as const },
];

export function CashDenominationCount({
  value, onChange
}: { value: CashCount; onChange: (c: CashCount)=>void }) {

  const lines = value?.lines?.length ? value.lines : DEFAULTS.map(d => ({ ...d, qty: 0, total: 0 }));

  function setQty(idx: number, qtyStr: string) {
    const qty = toInt(qtyStr);
    const next = lines.map((l, i) => i===idx ? { ...l, qty, total: qty * l.denom } : l);
    onChange({ lines: next, countedTotal: next.reduce((a,b)=>a+b.total,0) });
  }

  const total = lines.reduce((a,b)=>a+b.total,0);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-2 text-xs font-semibold text-gray-500">
        <span>Denominación</span><span>Cantidad</span><span>Total</span><span>Tipo</span>
      </div>
      {lines.map((l, i)=>(
        <div key={l.denom} className="grid grid-cols-4 gap-2 items-center border rounded-lg p-2">
          <div className="font-medium">{clp(l.denom)}</div>
          <input
            className="border rounded px-2 py-1"
            inputMode="numeric"
            value={l.qty}
            onChange={e=>setQty(i, e.target.value)}
            placeholder="0"
          />
          <div className="text-right font-semibold">{clp(l.total)}</div>
          <div className="text-xs text-gray-500">{l.kind==="BILL"?"Billete":"Moneda"}</div>
        </div>
      ))}
      <div className="flex justify-between pt-2 border-t">
        <span className="font-semibold">Total contado</span>
        <span className="font-bold">{clp(total)}</span>
      </div>
    </div>
  );
}
