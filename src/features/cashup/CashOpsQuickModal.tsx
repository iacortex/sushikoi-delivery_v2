// src/features/cashup/CashOpsQuickModal.tsx
import React from "react";
import { useCashup } from "./cashupContext";
import {
  Wallet,
  MinusCircle,
  DollarSign,
  HandCoins,
  History,
  Filter,
  X,
  Search,
  Download,
  RotateCcw,
  Printer,
} from "lucide-react";

type Tab = "mov" | "hist";
type MovKind = "gasto" | "retiro" | "propina";

const CLP = (n: number) =>
  new Intl.NumberFormat("es-CL").format(Math.max(0, Math.round(n || 0)));
const toNum = (v: string) => Number(String(v).replace(/[^\d]/g, "")) || 0;

type Props = {
  open: boolean;
  onClose: () => void;
  currentUser?: string;
};

type HistRow = {
  id: string;
  ts: number;
  kind: MovKind;
  label: string;
  amount: number;
  by?: string;
};

/* ================= Helpers ================= */
function csvEscape(s: string) {
  const v = String(s ?? "");
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}
function exportCSV(filename: string, rows: Array<Record<string, any>>) {
  if (!rows || rows.length === 0) return;
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

function printMovement80mm(row: HistRow) {
  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Movimiento de Caja</title>
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
</style>
</head>
<body>
  <div class="center big">SUSHIKOI</div>
  <div class="center small">Movimiento de caja</div>
  <hr/>
  <table>
    <tr><td>Fecha</td><td class="right">${new Date(row.ts).toLocaleString("es-CL")}</td></tr>
    <tr><td>Tipo</td><td class="right">${row.kind.toUpperCase()}</td></tr>
    <tr><td>Monto</td><td class="right">$${CLP(row.amount)}</td></tr>
    <tr><td>Operador</td><td class="right">${row.by || "-"}</td></tr>
  </table>
  <hr/>
  <div class="small">${row.label || "-"}</div>
  <hr/>
  <div class="center small">Gracias • Sushikoi Puerto Montt</div>
  <script>window.print(); setTimeout(()=>window.close(), 400)</script>
</body>
</html>`;
  const w = window.open("", "_blank", "width=420,height=640");
  if (w) {
    w.document.open();
    w.document.write(html);
    w.document.close();
  }
}

/* ================= Component ================= */
export default function CashOpsQuickModal({
  open,
  onClose,
  currentUser,
}: Props) {
  const cashCtx = useCashup() as any;
  const cash = (cashCtx?.compat ? cashCtx.compat : cashCtx) as any;
  const current = cash?.current;

  const [tab, setTab] = React.useState<Tab>("mov");
  const [subTab, setSubTab] = React.useState<MovKind>("gasto");

  // form state
  const [operator, setOperator] = React.useState<string>(
    currentUser || "Cajero"
  );

  const [gLabel, setGLabel] = React.useState("Compra insumos");
  const [gAmount, setGAmount] = React.useState<string>("");

  const [wLabel, setWLabel] = React.useState("Retiro gerente");
  const [wAmount, setWAmount] = React.useState<string>("");

  const [tAmount, setTAmount] = React.useState<string>("");

  // focus
  const amountRef = React.useRef<HTMLInputElement | null>(null);

  // undo stack (sólo el último)
  const undoRef = React.useRef<HistRow | null>(null);

  // historial local (unido a ops para consulta rápida)
  const hist = React.useMemo<HistRow[]>(() => {
    const list: HistRow[] = [];
    const s = current;
    if (!s) return list;
    const by = s?.openedBy || "Cajero";

    (s.ops?.expenses || []).forEach((e: any) =>
      list.push({
        id: `g${e.ts}`,
        ts: e.ts,
        kind: "gasto",
        label: e.label || "Gasto",
        amount: e.amount || 0,
        by: e.by || by,
      })
    );
    if (s.ops?.withdrawals) {
      // withdrawals no trae desglose, generamos 1 item sintético
      list.push({
        id: `w${s.openedAt}`,
        ts: s.openedAt,
        kind: "retiro",
        label: "Retiros (acumulado)",
        amount: s.ops.withdrawals,
        by,
      });
    }
    if (s.ops?.tips?.cashTips) {
      list.push({
        id: `t${s.openedAt}`,
        ts: s.openedAt,
        kind: "propina",
        label: "Propinas cash (acum.)",
        amount: s.ops.tips.cashTips,
        by,
      });
    }
    return list.sort((a, b) => b.ts - a.ts);
  }, [current]);

  // filtros del historial
  const [q, setQ] = React.useState("");
  const [flt, setFlt] = React.useState<MovKind | "all">("all");

  const histFiltered = React.useMemo(() => {
    const qq = q.trim().toLowerCase();
    return hist.filter((r) => {
      if (flt !== "all" && r.kind !== flt) return false;
      if (!qq) return true;
      return (
        String(r.label || "").toLowerCase().includes(qq) ||
        String(r.by || "").toLowerCase().includes(qq)
      );
    });
  }, [hist, q, flt]);

  // totales por tipo del historial filtrado
  const totals = React.useMemo(() => {
    const out = { gasto: 0, retiro: 0, propina: 0, total: 0 } as Record<
      "gasto" | "retiro" | "propina" | "total",
      number
    >;
    histFiltered.forEach((r) => {
      out[r.kind] += r.amount || 0;
      out.total += r.amount || 0;
    });
    return out;
  }, [histFiltered]);

  React.useEffect(() => {
    if (!open) return;
    // reset
    setTab("mov");
    setSubTab("gasto");
    setOperator(currentUser || "Cajero");
    setGLabel("Compra insumos");
    setGAmount("");
    setWLabel("Retiro gerente");
    setWAmount("");
    setTAmount("");
    setQ("");
    setFlt("all");
    // autofocus monto
    setTimeout(() => amountRef.current?.focus(), 50);
  }, [open, currentUser]);

  // submit con Enter
  React.useEffect(() => {
    if (!open || tab !== "mov") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, tab, subTab, gAmount, wAmount, tAmount, gLabel, operator]);

  if (!open) return null;

  const quicks =
    subTab === "propina"
      ? [500, 1000, 2000, 3000, 5000]
      : [1000, 2000, 5000, 10000, 20000, 50000];

  const addQuick = (setter: (s: string) => void, prev: string, n: number) =>
    setter(String(toNum(prev) + n));

  const amountByTab =
    subTab === "gasto"
      ? toNum(gAmount)
      : subTab === "retiro"
      ? toNum(wAmount)
      : toNum(tAmount);

  const canSubmit =
    (subTab === "gasto" && amountByTab > 0 && !!gLabel.trim()) ||
    (subTab !== "gasto" && amountByTab > 0);

  const withBy = (label: string) =>
    operator ? `${label} — por ${operator}` : label;

  const handleSubmit = () => {
    try {
      if (!current) {
        alert("No hay turno abierto.");
        return;
      }
      let row: HistRow | null = null;

      if (subTab === "gasto") {
        const amount = toNum(gAmount);
        cash?.addExpense?.({ amount, label: withBy(gLabel), by: operator });
        row = {
          id: String(Date.now()),
          ts: Date.now(),
          kind: "gasto",
          amount,
          label: withBy(gLabel),
          by: operator,
        };
      } else if (subTab === "retiro") {
        const amount = toNum(wAmount);
        cash?.addWithdrawal?.(amount, withBy(wLabel), { by: operator });
        row = {
          id: String(Date.now()),
          ts: Date.now(),
          kind: "retiro",
          amount,
          label: withBy(wLabel),
          by: operator,
        };
      } else {
        const amount = toNum(tAmount);
        cash?.addCashTip?.(amount, { by: operator });
        row = {
          id: String(Date.now()),
          ts: Date.now(),
          kind: "propina",
          amount,
          label: "Propina (cash)",
          by: operator,
        };
      }

      undoRef.current = row;

      // reset de monto y foco
      if (subTab === "gasto") setGAmount("");
      if (subTab === "retiro") setWAmount("");
      if (subTab === "propina") setTAmount("");
      setTimeout(() => amountRef.current?.focus(), 50);

      // tick para forzar recompute
      setTimeout(() => cash?.recompute?.(), 0);
    } catch (e) {
      console.error("cash op error", e);
      alert("No se pudo registrar el movimiento.");
    }
  };

  const handleUndo = () => {
    const last = undoRef.current;
    if (!current || !last) return;
    // “Reversa” simple (sumar inverso)
    if (last.kind === "gasto") {
      cash?.addExpense?.({ amount: -Math.abs(last.amount), label: `[UNDO] ${last.label}`, by: last.by });
    } else if (last.kind === "retiro") {
      cash?.addWithdrawal?.(-Math.abs(last.amount), `[UNDO] ${last.label}`, { by: last.by });
    } else {
      cash?.addCashTip?.(-Math.abs(last.amount), { by: last.by });
    }
    undoRef.current = null;
    setTimeout(() => cash?.recompute?.(), 0);
  };

  /* ================== UI ================== */
  return (
    <div className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center p-3">
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet size={18} className="text-rose-600" />
            <div>
              <div className="font-semibold">Caja: Gastos / Retiros / Propinas</div>
              <div className="text-xs text-gray-500">
                Turno {current ? "abierto" : "cerrado"} •{" "}
                {current
                  ? new Date(current.openedAt).toLocaleString("es-CL")
                  : "abra un turno para operar"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              className={`px-3 py-1.5 text-sm rounded-md border ${
                undoRef.current
                  ? "hover:bg-gray-50"
                  : "opacity-50 cursor-not-allowed"
              }`}
              onClick={handleUndo}
              disabled={!undoRef.current}
              title="Deshacer último movimiento"
            >
              <RotateCcw size={14} className="inline mr-1" />
              Deshacer
            </button>
            <button
              className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50"
              onClick={onClose}
            >
              Cerrar
            </button>
          </div>
        </div>

        {/* Tabs nivel 1 */}
        <div className="px-3 pt-2 flex items-center gap-2 border-b bg-gray-50">
          <PrimaryTab
            active={tab === "mov"}
            onClick={() => setTab("mov")}
            icon={<HandCoins size={14} />}
            label="Registrar movimiento"
          />
          <PrimaryTab
            active={tab === "hist"}
            onClick={() => setTab("hist")}
            icon={<History size={14} />}
            label="Historial del turno"
          />
        </div>

        {/* Body */}
        {tab === "mov" ? (
          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Subtabs (tipo movimiento) */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-2">
                <SubTab
                  active={subTab === "gasto"}
                  onClick={() => {
                    setSubTab("gasto");
                    setTimeout(() => amountRef.current?.focus(), 50);
                  }}
                  icon={<MinusCircle size={14} />}
                  label="Gasto"
                />
                <SubTab
                  active={subTab === "retiro"}
                  onClick={() => {
                    setSubTab("retiro");
                    setTimeout(() => amountRef.current?.focus(), 50);
                  }}
                  icon={<DollarSign size={14} />}
                  label="Retiro"
                />
                <SubTab
                  active={subTab === "propina"}
                  onClick={() => {
                    setSubTab("propina");
                    setTimeout(() => amountRef.current?.focus(), 50);
                  }}
                  icon={<HandCoins size={14} />}
                  label="Propina (cash)"
                />
              </div>

              {/* Responsable */}
              <div>
                <div className="text-xs text-gray-600 mb-1">Responsable</div>
                <input
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  placeholder="Nombre del cajero"
                  list="cashiers_list"
                />
                <datalist id="cashiers_list">
                  <option value="Camila Yáñez" />
                  <option value="Francisco Ponce" />
                  <option value="Paola Finol" />
                </datalist>
              </div>

              {/* Form por tipo */}
              {subTab === "gasto" && (
                <>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">
                      Motivo / etiqueta
                    </div>
                    <input
                      className="w-full border rounded-md px-3 py-2 text-sm"
                      value={gLabel}
                      onChange={(e) => setGLabel(e.target.value)}
                      placeholder="Ej.: Compra insumos"
                    />
                  </div>
                  <AmountInput
                    label="Monto"
                    value={gAmount}
                    onChange={setGAmount}
                    quicks={[1000, 2000, 5000, 10000, 20000, 50000]}
                    inputRef={amountRef}
                  />
                </>
              )}

              {subTab === "retiro" && (
                <>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">
                      Referencia (opcional)
                    </div>
                    <input
                      className="w-full border rounded-md px-3 py-2 text-sm"
                      value={wLabel}
                      onChange={(e) => setWLabel(e.target.value)}
                      placeholder="Ej.: Retiro gerente"
                    />
                  </div>
                  <AmountInput
                    label="Monto"
                    value={wAmount}
                    onChange={setWAmount}
                    quicks={[1000, 2000, 5000, 10000, 20000, 50000]}
                    inputRef={amountRef}
                  />
                </>
              )}

              {subTab === "propina" && (
                <AmountInput
                  label="Monto"
                  value={tAmount}
                  onChange={setTAmount}
                  quicks={[500, 1000, 2000, 3000, 5000]}
                  inputRef={amountRef}
                />
              )}
            </div>

            {/* Resumen */}
            <div className="md:col-span-1">
              <div className="border rounded-lg p-3 bg-gray-50">
                <div className="text-sm font-semibold mb-2">Resumen</div>
                <Row label="Responsable" value={operator || "—"} />
                {subTab === "gasto" && (
                  <>
                    <Row label="Tipo" value="Gasto" />
                    <Row label="Motivo" value={gLabel || "—"} />
                    <Row label="Monto" value={`$${CLP(toNum(gAmount))}`} />
                  </>
                )}
                {subTab === "retiro" && (
                  <>
                    <Row label="Tipo" value="Retiro" />
                    <Row label="Ref." value={wLabel || "—"} />
                    <Row label="Monto" value={`$${CLP(toNum(wAmount))}`} />
                  </>
                )}
                {subTab === "propina" && (
                  <>
                    <Row label="Tipo" value="Propina (cash)" />
                    <Row label="Monto" value={`$${CLP(toNum(tAmount))}`} />
                  </>
                )}

                <button
                  disabled={!canSubmit}
                  onClick={handleSubmit}
                  className={`mt-3 w-full px-3 py-2 rounded-md text-white ${
                    canSubmit
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-gray-300 cursor-not-allowed"
                  }`}
                  title="Enter para registrar"
                >
                  Registrar
                </button>
              </div>

              {/* Últimos gastos cortos */}
              <div className="mt-3 border rounded-lg p-3">
                <div className="text-sm font-semibold mb-2">
                  Últimos gastos
                </div>
                {current?.ops?.expenses?.length ? (
                  <div className="space-y-1 max-h-40 overflow-auto pr-1">
                    {[...current.ops.expenses]
                      .slice(-6)
                      .reverse()
                      .map((e: any, i: number) => (
                        <div
                          key={i}
                          className="flex justify-between text-xs"
                          title={new Date(e.ts).toLocaleString("es-CL")}
                        >
                          <span className="text-gray-600 truncate">
                            {e.label || "Gasto"}
                          </span>
                          <span className="font-medium">
                            ${CLP(e.amount)}
                          </span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">—</div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ======= HISTORIAL ======= */
          <div className="p-4">
            {/* Filtros */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <Filter size={14} />
                Filtros:
              </span>
              <Chip
                label="Todos"
                active={flt === "all"}
                onClick={() => setFlt("all")}
              />
              <Chip
                label="Gastos"
                active={flt === "gasto"}
                onClick={() => setFlt("gasto")}
              />
              <Chip
                label="Retiros"
                active={flt === "retiro"}
                onClick={() => setFlt("retiro")}
              />
              <Chip
                label="Propinas"
                active={flt === "propina"}
                onClick={() => setFlt("propina")}
              />
              <div className="ml-auto flex items-center gap-2">
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-2 top-2.5 text-gray-400"
                  />
                  <input
                    className="pl-7 pr-8 py-2 border rounded-md text-sm w-[220px]"
                    placeholder="Buscar etiqueta / operador…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                  {q && (
                    <button
                      className="absolute right-1.5 top-1.5 p-1 rounded hover:bg-gray-100"
                      onClick={() => setQ("")}
                      title="Limpiar"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <button
                  onClick={() =>
                    exportCSV(
                      `historial-caja-${Date.now()}.csv`,
                      histFiltered.map((r) => ({
                        fecha: new Date(r.ts).toLocaleString("es-CL"),
                        tipo: r.kind,
                        etiqueta: r.label,
                        monto: r.amount,
                        operador: r.by || "",
                      }))
                    )
                  }
                  className="px-3 py-2 text-sm border rounded-md hover:bg-gray-50"
                >
                  <Download size={14} className="inline mr-1" /> Exportar CSV
                </button>
              </div>
            </div>

            {/* Totales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
              <MiniStat label="Gastos" value={`$${CLP(totals.gasto)}`} />
              <MiniStat label="Retiros" value={`$${CLP(totals.retiro)}`} />
              <MiniStat label="Propinas (cash)" value={`$${CLP(totals.propina)}`} />
              <MiniStat label="Total" value={`$${CLP(totals.total)}`} />
            </div>

            {/* Tabla */}
            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-[120px_110px_1fr_120px_90px] bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600">
                <div>Fecha</div>
                <div>Tipo</div>
                <div>Etiqueta</div>
                <div className="text-right">Monto</div>
                <div className="text-right pr-2">Acciones</div>
              </div>
              <div className="max-h-[48vh] overflow-auto">
                {histFiltered.length === 0 ? (
                  <div className="px-3 py-6 text-sm text-gray-500">
                    No hay resultados con el filtro actual.
                  </div>
                ) : (
                  histFiltered.map((r) => (
                    <div
                      key={r.id}
                      className="grid grid-cols-[120px_110px_1fr_120px_90px] px-3 py-2 text-sm border-t"
                    >
                      <div className="text-gray-600">
                        {new Date(r.ts).toLocaleString("es-CL", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </div>
                      <div className="uppercase text-gray-700">{r.kind}</div>
                      <div className="truncate">{r.label}</div>
                      <div className="text-right font-medium">
                        ${CLP(r.amount)}
                      </div>
                      <div className="text-right">
                        <button
                          className="px-2 py-1 text-xs border rounded hover:bg-gray-50"
                          onClick={() => printMovement80mm(r)}
                          title="Imprimir 80mm"
                        >
                          <Printer size={12} className="inline mr-1" />
                          Ticket
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ====================== UI bits ====================== */
const Row: React.FC<{ label: string; value: React.ReactNode }> = ({
  label,
  value,
}) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-gray-600">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);

const PrimaryTab: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`px-3 py-2 rounded-md text-sm border ${
      active
        ? "bg-white border-gray-300"
        : "bg-gray-100 border-transparent hover:bg-gray-200"
    }`}
  >
    <span className="flex items-center gap-2">
      {icon}
      {label}
    </span>
  </button>
);

const SubTab: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-md border text-sm ${
      active
        ? "bg-rose-50 border-rose-300 text-rose-700"
        : "bg-white border-gray-300 text-gray-700"
    }`}
  >
    <span className="flex items-center gap-1">
      {icon}
      {label}
    </span>
  </button>
);

