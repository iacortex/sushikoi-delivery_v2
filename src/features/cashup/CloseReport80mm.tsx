import React, { useMemo } from "react";
import { useCashup, totalFromDenoms } from "./cashupContext";
import type { Session, CLPDenoms } from "./cashupContext";

function fmt(n: number) { return new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 }).format(Math.round(n || 0)); }
const DENOMS_ORDER: Array<keyof CLPDenoms> = [20000,10000,5000,2000,1000,500,100,50,10];

const Row: React.FC<{ l: React.ReactNode; r: React.ReactNode; bold?: boolean }> = ({ l, r, bold }) => (
  <div className="flex justify-between text-[12px] leading-5"><span className={bold ? "font-semibold" : ""}>{l}</span><span className={bold ? "font-semibold" : ""}>{r}</span></div>
);
const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (<div className="mt-2 mb-1 text-[12px] font-semibold tracking-wide">{children}</div>);

export default function CloseReport80mm({ session, onClose }: { session: Session; onClose: () => void; }) {
  const { getExpectedCash } = useCashup();

  const open = session.open;
  const close = session.close!;
  const by = session.ops.salesRuntime.byMethod || {};
  const expenses = session.ops.expenses || [];
  const expectedCash = useMemo(() => getExpectedCash(session), [session, getExpectedCash]);
  const countedCash = close.countedCash || 0;
  const diff = (typeof close.cashDiff === "number" ? close.cashDiff : (countedCash - expectedCash));

  const denomLines = (d?: Partial<CLPDenoms>) =>
    DENOMS_ORDER.map((k) => ({ k, qty: d?.[k] || 0, line: (d?.[k] || 0) * Number(k) })).filter((x) => x.qty > 0);
  const openDenoms = denomLines(open.openingDenoms);
  const countedDenoms = denomLines(close.countedDenoms);

  const expensesTotal = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const totalSales = Object.values(by).reduce((s, v) => s + (v || 0), 0);
  const splitCount = session.ops.salesRuntime.splitSales?.length || 0;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-xl border w-[380px]">
        {/* Contenido imprimible */}
        <div id="ticket-area" className="p-4 ticket-80 mx-auto">
          <div className="text-center">
            <div className="text-[14px] font-extrabold tracking-widest">SUSHIKOI</div>
            <div className="text-[11px] text-gray-600">Puerto Montt</div>
            <div className="text-[11px] text-gray-600">RUT: 76.123.456-K</div>
            <div className="mt-1 text-[12px] font-semibold">CIERRE DE TURNO</div>
          </div>

          <div className="my-2 border-t border-dashed" />

          <Row l="ID Turno" r={session.id} />
          <Row l="Estado" r={session.status} />
          <Row l="Apertura" r={new Date(open.openedAt).toLocaleString("es-CL")} />
          <Row l="Cierre" r={close.closedAt ? new Date(close.closedAt).toLocaleString("es-CL") : "—"} />
          <Row l="Cajero" r={open.cashierName} />

          <div className="my-2 border-t border-dashed" />

          <SectionTitle>Fondo inicial</SectionTitle>
          <Row l="Fondo" r={`$${fmt(open.openingFloat)}`} />
          {openDenoms.length > 0 && (
            <div className="mt-1">
              {openDenoms.map((x) => (<Row key={String(x.k)} l={`  ${fmt(Number(x.k))} x ${fmt(x.qty)}`} r={`$${fmt(x.line)}`} />))}
              <Row l="Sub-total contado" r={`$${fmt(totalFromDenoms(open.openingDenoms))}`} />
            </div>
          )}

          <div className="my-2 border-t border-dashed" />

          <SectionTitle>Ventas por método</SectionTitle>
          <Row l="Efectivo (sistema)" r={`$${fmt(by.EFECTIVO_SISTEMA || 0)}`} />
          <Row l="Débito (sistema)" r={`$${fmt(by.DEBITO_SISTEMA || 0)}`} />
          <Row l="Crédito (sistema)" r={`$${fmt(by.CREDITO_SISTEMA || 0)}`} />
          <Row l="POS Débito" r={`$${fmt(by.POS_DEBITO || 0)}`} />
          <Row l="POS Crédito" r={`$${fmt(by.POS_CREDITO || 0)}`} />
          <Row l="Transferencia" r={`$${fmt(by.TRANSFERENCIA || 0)}`} />
          <Row l="Mercado Pago" r={`$${fmt(by.MERCADO_PAGO || 0)}`} />
          <Row l="— Total ventas" r={`$${fmt(totalSales)}`} bold />

          <div className="my-2 border-t border-dashed" />

          <SectionTitle>Gastos / Retiros / Propinas</SectionTitle>
          <Row l="Gastos" r={`$${fmt(expensesTotal)}`} />
          <Row l="Retiros" r={`$${fmt(session.ops.withdrawals || 0)}`} />
          <Row l="Propinas (cash)" r={`$${fmt(session.ops.tips?.cashTips || 0)}`} />
          <Row l="E-Boletas ($ / #)" r={`$${fmt(session.ops.fiscal?.eboletaAmount || 0)} / ${fmt(session.ops.fiscal?.eboletaCount || 0)}`} />
          <Row l="Pagos mixtos (cant.)" r={String(splitCount)} />

          {expenses.length > 0 && (
            <>
              <div className="my-2 border-t border-dashed" />
              <SectionTitle>Detalle de gastos</SectionTitle>
              <div className="text-[11px]">
                {expenses.map((e) => (
                  <div key={e.id} className="flex justify-between">
                    <span>
                      {e.category || "otros"}{e.concept ? ` — ${e.concept}` : ""}{e.note ? ` (${e.note})` : ""} · {new Date(e.createdAt).toLocaleTimeString("es-CL")}
                    </span>
                    <b>${fmt(e.amount)}</b>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="my-2 border-t border-dashed" />

          <SectionTitle>Efectivo</SectionTitle>
          <Row l="Esperado" r={`$${fmt(expectedCash)}`} />
          <Row l="Contado" r={`$${fmt(countedCash)}`} />
          <Row l="Diferencia" r={`$${fmt(diff)}`} bold />

          {/* Ajuste de baseline (45.000) */}
          {close.baselineAdjust && (
            <>
              <div className="my-2 border-t border-dashed" />
              <SectionTitle>Ajuste a caja final</SectionTitle>
              <Row l="Caja objetivo" r={`$${fmt(close.baselineAdjust.toKeep)}`} />
              <Row l="Acción" r={`${close.baselineAdjust.action}`} />
              <Row l="Monto ajuste" r={`$${fmt(close.baselineAdjust.amount)}`} />
            </>
          )}

          {countedDenoms.length > 0 && (
            <>
              <div className="my-2 border-t border-dashed" />
              <SectionTitle>Conteo por denominación</SectionTitle>
              {countedDenoms.map((x) => (<Row key={String(x.k)} l={`  ${fmt(Number(x.k))} x ${fmt(x.qty)}`} r={`$${fmt(x.line)}`} />))}
            </>
          )}

          <div className="my-2 border-t border-dashed" />

          <SectionTitle>Firmas</SectionTitle>
          <div className="mt-1 text-[12px]">
            <div className="h-10" />
            <Row l="Cajero" r={close.signedBy || open.cashierName} />
            {close.supervisor && (<><div className="h-10" /><Row l="Supervisor" r={`${close.supervisor.name || ""}  (PIN ${close.supervisor.pinMasked || ""})`} /></>)}
          </div>

          <div className="mt-2 text-center text-[10px] text-gray-500">Generado: {new Date().toLocaleString("es-CL")}</div>
        </div>

        {/* Acciones */}
        <div className="p-3 border-t flex justify-end gap-2 no-print">
          <button className="px-3 py-1 rounded border" onClick={onClose}>Cerrar</button>
          <button className="px-3 py-1 rounded bg-rose-600 text-white" onClick={() => window.print()}>Imprimir PDF</button>
        </div>
      </div>
    </div>
  );
}
