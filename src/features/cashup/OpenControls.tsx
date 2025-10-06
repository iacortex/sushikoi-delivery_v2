// src/components/cashier/OpenControls.tsx
import React from "react";
import { useCashup } from "@/features/cashup/cashupContext";
import MoneyCounterModal, { CashCount } from "@/features/cashup/MoneyCounterModal";
import { LockOpen, Lock, Printer, RefreshCw } from "lucide-react";

// Compat (opcional)
let _compatGetter: ((ctx: any) => any) | null = null;
try {
  // @ts-ignore
  const mod = require("@/features/cashup/compat");
  _compatGetter = mod?.getCashupCompat || null;
} catch {}

const CLP = (n: number) => new Intl.NumberFormat("es-CL").format(Math.max(0, Math.round(n || 0)));

type Props = {
  // si quieres ocultar el botón de ticket de control:
  showControlTicket?: boolean;
  // quién está abriendo/cerrando
  defaultOperator?: string;
};

const OpenControls: React.FC<Props> = ({ showControlTicket = true, defaultOperator = "Cajero" }) => {
  const ctx = useCashup() as any;
  const cash = (_compatGetter ? _compatGetter(ctx) : ctx) as any;

  const current = cash?.current ?? null;
  const expected = (cash?.getExpectedCash ? cash.getExpectedCash(current) : 0) || 0;

  const [operator, setOperator] = React.useState<string>(defaultOperator);
  React.useEffect(() => {
    const by = current?.openedBy || ctx?.user?.name || defaultOperator;
    setOperator(by);
  }, [current, ctx?.user?.name, defaultOperator]);

  // modales
  const [openOpenModal, setOpenOpenModal] = React.useState(false);
  const [openCloseModal, setOpenCloseModal] = React.useState(false);

  const handleConfirmOpen = async (count: CashCount) => {
    try {
      if (!cash?.openSession) throw new Error("openSession no implementado");
      await cash.openSession({
        openedBy: operator,
        openingCount: { ...count },
      });
      setOpenOpenModal(false);
      setTimeout(() => cash?.recompute?.(), 0);
    } catch (e) {
      console.error("openSession error", e);
      alert("No se pudo abrir el turno.");
    }
  };

  const handleConfirmClose = async (count: CashCount) => {
    try {
      if (!cash?.closeSession) throw new Error("closeSession no implementado");
      await cash.closeSession({
        closedBy: operator,
        closingCount: { ...count },
      });
      setOpenCloseModal(false);
      setTimeout(() => cash?.recompute?.(), 0);
    } catch (e) {
      console.error("closeSession error", e);
      alert("No se pudo cerrar el turno.");
    }
  };

  // ticket simple de control (no cierre)
  const printControlTicket = () => {
    try {
      const html = `<!doctype html><html><head><meta charset="utf-8"/><style>
@page { size:80mm auto; margin:0 }
*{ font-family: ui-monospace, Menlo, Monaco, Consolas, "Courier New", monospace; }
body{ padding:8px 10px }
.center{text-align:center}.small{font-size:12px;color:#666}.big{font-weight:700;font-size:16px}
hr{ border:none; border-top:1px dashed #ddd; margin:8px 0 }
.right{ text-align:right } table{ width:100%; font-size:13px } td{ padding:2px 0 }
</style></head><body>
<div class="center big">SUSHIKOI</div>
<div class="center small">Ticket de control</div><hr/>
<table>
<tr><td>Fecha</td><td class="right">${new Date().toLocaleString("es-CL")}</td></tr>
<tr><td>Operador</td><td class="right">${operator || "-"}</td></tr>
<tr><td>Esperado</td><td class="right">$${CLP(expected)}</td></tr>
</table>
<hr/><div class="center small">Gracias • Sushikoi Puerto Montt</div>
<script>window.print(); setTimeout(()=>window.close(), 400)</script>
</body></html>`;
      const w = window.open("", "_blank", "width=420,height=640");
      if (w) { w.document.open(); w.document.write(html); w.document.close(); }
    } catch (e) {
      console.error("print control ticket error", e);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Operador (rápido) */}
      <input
        className="border rounded-md px-2 py-1 text-sm w-[180px]"
        placeholder="Responsable"
        value={operator}
        onChange={(e) => setOperator(e.target.value)}
        list="cashiers_list_opencontrols"
        title="Cajero responsable"
      />
      <datalist id="cashiers_list_opencontrols">
        <option value="Camila Yáñez" />
        <option value="Francisco Ponce" />
        <option value="Paola Finol" />
      </datalist>

      {!current ? (
        <>
          {/* Abrir turno SIEMPRE vía conteo (sin input de apertura) */}
          <button
            className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm inline-flex items-center gap-1"
            onClick={() => setOpenOpenModal(true)}
            title="Abrir con conteo"
          >
            <LockOpen size={14} /> Abrir turno
          </button>
        </>
      ) : (
        <>
          <div className="text-xs text-gray-600 ml-1">
            Esperado: <b>${CLP(expected)}</b>
          </div>
          <button
            className="px-3 py-1.5 rounded-md border hover:bg-gray-50 text-sm inline-flex items-center gap-1"
            onClick={() => setOpenCloseModal(true)}
            title="Cerrar con conteo"
          >
            <Lock size={14} /> Cerrar turno
          </button>
          <button
            className="px-3 py-1.5 rounded-md border hover:bg-gray-50 text-sm inline-flex items-center gap-1"
            onClick={() => cash?.recompute?.()}
            title="Recalcular"
          >
            <RefreshCw size={14} /> Recalcular
          </button>
          {showControlTicket && (
            <button
              className="px-3 py-1.5 rounded-md border hover:bg-gray-50 text-sm inline-flex items-center gap-1"
              onClick={printControlTicket}
              title="Imprimir ticket de control 80mm"
            >
              <Printer size={14} /> Ticket
            </button>
          )}
        </>
      )}

      {/* Modales de conteo */}
      <MoneyCounterModal
        open={openOpenModal}
        title="Apertura de turno"
        subtitle="Cuenta monedas y billetes del fondo de caja inicial."
        by={operator}
        onClose={() => setOpenOpenModal(false)}
        onConfirm={handleConfirmOpen}
      />
      <MoneyCounterModal
        open={openCloseModal}
        title="Cierre de turno"
        subtitle="Cuenta monedas y billetes del cierre."
        by={operator}
        onClose={() => setOpenCloseModal(false)}
        onConfirm={handleConfirmClose}
      />
    </div>
  );
};

export default OpenControls;