const Chip: React.FC<{ label: string; active?: boolean; onClick: () => void }> =
  ({ label, active, onClick }) => (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-full text-xs border ${
        active ? "bg-rose-50 border-rose-300 text-rose-700" : "hover:bg-gray-100"
      }`}
    >
      {label}
    </button>
  );

const MiniStat: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <div className="px-3 py-2 bg-gray-50 rounded border text-sm flex items-center justify-between">
    <span className="text-gray-600">{label}</span>
    <span className="font-semibold">{value}</span>
  </div>
);

const AmountInput: React.FC<{
  label: string;
  value: string;
  onChange: (s: string) => void;
  quicks: number[];
  inputRef?: React.RefObject<HTMLInputElement>;
}> = ({ label, value, onChange, quicks, inputRef }) => (
  <div>
    <div className="text-xs text-gray-600 mb-1">{label}</div>
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        className="flex-1 border rounded-md px-3 py-2 text-sm"
        inputMode="numeric"
        placeholder="$"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="hidden sm:flex items-center gap-1">
        {quicks.map((q) => (
          <button
            key={q}
            onClick={() => onChange(String(toNum(value) + q))}
            className="px-2 py-1 text-xs border rounded-md hover:bg-gray-50"
          >
            +{CLP(q)}
          </button>
        ))}
      </div>
    </div>
  </div>
);
