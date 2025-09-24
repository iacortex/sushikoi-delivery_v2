import React from "react";
import { Wallet, Lock, LockOpen, Printer } from "lucide-react";
import { useCashup } from "./cashupContext";
import CloseReport80mm from "./CloseReport80mm";

const fmt = (n: number) => new Intl.NumberFormat("es-CL").format(Math.round(n || 0));
const CASHIERS = ["Camila Guzmán", "Francisco Kuchel", "Otro"];

/** lecturas seguras de propiedades con nombres variables */
const pick = <T,>(obj: any, keys: string[], fallback: T): T =>
  keys.find((k) => obj && typeof obj[k] !== "undefined")
    ? (obj[keys.find((k) => obj && typeof obj[k] !== "undefined")!] as T)
    : fallback;

/** cálculo por defecto del efectivo esperado si el contexto no lo implementa */
const fallbackExpectedCash = (current: any) => {
  const BASE = 45000; // fondo fijo
  const efectivoSistema = current?.ops?.salesRuntime?.byMethod?.EFECTIVO_SISTEMA ?? 0;
  const tips = current?.ops?.tips?.cashTips ?? 0;
  const gastos = (current?.ops?.expenses ?? []).reduce(
    (a: number, e: any) => a + (e?.amount || 0),
    0
  );
  const retiros = current?.ops?.withdrawals ?? 0;
  return BASE + efectivoSistema + tips - gastos - retiros;
};

const CashDrawerControl: React.FC = () => {
  // Usamos any para tolerar contextos sin métodos tipados
  const cash: any = useCashup();

  // métodos (si no existen, se quedan como undefined)
  const openSession =
    cash?.openSession || cash?.openShift || cash?.open || undefined;
  const closeSession =
    cash?.closeSession || cash?.closeShift || cash?.close || undefined;
  const getExpectedCash =
    cash?.getExpectedCash || ((cur: any) => fallbackExpectedCash(cur));
  const listSessions =
    cash?.listSessions || cash?.getSessions || (() => []);

  const current = cash?.current;
  const isOpen = !!current;

  const [name, setName] = React.useState<string>(CASHIERS[0]);
  const [nameOther, setNameOther] = React.useState<string>("");
  const [counted, setCounted] = React.useState<string>("");
  const [closedForPrint, setClosedForPrint] = React.useState<any | null>(null);

  const expected = getExpectedCash(current);

  const lastClosed = React.useMemo(
    () =>
      (listSessions() || [])
        .filter((s: any) => s?.status === "CLOSED")
        .slice(0, 5),
    // reevalúa cuando cambia el turno; evitamos depender de la función
    [current]
  );

  const resolveName = () =>
    name === "Otro" ? (nameOther.trim() || "Cajero") : name;

  const handleOpen = () => {
    if (typeof openSession === "function") {
      openSession(resolveName());
    } else {
      console.warn("[CashDrawerControl] openSession no implementado en cashupContext");
    }
  };

  const handleClose = () => {
    const c = Number(String(counted).replace(/[^\d]/g, "")) || 0;
    if (!isOpen) return;
    if (typeof closeSession === "function") {
      const closed = closeSession(c);
      if (closed) setClosedForPrint(closed);
    } else {
      console.warn("[CashDrawerControl] closeSession no implementado en cashupContext");
    }
    setCounted("");
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Wallet size={18} className="text-rose-600" />
          <h3 className="font-semibold text-gray-900">Caja</h3>
        </div>
        <div className="text-sm">
          {isOpen ? (
            <span className="inline-flex items-center gap-2 px-2 py-1 rounded bg-green-50 text-green-700 border border-green-200">
              <LockOpen size={14} /> Abierta — {current?.open?.cashierName || "Cajero"}
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 px-2 py-1 rounded bg-gray-50 text-gray-700 border">
              <Lock size={14} /> Cerrada
            </span>
          )}
        </div>
      </div>

      {!isOpen ? (
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <label className="text-sm text-gray-700">Cajero</label>
            <select className="input" value={name} onChange={(e) => setName(e.target.value)}>
              {CASHIERS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          {name === "Otro" && (
            <div>
              <label className="text-sm text-gray-700">Nombre</label>
              <input
                className="input"
                value={nameOther}
                onChange={(e) => setNameOther(e.target.value)}
              />
            </div>
          )}
          <div className="flex items-end">
            <button onClick={handleOpen} className="w-full btn-primary">
              Abrir turno
            </button>
          </div>
          <div className="md:col-span-3 text-xs text-gray-500">
            Fondo fijo al abrir: <b>$45.000</b>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-4 gap-3 items-end">
          <div>
            <div className="text-sm text-gray-700">Efectivo esperado</div>
            <div className="text-xl font-bold">${fmt(expected)}</div>
            <div className="text-xs text-gray-500">Incluye fondo fijo ($45.000)</div>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-gray-700">Efectivo contado</label>
            <input
              className="input"
              placeholder="$"
              inputMode="numeric"
              value={counted}
              onChange={(e) => setCounted(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleClose} className="btn-danger w-full">
              <Lock size={16} /> Cerrar turno
            </button>
          </div>

          {lastClosed.length > 0 && (
            <div className="md:col-span-4 mt-2">
              <div className="text-sm font-medium mb-1">Últimos cierres</div>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600">
                      <th className="py-1">Fecha</th>
                      <th className="py-1">Cajero</th>
                      <th className="py-1">Esperado</th>
                      <th className="py-1">Contado</th>
                      <th className="py-1">Dif.</th>
                      <th className="py-1"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lastClosed.map((s: any) => {
                      const close = s?.close || {};
                      const expectedCash = pick<number>(close, ["expectedCash", "expected", "expected_amount"], 0);
                      const countedCash = pick<number>(close, ["countedCash", "counted", "cash_counted"], 0);
                      const diff =
                        typeof close.cashDiff !== "undefined"
                          ? close.cashDiff
                          : countedCash - expectedCash;

                      return (
                        <tr key={s.id || String(close.closedAt || Math.random())} className="border-t">
                          <td className="py-1">
                            {new Date(close.closedAt || 0).toLocaleString("es-CL")}
                          </td>
                          <td className="py-1">{s?.open?.cashierName || "Cajero"}</td>
                          <td className="py-1">${fmt(expectedCash)}</td>
                          <td className="py-1">${fmt(countedCash)}</td>
                          <td
                            className={`py-1 ${
                              diff === 0 ? "" : diff > 0 ? "text-green-700" : "text-red-700"
                            }`}
                          >
                            ${fmt(diff)}
                          </td>
                          <td className="py-1">
                            <button
                              onClick={() => setClosedForPrint(s)}
                              className="btn-light px-2 py-1 inline-flex items-center gap-1"
                            >
                              <Printer size={14} /> Ver/Imprimir
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {closedForPrint && (
        <CloseReport80mm session={closedForPrint} onClose={() => setClosedForPrint(null)} />
      )}
    </div>
  );
};

export default CashDrawerControl;
