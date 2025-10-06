import React from "react";
import {
  Wallet,
  LockOpen,
  Lock,
  Calculator,
  Info,
  Receipt,
  History,
  RefreshCw,
  Printer,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useCashup } from "./cashupContext";
import MoneyCounterModal, { CashCount } from "./MoneyCounterModal";
// getCashupCompat es opcional: si no lo tienes, el fallback usa el ctx tal cual
// eslint-disable-next-line @typescript-eslint/no-var-requires
let _compatGetter: ((ctx: any) => any) | null = null;
try {
  // @ts-ignore
  const mod = require("./compat");
  _compatGetter = mod?.getCashupCompat || null;
} catch {}

/* ====================== Utils ====================== */
const CLP = (n: number) =>
  new Intl.NumberFormat("es-CL").format(Math.max(0, Math.round(n || 0)));

const fmtDT = (ts: number | undefined) =>
  ts ? new Date(ts).toLocaleString("es-CL") : "-";

/* ===================== Component ==================== */
const CashQuickPanel: React.FC = () => {
  const ctx = useCashup() as any;
  const cash = (_compatGetter ? _compatGetter(ctx) : ctx) as any;

  // estado del turno actual (puede ser null)
  const current = cash?.current ?? null;

  const [operator, setOperator] = React.useState<string>("Cajero");
  const [openCountModal, setOpenCountModal] = React.useState(false);
  const [closeCountModal, setCloseCountModal] = React.useState(false);

  const [notesOpen, setNotesOpen] = React.useState(false);
  const [openNotes, setOpenNotes] = React.useState<string>("");
  const [closeNotes, setCloseNotes] = React.useState<string>("");

  // refresca operador y notas si el turno cambia
  React.useEffect(() => {
    const by =
      (current && (current.openedBy as string)) ||
      (ctx?.user?.name as string) ||
      "Cajero";
    setOperator(by);
    setOpenNotes(current?.openingCount?.notes || "");
    // closeNotes se edita al cerrar; aquí no pisar si ya escribió
  }, [current, ctx?.user?.name]);

  // efectivo esperado (según ventas/ops) para el turno actual
  const expectedNow: number =
    (cash?.getExpectedCash ? cash.getExpectedCash(current) : 0) || 0;

  // recompute en demanda
  const onRefresh = () => {
    try {
      cash?.recompute?.();
    } catch {}
  };

  /* ================== Handlers conteo ================== */
  const onConfirmOpen = async (count: CashCount) => {
    try {
      if (!cash?.openSession) throw new Error("openSession no implementado");
      await cash.openSession({
        openedBy: operator,
        openingCount: { ...count, notes: openNotes },
      });
    } catch (e) {
      console.error("[CashQuickPanel] openSession error", e);
      alert("No se pudo abrir el turno.");
    } finally {
      setOpenCountModal(false);
      setTimeout(() => cash?.recompute?.(), 0);
    }
  };

  const onConfirmClose = async (count: CashCount) => {
    try {
      if (!cash?.closeSession) throw new Error("closeSession no implementado");
      await cash.closeSession({
        closedBy: operator,
        closingCount: { ...count, notes: closeNotes },
      });

      // Ticket 80mm de cierre
      printClose80mm({
        opening: current?.openingCount?.total || 0,
        expected: expectedNow,
        closingCount: { ...count, by: operator },
      });
    } catch (e) {
      console.error("[CashQuickPanel] closeSession error", e);
      alert("No se pudo cerrar el turno.");
    } finally {
      setCloseCountModal(false);
      setTimeout(() => cash?.recompute?.(), 0);
    }
  };

  /* ==================== Resumen turno =================== */
  const resumen = React.useMemo(() => {
    const s = current;
    if (!s) {
      return {
        abierto: false,
        openedAt: null,
        openedBy: "",
        opening: 0,
        gastos: 0,
        retiros: 0,
        propinas: 0,
        ventas: {
          efectivo: 0,
          debito: 0,
          credito: 0,
          transferencia: 0,
          mp: 0,
        },
        expected: 0,
      } as const;
    }

    const ops = s.ops || {};
    const tips = ops.tips || {};
    const v = s.sales || {};
    const ventas = {
      efectivo: Math.round(v.EFECTIVO || v.EFECTIVO_SISTEMA || 0),
      debito: Math.round(v.DEBITO || v.DEBITO_SISTEMA || 0),
      credito: Math.round(v.CREDITO || v.CREDITO_SISTEMA || 0),
      transferencia: Math.round(v.TRANSFERENCIA || 0),
      mp: Math.round(v.MERCADO_PAGO || 0),
    };

    return {
      abierto: true,
      openedAt: s.openedAt || null,
      openedBy: s.openedBy || "",
      opening: Math.round(s.openingCount?.total || 0),
      gastos: Math.round(
        (ops.expenses || []).reduce(
          (acc: number, e: any) => acc + (Number(e.amount) || 0),
          0
        )
      ),
      retiros: Math.round(ops.withdrawals || 0),
      propinas: Math.round(tips.cashTips || 0),
      ventas,
      expected: Math.round(expectedNow || 0),
    } as const;
  }, [current, expectedNow]);

  const ventasTotal =
    resumen.ventas.efectivo +
    resumen.ventas.debito +
    resumen.ventas.credito +
    resumen.ventas.transferencia +
    resumen.ventas.mp;

  /* ======================== JSX ======================== */
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Wallet size={18} className="text-rose-600" />
          <div>
            <div className="font-semibold">
              {resumen.abierto ? "Turno abierto" : "Turno cerrado"}
            </div>
            <div className="text-xs text-gray-500">
              {resumen.abierto ? (
                <>
                  Apertura: <b>{fmtDT(resumen.openedAt || undefined)}</b> •{" "}
                  Operador: <b>{resumen.openedBy || "—"}</b>
                </>
              ) : (
                "Abra un turno para operar la caja"
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Operador editable rápido */}
          <div className="hidden md:flex items-center gap-2 mr-2">
            <span className="text-xs text-gray-600">Responsable</span>
            <input
              className="border rounded-md px-2 py-1 text-sm w-[200px]"
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              placeholder="Nombre del cajero"
              list="cashiers_list"
              title="Cajero responsable"
            />
            <datalist id="cashiers_list">
              <option value="Camila Yáñez" />
              <option value="Francisco Ponce" />
              <option value="Paola Finol" />
            </datalist>
          </div>

          {/* Botón abrir/cerrar */}
          {!resumen.abierto ? (
            <>
              <button
                className="px-3 py-1.5 text-sm rounded-md border hover:bg-gray-50 inline-flex items-center gap-1"
                onClick={() => setOpenCountModal(true)}
                title="Abrir con conteo"
              >
                <LockOpen size={14} /> Abrir turno
              </button>
              <button
                className="px-3 py-1.5 text-sm rounded-md border hover:bg-gray-50 inline-flex items-center gap-1"
                onClick={() => setNotesOpen((v) => !v)}
                title="Notas apertura"
              >
                <Info size={14} /> Notas
              </button>
            </>
          ) : (
            <>
              <div className="text-right mr-2">
                <div className="text-xs text-gray-500">Efectivo esperado</div>
                <div className="text-sm font-semibold">
                  ${CLP(resumen.expected)}
                </div>
              </div>
              <button
                className="px-3 py-1.5 text-sm rounded-md border hover:bg-gray-50 inline-flex items-center gap-1"
                onClick={() => setCloseCountModal(true)}
                title="Cerrar con conteo"
              >
                <Lock size={14} /> Cerrar turno
              </button>
              <button
                className="px-3 py-1.5 text-sm rounded-md border hover:bg-gray-50 inline-flex items-center gap-1"
                onClick={onRefresh}
                title="Recalcular"
              >
                <RefreshCw size={14} /> Recalcular
              </button>
              <button
                className="px-3 py-1.5 text-sm rounded-md border hover:bg-gray-50 inline-flex items-center gap-1"
                onClick={() =>
                  printClose80mm({
                    opening: resumen.opening,
                    expected: resumen.expected,
                    closingCount: {
                      total: resumen.expected,
                      breakdown: [],
                      ts: Date.now(),
                      by: operator,
                      notes: "Ticket de control (no cierre)",
                    },
                  })
                }
                title="Imprimir ticket control 80mm"
              >
                <Printer size={14} /> Ticket
              </button>
            </>
          )}
        </div>
      </div>

      {/* Notas toggle apertura / cierre */}
      {notesOpen && (
        <div className="mt-3 grid md:grid-cols-2 gap-3">
          {!resumen.abierto ? (
            <div className="border rounded-lg p-3">
              <div className="text-sm font-semibold mb-1">
                Notas de apertura
              </div>
              <textarea
                className="w-full border rounded-md px-2 py-2 text-sm"
                rows={3}
                value={openNotes}
                onChange={(e) => setOpenNotes(e.target.value)}
                placeholder="Observaciones del fondo de caja, sellos, arqueo inicial, etc."
              />
              <div className="text-xs text-gray-500 mt-1">
                Las notas se guardan al confirmar el conteo de apertura.
              </div>
            </div>
          ) : (
            <div className="border rounded-lg p-3">
              <div className="text-sm font-semibold mb-1">
                Notas de cierre
              </div>
              <textarea
                className="w-full border rounded-md px-2 py-2 text-sm"
                rows={3}
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
                placeholder="Observaciones del cierre, diferencias, incidencias, entrega, etc."
              />
              <div className="text-xs text-gray-500 mt-1">
                Las notas se imprimen en el ticket 80mm cuando confirmes el
                cierre.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Resumen / Métricas */}
      <div className="mt-4 grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-3">
        <Stat
          icon={<Calculator size={14} />}
          label="Apertura (contada)"
          value={`$${CLP(resumen.opening)}`}
        />
        <Stat
          icon={<Receipt size={14} />}
          label="Ventas (total)"
          value={`$${CLP(ventasTotal)}`}
        />
        <Stat
          icon={<History size={14} />}
          label="Gastos / Retiros / Propinas"
          value={`$${CLP(resumen.gastos)} / $${CLP(
            resumen.retiros
          )} / $${CLP(resumen.propinas)}`}
        />
        <Stat
          icon={<Sparkles size={14} />}
          label="Efectivo esperado"
          value={`$${CLP(resumen.expected)}`}
          highlight
        />
      </div>

      {/* Ventas por método */}
      <div className="mt-4 border rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600">
          Ventas por método
        </div>
        <div className="divide-y">
          <RowKV k="Efectivo" v={`$${CLP(resumen.ventas.efectivo)}`} />
          <RowKV k="Débito" v={`$${CLP(resumen.ventas.debito)}`} />
          <RowKV k="Crédito" v={`$${CLP(resumen.ventas.credito)}`} />
          <RowKV k="Transferencia" v={`$${CLP(resumen.ventas.transferencia)}`} />
          <RowKV k="Mercado Pago" v={`$${CLP(resumen.ventas.mp)}`} />
          <RowKV
            k={
              <span className="inline-flex items-center gap-1">
                Total <ChevronRight size={12} />
              </span>
            }
            v={<b>${CLP(ventasTotal)}</b>}
          />
        </div>
      </div>

      {/* Historial corto de gastos (si quieres mostrar algo rápido) */}
      <div className="mt-4 grid md:grid-cols-2 gap-3">
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600">
            Últimos gastos
          </div>
          <div className="max-h-[200px] overflow-auto divide-y">
            {current?.ops?.expenses?.length ? (
              [...current.ops.expenses]
                .slice(-8)
                .reverse()
                .map((e: any, i: number) => (
                  <div key={i} className="px-3 py-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-700">
                        {e.label || "Gasto"}
                      </span>
                      <span className="font-medium">${CLP(e.amount)}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {fmtDT(e.ts)} • {e.by || "—"}
                    </div>
                  </div>
                ))
            ) : (
              <div className="px-3 py-3 text-sm text-gray-500">—</div>
            )}
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600">
            Totales operativos
          </div>
          <div className="divide-y">
            <RowKV k="Gastos" v={`$${CLP(resumen.gastos)}`} />
            <RowKV k="Retiros" v={`$${CLP(resumen.retiros)}`} />
            <RowKV k="Propinas (cash)" v={`$${CLP(resumen.propinas)}`} />
            <RowKV
              k="Saldo operado"
              v={
                <b>
                  $
                  {CLP(resumen.gastos + resumen.retiros + resumen.propinas)}
                </b>
              }
            />
          </div>
        </div>
      </div>

      {/* Modales de conteo */}
      <MoneyCounterModal
        open={openCountModal}
        title="Apertura de turno"
        subtitle="Cuenta monedas y billetes del fondo de caja inicial."
        by={operator}
        onClose={() => setOpenCountModal(false)}
        onConfirm={onConfirmOpen}
        initialNotes={openNotes}
      />

      <MoneyCounterModal
        open={closeCountModal}
        title="Cierre de turno"
        subtitle="Cuenta monedas y billetes del cierre."
        by={operator}
        onClose={() => setCloseCountModal(false)}
        onConfirm={onConfirmClose}
        initialNotes={closeNotes}
      />
    </div>
  );
};

export default CashQuickPanel;

/* =================== UI helpers =================== */
const RowKV: React.FC<{ k: React.ReactNode; v: React.ReactNode }> = ({
  k,
  v,
}) => (
  <div className="px-3 py-2 text-sm flex items-center justify-between">
    <span className="text-gray-700">{k}</span>
    <span>{v}</span>
  </div>
);

const Stat: React.FC<{
  icon?: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}> = ({ icon, label, value, highlight }) => (
  <div
    className={[
      "p-3 rounded-lg border",
      highlight ? "bg-rose-50 border-rose-200" : "bg-gray-50 border-gray-200",
    ].join(" ")}
  >
    <div className="text-xs text-gray-600 flex items-center gap-1">
      {icon}
      {label}
    </div>
    <div className="text-lg font-semibold mt-1">{value}</div>
  </div>
);

/* ================= Ticket 80mm cierre ================= */
function printClose80mm(args: {
  opening: number;
  expected: number;
  closingCount: CashCount;
}) {
  try {
    const { opening, expected, closingCount } = args;
    const contado = closingCount?.total || 0;
    const diff = Math.round(contado - expected);

    const lines = (closingCount?.breakdown || [])
      .filter((r) => r.qty > 0)
      .sort((a, b) => b.denom - a.denom)
      .map(
        (r) =>
          `<tr><td>${r.qty} × ${r.denom}</td><td class="right">$${CLP(
            r.qty * r.denom
          )}</td></tr>`
      )
      .join("");

    const html = `<!doctype html>
<html><head><meta charset="utf-8" />
<title>Cierre de Caja</title>
<style>
@page { size: 80mm auto; margin: 0 }
*{ font-family: ui-monospace, Menlo, Monaco, Consolas, "Courier New", monospace; }
body{ padding:8px 10px }
.center{ text-align:center }
.small{ font-size:12px; color:#666 }
.big{ font-weight:700; font-size:16px }
hr{ border:none; border-top:1px dashed #ddd; margin:8px 0 }
table{ width:100%; font-size:13px }
td{ padding:2px 0 }
.right{ text-align:right }
</style></head>
<body>
  <div class="center big">SUSHIKOI</div>
  <div class="center small">Cierre de turno</div>
  <hr/>
  <table>
    <tr><td>Fecha</td><td class="right">${new Date(
      closingCount.ts
    ).toLocaleString("es-CL")}</td></tr>
    <tr><td>Operador</td><td class="right">${closingCount.by || "-"}</td></tr>
  </table>
  <hr/>
  <div class="small">Desglose contado</div>
  <table>${lines || `<tr><td>—</td><td class="right">—</td></tr>`}</table>
  <hr/>
  <table>
    <tr><td>Apertura</td><td class="right">$${CLP(opening)}</td></tr>
    <tr><td>Esperado</td><td class="right">$${CLP(expected)}</td></tr>
    <tr><td>Contado cierre</td><td class="right">$${CLP(contado)}</td></tr>
    <tr><td><b>Diferencia</b></td><td class="right"><b>$${CLP(diff)}</b></td></tr>
  </table>
  ${
    closingCount.notes
      ? `<hr/><div class="small">${closingCount.notes}</div>`
      : ""
  }
  <hr/>
  <div class="center small">Gracias • Sushikoi Puerto Montt</div>
  <script>window.print(); setTimeout(()=>window.close(), 400)</script>
</body></html>`;

    const w = window.open("", "_blank", "width=420,height=640");
    if (w) {
      w.document.open();
      w.document.write(html);
      w.document.close();
    }
  } catch (e) {
    console.error("print close 80mm error", e);
  }
}
