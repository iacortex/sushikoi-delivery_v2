// src/features/cashup/CashShiftModal.tsx
import React from "react";
import { useCashup } from "./cashupContext";
import { KioskModal } from "@/components/ui/KioskModal";
import {
  Lock,
  Wallet,
  FileText,
  Printer,
  Coins,
  History as HistoryIcon,
  Download,
  PieChart,
  MinusCircle,
  HandCoins,
  DollarSign,
} from "lucide-react";
import type { CashSession } from "./cashupContext";

const CLP = (n: number) =>
  new Intl.NumberFormat("es-CL").format(Math.max(0, Math.round(n || 0)));
const toNum = (v: string) => Number(String(v).replace(/[^\d]/g, "")) || 0;

type Props = { open: boolean; onClose: () => void; currentUser?: string };

export default function CashShiftModal({ open, onClose, currentUser }: Props) {
  const cashCtx = useCashup() as any;
  const cash = (cashCtx?.compat ? cashCtx.compat : cashCtx) as any;

  const current = cash?.current as CashSession | undefined;
  const sessions: CashSession[] = (cash?.listSessions?.() || []) as any[];

  // CIERRE
  const [countedCash, setCountedCash] = React.useState<string>("");
  const [closingNote, setClosingNote] = React.useState<string>("");

  React.useEffect(() => {
    if (!open) return;
    setCountedCash("");
    setClosingNote("");
  }, [open]);

  const expectedCash =
    (cash?.getExpectedCash && current ? cash.getExpectedCash(current) : 0) || 0;
  const contado = toNum(countedCash);
  const diff = contado - expectedCash;

  const handleClose = () => {
    if (!current) return;
    try {
      const note =
        (closingNote?.trim() ? `${closingNote}. ` : "") +
        `Cierre por ${currentUser || "Cajero"} • Contado $${CLP(
          contado
        )} • Dif $${CLP(diff)}`;
      const closed = cash.closeSession?.(note);
      if (closed?.closedAt) {
        printCloseReport80mm(closed, expectedCash, contado, diff);
        onClose();
      } else alert("No se pudo cerrar el turno");
    } catch (e) {
      console.error(e);
      alert("Error cerrando turno");
    }
  };

  // ======= MOVIMIENTOS (turno actual) =======
  const movExpenses =
    (current?.ops?.expenses as Array<{ ts: number; label: string; amount: number }>) ||
    [];
  const movWithdrawals = current?.ops?.withdrawals || 0;
  const movTips = current?.ops?.tips?.cashTips || 0;
  const byMethod:
    | Record<
        | "EFECTIVO_SISTEMA"
        | "DEBITO_SISTEMA"
        | "CREDITO_SISTEMA"
        | "POS_DEBITO"
        | "POS_CREDITO"
        | "TRANSFERENCIA"
        | "MERCADO_PAGO",
        number
      >
    | Record<string, number> =
    (current?.ops?.salesRuntime?.byMethod as any) || {};
  const ventasTotal = current?.ops?.salesRuntime?.total || 0;

  // ======= EXPORTS =======
  function csvEscape(s: string) {
    const v = String(s ?? "");
    return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  }
  function exportCSV(filename: string, rows: Array<Record<string, any>>) {
    if (!rows?.length) return;
    const headers = Object.keys(rows[0]);
    const body = rows
      .map((r) => headers.map((h) => csvEscape(r[h])).join(","))
      .join("\n");
    const csv = headers.join(",") + "\n" + body;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  const exportMovsCsv = () => {
    if (!current) return;
    const rows = [
      ...movExpenses.map((e) => ({
        fecha: new Date(e.ts).toLocaleString("es-CL"),
        tipo: "gasto",
        etiqueta: e.label || "Gasto",
        monto: e.amount || 0,
      })),
      ...(movWithdrawals
        ? [
            {
              fecha: new Date(current.openedAt).toLocaleString("es-CL"),
              tipo: "retiro",
              etiqueta: "Retiros (acumulado)",
              monto: movWithdrawals,
            },
          ]
        : []),
      ...(movTips
        ? [
            {
              fecha: new Date(current.openedAt).toLocaleString("es-CL"),
              tipo: "propina",
              etiqueta: "Propinas cash (acum.)",
              monto: movTips,
            },
          ]
        : []),
    ].sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
    exportCSV(`movimientos-turno-${Date.now()}.csv`, rows);
  };

  const printHistoryAsPdf = () => {
    const html = buildHistoryHtml(sessions);
    const w = window.open("", "_blank", "width=720,height=900");
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  return (
    <KioskModal
      open={open}
      onClose={onClose}
      title="Turno de Caja"
      subtitle="Ver turno • Cerrar • Historial"
      designWidth={980}
      designHeight={760}
    >
      <div className="grid md:grid-cols-12 gap-3 text-[13px]">
        {/* === Estado actual + Cierre === */}
        <div className="md:col-span-5 space-y-3">
          {/* Estado */}
          <div className="border rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Wallet size={18} className="text-rose-600" />
              <div className="font-semibold">Estado actual</div>
            </div>
            {current ? (
              <div className="mt-2 space-y-1">
                <Row label="Abierto por" value={current?.openedBy || "—"} />
                <Row
                  label="Apertura"
                  value={`$${CLP(current?.ops?.openingCash || 0)}`}
                />
                <Row
                  label="Inicio"
                  value={new Date(current.openedAt).toLocaleString("es-CL")}
                />
                <Row
                  label="Efectivo esperado"
                  value={<b className="text-rose-600">${CLP(expectedCash)}</b>}
                />
              </div>
            ) : (
              <div className="mt-2 text-gray-600">
                No hay turno abierto. Usa el botón “Abrir turno” del panel
                principal para iniciar.
              </div>
            )}
          </div>

          {/* Cierre */}
          <div className="border rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Lock size={18} className="text-rose-600" />
              <div className="font-semibold">Cerrar turno</div>
            </div>
            <div className="mt-2 grid sm:grid-cols-2 gap-2">
              <div>
                <div className="text-xs text-gray-600 mb-1">
                  Efectivo contado
                </div>
                <div className="flex items-center gap-2">
                  <Coins size={16} className="text-amber-600" />
                  <input
                    className="w-full border rounded-md px-3 py-2"
                    inputMode="numeric"
                    placeholder="$"
                    value={countedCash}
                    onChange={(e) => setCountedCash(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">Diferencia</div>
                <div
                  className={`px-3 py-2 border rounded-md ${
                    diff === 0
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : diff > 0
                      ? "bg-amber-50 border-amber-200 text-amber-700"
                      : "bg-red-50 border-red-200 text-red-700"
                  }`}
                >
                  {diff > 0 ? "+" : ""}${CLP(diff)}
                </div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-xs text-gray-600 mb-1">Nota de cierre</div>
                <textarea
                  rows={3}
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="Observaciones…"
                  value={closingNote}
                  onChange={(e) => setClosingNote(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <button
                disabled={!current}
                onClick={() =>
                  current &&
                  printCloseReport80mm(current, expectedCash, contado, diff)
                }
                className={`flex-1 px-3 py-2 rounded-md border ${
                  current ? "hover:bg-gray-50" : "cursor-not-allowed opacity-50"
                }`}
              >
                <Printer size={16} className="inline mr-1" /> Vista previa /
                Imprimir (80mm)
              </button>
              <button
                disabled={!current}
                onClick={handleClose}
                className={`flex-1 px-3 py-2 rounded-md text-white ${
                  current
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
              >
                Cerrar turno
              </button>
            </div>
          </div>
        </div>

        {/* === Movimientos + Historial === */}
        <div className="md:col-span-7 space-y-3">
          {/* Movimientos del turno */}
          <div className="border rounded-lg p-3">
            <div className="flex items-center gap-2">
              <HistoryIcon size={18} className="text-gray-700" />
              <div className="font-semibold">Movimientos del turno</div>
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={exportMovsCsv}
                  disabled={!current}
                  className={`px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50 ${
                    current ? "" : "opacity-50 cursor-not-allowed"
                  }`}
                  title="Exportar CSV"
                >
                  <Download size={14} className="inline mr-1" />
                  CSV
                </button>
              </div>
            </div>

            {!current ? (
              <div className="mt-2 text-gray-600 text-sm">
                — Abre un turno para ver movimientos.
              </div>
            ) : (
              <>
                {/* Totales rápidos */}
                <div className="grid sm:grid-cols-3 gap-2 mt-2">
                  <Mini label="Gastos" value={`$${CLP(sumExpenses(movExpenses))}`} icon={<MinusCircle size={14} />} />
                  <Mini label="Retiros" value={`$${CLP(movWithdrawals)}`} icon={<DollarSign size={14} />} />
                  <Mini label="Propinas (cash)" value={`$${CLP(movTips)}`} icon={<HandCoins size={14} />} />
                </div>

                {/* Ventas por método */}
                <div className="mt-3">
                  <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                    <PieChart size={12} /> Ventas por método
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {[
                      "EFECTIVO_SISTEMA",
                      "DEBITO_SISTEMA",
                      "CREDITO_SISTEMA",
                      "POS_DEBITO",
                      "POS_CREDITO",
                      "TRANSFERENCIA",
                      "MERCADO_PAGO",
                    ].map((k) => (
                      <div
                        key={k}
                        className="px-3 py-2 bg-gray-50 rounded border text-sm flex items-center justify-between"
                      >
                        <span className="text-gray-600">
                          {k.replace(/_/g, " ")}
                        </span>
                        <span className="font-semibold">
                          ${CLP((byMethod as any)[k] || 0)}
                        </span>
                      </div>
                    ))}
                    <div className="px-3 py-2 bg-white rounded border text-sm flex items-center justify-between">
                      <span className="font-semibold">Ventas total</span>
                      <span className="font-extrabold text-rose-600">
                        ${CLP(ventasTotal)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Lista de gastos (últimos) */}
                <div className="mt-3">
                  <div className="text-xs text-gray-600 mb-1">Últimos gastos</div>
                  <div className="max-h-44 overflow-auto border rounded">
                    {movExpenses.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-gray-500">—</div>
                    ) : (
                      movExpenses
                        .slice(-20)
                        .reverse()
                        .map((e, i) => (
                          <div
                            key={i}
                            className="grid grid-cols-[120px_1fr_100px] px-3 py-1.5 text-sm border-t first:border-t-0"
                          >
                            <div className="text-gray-500">
                              {new Date(e.ts).toLocaleString("es-CL", {
                                dateStyle: "short",
                                timeStyle: "short",
                              })}
                            </div>
                            <div className="truncate">{e.label || "Gasto"}</div>
                            <div className="text-right font-medium">
                              ${CLP(e.amount)}
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Historial de turnos */}
          <div className="border rounded-lg p-3">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-gray-600" />
              <div className="font-semibold">Historial (últimos turnos)</div>
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => printHistoryAsPdf()}
                  className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50"
                  title="Imprimir / PDF"
                >
                  <Printer size={14} className="inline mr-1" /> Imprimir
                </button>
                <button
                  onClick={() => printHistoryAsPdf()}
                  className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50"
                  title="Guardar como PDF"
                >
                  PDF
                </button>
              </div>
            </div>

            {sessions.length === 0 ? (
              <div className="mt-2 text-gray-600 text-sm">—</div>
            ) : (
              <div className="mt-2 divide-y text-sm">
                {sessions.slice(0, 8).map((s) => (
                  <div key={s.id} className="py-2 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="font-medium">
                        {s.openedBy || "Cajero"} — ${CLP(s?.ops?.openingCash || 0)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(s.openedAt).toLocaleString("es-CL")}{" "}
                        {s.closedAt
                          ? `• Cerrado: ${new Date(s.closedAt).toLocaleString("es-CL")}`
                          : "• Abierto"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">
                        Ventas: ${CLP(s?.ops?.salesRuntime?.total || 0)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Gastos: $
                        {CLP(
                          (s?.ops?.expenses || []).reduce(
                            (a: number, b: any) => a + (b?.amount || 0),
                            0
                          )
                        )}
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

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({
  label,
  value,
}) => (
  <div className="flex items-center justify-between">
    <span className="text-gray-600">{label}</span>
    <span className="font-semibold">{value}</span>
  </div>
);

const Mini: React.FC<{ label: string; value: string; icon?: React.ReactNode }> =
  ({ label, value, icon }) => (
    <div className="px-3 py-2 bg-gray-50 rounded border text-sm flex items-center justify-between">
      <span className="text-gray-600 flex items-center gap-1">
        {icon}
        {label}
      </span>
      <span className="font-semibold">{value}</span>
    </div>
  );

function sumExpenses(arr: Array<{ amount: number }>) {
  return (arr || []).reduce((a, b) => a + (b?.amount || 0), 0);
}

/* ====== Close Report 80mm ====== */
function printCloseReport80mm(
  s: CashSession,
  expected: number,
  counted = 0,
  diff = 0
) {
  const fechaApertura = new Date(s.openedAt).toLocaleString("es-CL");
  const fechaCierre = new Date(s.closedAt || Date.now()).toLocaleString(
    "es-CL"
  );
  const gastos = (s.ops.expenses || []).reduce(
    (a, b) => a + (b?.amount || 0),
    0
  );
  const retiros = s.ops.withdrawals || 0;
  const propinas = s.ops.tips?.cashTips || 0;
  const apert = s.ops.openingCash || 0;
  const ventasPorMetodo = s.ops.salesRuntime.byMethod || {};
  const ventasTotal = s.ops.salesRuntime.total || 0;
  const eboletaAmount = s.ops.fiscal?.eboletaAmount || 0;
  const eboletaCount = s.ops.fiscal?.eboletaCount || 0;

  const ventaLine = (k: string) => {
    const v = (ventasPorMetodo as any)[k] || 0;
    return v
      ? `<tr><td>${k.replace("_", " ")}</td><td style="text-align:right">$${CLP(
          v
        )}</td></tr>`
      : "";
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
    <tr class="tot"><td>Ventas total</td><td style="text-align:right">$${CLP(
      ventasTotal
    )}</td></tr>
    <tr><td>Propinas (cash)</td><td style="text-align:right">$${CLP(
      propinas
    )}</td></tr>
    <tr><td>Gastos</td><td style="text-align:right">-$${CLP(gastos)}</td></tr>
    <tr><td>Retiros</td><td style="text-align:right">-$${CLP(retiros)}</td></tr>
    <tr class="tot"><td>Efectivo esperado</td><td style="text-align:right">$${CLP(
      expected
    )}</td></tr>
    <tr><td>Contado</td><td style="text-align:right"><b>$${CLP(
      counted
    )}</b></td></tr>
    <tr><td>Diferencia</td><td style="text-align:right"><b>$${CLP(
      diff
    )}</b></td></tr>
  </table>
  <hr/>
  <table>
    <tr><td>E-Boletas (monto)</td><td style="text-align:right">$${CLP(
      eboletaAmount
    )}</td></tr>
    <tr><td>E-Boletas (unid.)</td><td style="text-align:right">${CLP(
      eboletaCount
    )}</td></tr>
  </table>
  <hr/>
  <div class="muted">Últimos gastos</div>
  <table>
    ${
      lastExpenses.length
        ? lastExpenses
            .map(
              (e) =>
                `<tr><td>${new Date(e.ts).toLocaleTimeString("es-CL",{hour:"2-digit",minute:"2-digit"})} ${
                  e.label || "Gasto"
                }</td><td style="text-align:right">$${CLP(
                  e.amount
                )}</td></tr>`
            )
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
  w.document.open();
  w.document.write(html);
  w.document.close();
}

/* ====== Historial: HTML imprimible/PDF ====== */
function buildHistoryHtml(sessions: CashSession[]) {
  const rows = sessions.slice(0, 20).map((s) => {
    const gastos = (s.ops.expenses || []).reduce(
      (a: number, b: any) => a + (b?.amount || 0),
      0
    );
    const ventas = s?.ops?.salesRuntime?.total || 0;
    return `<tr>
      <td>${s.openedBy || "-"}</td>
      <td>$${CLP(s?.ops?.openingCash || 0)}</td>
      <td>${new Date(s.openedAt).toLocaleString("es-CL")}</td>
      <td>${s.closedAt ? new Date(s.closedAt).toLocaleString("es-CL") : "—"}</td>
      <td class="right">$${CLP(ventas)}</td>
      <td class="right">$${CLP(gastos)}</td>
    </tr>`;
  });

  return `<!doctype html>
<html>
<head><meta charset="utf-8"/>
<title>Historial de turnos</title>
<style>
  @page { margin: 20mm }
  body{ font-family: ui-sans-serif, system-ui; color:#111 }
  h1{ font-size:18px; margin:0 0 8px 0 }
  table{ width:100%; border-collapse: collapse; font-size:12px }
  th,td{ border:1px solid #ddd; padding:6px }
  th{ background:#f7f7f7; text-align:left }
  .right{ text-align:right }
  .muted{ color:#666; font-size:12px }
</style>
</head>
<body>
  <h1>Historial de turnos</h1>
  <div class="muted">Generado: ${new Date().toLocaleString("es-CL")}</div>
  <table style="margin-top:8px">
    <thead>
      <tr>
        <th>Cajero</th><th>Apertura</th><th>Inicio</th><th>Cierre</th><th class="right">Ventas</th><th class="right">Gastos</th>
      </tr>
    </thead>
    <tbody>
      ${rows.join("") || `<tr><td colspan="6" class="muted">Sin datos</td></tr>`}
    </tbody>
  </table>
  <script>window.print();</script>
</body>
</html>`;
}
