// src/features/cashup/CashShiftModal.tsx
import React from "react";
import { useCashup } from "./cashupContext";
import { KioskModal } from "@/components/ui/KioskModal";
import { Lock, Unlock, Wallet, FileText, Printer, Coins } from "lucide-react";
import type { CashSession } from "./cashupContext";

const CLP = (n: number) => new Intl.NumberFormat("es-CL").format(Math.max(0, Math.round(n)));
const toNum = (v: string) => Number(String(v).replace(/[^\d]/g, "")) || 0;

type Props = { open: boolean; onClose: () => void; currentUser?: string };

export default function CashShiftModal({ open, onClose, currentUser }: Props) {
  const cashCtx = useCashup() as any;
  const cash = (cashCtx?.compat ? cashCtx.compat : cashCtx) as any;

  const current = cash?.current;
  const sessions: any[] = (cash?.listSessions?.() || []) as any[];

  const [openingCash, setOpeningCash] = React.useState<string>("");
  const [openingNote, setOpeningNote] = React.useState<string>("Apertura de turno");
  const [closingNote, setClosingNote] = React.useState<string>("");

  // cierre PRO
  const [countedCash, setCountedCash] = React.useState<string>("");

  React.useEffect(() => {
    if (!open) return;
    setOpeningCash(""); setOpeningNote("Apertura de turno"); setClosingNote("");
    setCountedCash("");
  }, [open]);

  const handleOpen = () => {
    try {
      const s = cash.openSession?.({
        openingCash: toNum(openingCash),
        openedBy: currentUser || "Cajero",
        note: openingNote || "Apertura",
      });
      if (s?.id) onClose(); else alert("No se pudo abrir el turno");
    } catch (e) { console.error(e); alert("Error abriendo turno"); }
  };

  const expectedCash = (cash?.getExpectedCash && cash.getExpectedCash(current)) || 0;
  const contado = toNum(countedCash);
  const diff = contado - expectedCash;

  const handleClose = () => {
    try {
      const note =
        (closingNote?.trim() ? `${closingNote}. ` : "") +
        `Cierre por ${currentUser || "Cajero"} • Contado $${CLP(contado)} • Dif $${CLP(diff)}`;
      const closed = cash.closeSession?.(note);
      if (closed?.closedAt) { printCloseReport80mm(closed, expectedCash, contado, diff); onClose(); }
      else alert("No se pudo cerrar el turno");
    } catch (e) { console.error(e); alert("Error cerrando turno"); }
  };

  return (
    <KioskModal open={open} onClose={onClose} title="Turno de Caja" subtitle="Abrir / Cerrar • Ver historial" designWidth={980} designHeight={720}>
      <div className="grid md:grid-cols-12 gap-3 text-[13px]">
        {/* Estado actual */}
        <div className="md:col-span-5 space-y-3">
          <div className="border rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Wallet size={18} className="text-rose-600" />
              <div className="font-semibold">Estado actual</div>
            </div>
            {current ? (
              <div className="mt-2 space-y-1">
                <Row label="Abierto por" value={current?.openedBy || "—"} />
                <Row label="Apertura" value={`$${CLP(current?.ops?.openingCash || 0)}`} />
                <Row label="Inicio" value={new Date(current.openedAt).toLocaleString("es-CL")} />
                <Row label="Efectivo esperado" value={<b className="text-rose-600">${CLP(expectedCash)}</b>} />
              </div>
            ) : (
              <div className="mt-2 text-gray-600">No hay turno abierto. Abre un nuevo turno para registrar ventas y movimientos.</div>
            )}
          </div>

          {/* Cierre PRO */}
          <div className="border rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Lock size={18} className="text-rose-600" />
              <div className="font-semibold">Cerrar turno</div>
            </div>
            <div className="mt-2 grid sm:grid-cols-2 gap-2">
              <div>
                <div className="text-xs text-gray-600 mb-1">Efectivo contado</div>
                <div className="flex items-center gap-2">
                  <Coins size={16} className="text-amber-600" />
                  <input className="w-full border rounded-md px-3 py-2" inputMode="numeric" placeholder="$" value={countedCash} onChange={(e)=>setCountedCash(e.target.value)} />
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">Diferencia</div>
                <div className={`px-3 py-2 border rounded-md ${diff===0?"bg-emerald-50 border-emerald-200 text-emerald-700": diff>0?"bg-amber-50 border-amber-200 text-amber-700":"bg-red-50 border-red-200 text-red-700"}`}>
                  {diff>0?"+":""}${CLP(diff)}
                </div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-xs text-gray-600 mb-1">Nota de cierre</div>
                <textarea rows={3} className="w-full border rounded-md px-3 py-2" placeholder="Observaciones…" value={closingNote} onChange={(e)=>setClosingNote(e.target.value)} />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <button disabled={!current} onClick={()=> current && printCloseReport80mm(current, expectedCash, contado, diff)} className={`flex-1 px-3 py-2 rounded-md border ${current? "hover:bg-gray-50":"cursor-not-allowed opacity-50"}`}>
                <Printer size={16} className="inline mr-1" /> Vista previa / Imprimir (80mm)
              </button>
              <button disabled={!current} onClick={handleClose} className={`flex-1 px-3 py-2 rounded-md text-white ${current? "bg-rose-600 hover:bg-rose-700":"bg-gray-300 cursor-not-allowed"}`}>
                Cerrar turno
              </button>
            </div>
          </div>
        </div>

        {/* Apertura e Historial */}
        <div className="md:col-span-7 space-y-3">
          {/* Abrir turno */}
          <div className="border rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Unlock size={18} className="text-emerald-600" />
              <div className="font-semibold">Abrir turno</div>
            </div>
            <div className="mt-2 grid sm:grid-cols-2 gap-2">
              <div>
                <div className="text-xs text-gray-600 mb-1">Efectivo de apertura</div>
                <input className="w-full border rounded-md px-3 py-2" inputMode="numeric" placeholder="$" value={openingCash} onChange={(e)=>setOpeningCash(e.target.value)} />
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">Responsable</div>
                <input className="w-full border rounded-md px-3 py-2" value={currentUser || "Cajero"} readOnly />
              </div>
              <div className="sm:col-span-2">
                <div className="text-xs text-gray-600 mb-1">Nota</div>
                <input className="w-full border rounded-md px-3 py-2" value={openingNote} onChange={(e)=>setOpeningNote(e.target.value)} />
              </div>
            </div>
            <div className="mt-2">
              <button disabled={!!current} onClick={handleOpen} className={`w-full px-3 py-2 rounded-md text-white ${!current? "bg-emerald-600 hover:bg-emerald-700":"bg-gray-300 cursor-not-allowed"}`}>
                Abrir turno
              </button>
            </div>
          </div>

          {/* Historial simple */}
          <div className="border rounded-lg p-3">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-gray-600" />
              <div className="font-semibold">Historial (últimos turnos)</div>
            </div>
            {sessions.length === 0 ? (
              <div className="mt-2 text-gray-600 text-sm">—</div>
            ) : (
              <div className="mt-2 divide-y text-sm">
                {sessions.slice(0, 6).map((s: any) => (
                  <div key={s.id} className="py-2 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="font-medium">{s.openedBy || "Cajero"} — ${CLP(s?.ops?.openingCash || 0)}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(s.openedAt).toLocaleString("es-CL")}{" "}
                        {s.closedAt ? `• Cerrado: ${new Date(s.closedAt).toLocaleString("es-CL")}` : "• Abierto"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Ventas: ${CLP(s?.ops?.salesRuntime?.total || 0)}</div>
                      <div className="text-xs text-gray-500">
                        Gastos: ${CLP((s?.ops?.expenses || []).reduce((a: number, b: any) => a + (b?.amount || 0), 0))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </KioskModal>
  );
}

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex items-center justify-between"><span className="text-gray-600">{label}</span><span className="font-semibold">{value}</span></div>
);

/* ============ Close Report 80mm (con contado y diferencia) ============ */
function printCloseReport80mm(s: CashSession, expected: number, counted = 0, diff = 0) {
  const fechaApertura = new Date(s.openedAt).toLocaleString("es-CL");
  const fechaCierre = new Date(s.closedAt || Date.now()).toLocaleString("es-CL");
  const gastos = (s.ops.expenses || []).reduce((a, b) => a + (b?.amount || 0), 0);
  const retiros = s.ops.withdrawals || 0;
  const propinas = s.ops.tips?.cashTips || 0;
  const apert = s.ops.openingCash || 0;
  const ventasPorMetodo = s.ops.salesRuntime.byMethod || {};
  const ventasTotal = s.ops.salesRuntime.total || 0;
  const eboletaAmount = s.ops.fiscal?.eboletaAmount || 0;
  const eboletaCount = s.ops.fiscal?.eboletaCount || 0;

  const ventaLine = (k: string) => {
    const v = ventasPorMetodo[k] || 0;
    return v ? `<tr><td>${k.replace("_"," ")}</td><td style="text-align:right">$${CLP(v)}</td></tr>` : "";
  };

  const lastExpenses = (s.ops.expenses || []).slice(-10).reverse();

  const html = `<!doctype html>
<html><head><meta charset="utf-8" />
<title>Close Report</title>
<style>
  @page { size: 80mm auto; margin: 0 }
  * { font-family: ui-monospace, Menlo, Monaco, Consolas, "Courier New", monospace; }
  body { padding: 8px 10px }
  .center { text-align:center }
  .muted { color:#666; font-size:12px }
  .big { font-weight:700; font-size:16px }
  hr { border:none; border-top:1px dashed #ddd; margin:8px 0 }
  table { width:100%; font-size:13px }
  td { padding:2px 0 }
  .tot { font-weight:700 }
</style></head>
<body>
  <div class="center big">SUSHIKOI</div>
  <div class="center muted">Reporte de Cierre — 80mm</div>
  <hr/>
  <table>
    <tr><td>Inicio</td><td style="text-align:right">${fechaApertura}</td></tr>
    <tr><td>Cierre</td><td style="text-align:right">${fechaCierre}</td></tr>
    <tr><td>Cajero</td><td style="text-align:right">${s.openedBy || "-"}</td></tr>
  </table>
  <hr/>
  <table>
    <tr><td>Apertura</td><td style="text-align:right">$${CLP(apert)}</td></tr>
    ${ventaLine("EFECTIVO_SISTEMA")}
    ${ventaLine("DEBITO_SISTEMA")}
    ${ventaLine("CREDITO_SISTEMA")}
    ${ventaLine("POS_DEBITO")}
    ${ventaLine("POS_CREDITO")}
    ${ventaLine("MERCADO_PAGO")}
    ${ventaLine("TRANSFERENCIA")}
    <tr class="tot"><td>Ventas total</td><td style="text-align:right">$${CLP(ventasTotal)}</td></tr>
    <tr><td>Propinas (cash)</td><td style="text-align:right">$${CLP(propinas)}</td></tr>
    <tr><td>Gastos</td><td style="text-align:right">-$${CLP(gastos)}</td></tr>
    <tr><td>Retiros</td><td style="text-align:right">-$${CLP(retiros)}</td></tr>
    <tr class="tot"><td>Efectivo esperado</td><td style="text-align:right">$${CLP(expected)}</td></tr>
    <tr><td>Contado</td><td style="text-align:right"><b>$${CLP(counted)}</b></td></tr>
    <tr><td>Diferencia</td><td style="text-align:right"><b>$${CLP(diff)}</b></td></tr>
  </table>
  <hr/>
  <table>
    <tr><td>E-Boletas (monto)</td><td style="text-align:right">$${CLP(eboletaAmount)}</td></tr>
    <tr><td>E-Boletas (unid.)</td><td style="text-align:right">${CLP(eboletaCount)}</td></tr>
  </table>
  <hr/>
  <div class="muted">Últimos gastos</div>
  <table>
    ${
      lastExpenses.length
        ? lastExpenses
            .map(e=>`<tr><td>${new Date(e.ts).toLocaleTimeString("es-CL",{hour:"2-digit",minute:"2-digit"})} ${e.label || "Gasto"}</td><td style="text-align:right">$${CLP(e.amount)}</td></tr>`)
            .join("")
        : `<tr><td colspan="2" class="muted">—</td></tr>`
    }
  </table>
  <hr/>
  <div class="center muted" style="margin-top:8px;">Gracias • Sushikoi Puerto Montt</div>
  <script>window.print(); setTimeout(()=>window.close(), 400);</script>
</body></html>`;
  const w = window.open("", "_blank", "width=420,height=720");
  if (!w) return;
  w.document.open(); w.document.write(html); w.document.close();
}
