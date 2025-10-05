import React from "react";
import { useCashup } from "./cashupContext";

const CLP = (n: number) => new Intl.NumberFormat("es-CL").format(Math.max(0, Math.round(n)));

const Num = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) => (
  <input
    className="border rounded-md px-2 py-1 text-sm w-32"
    placeholder={placeholder}
    inputMode="numeric"
    value={value}
    onChange={(e) => onChange(e.target.value)}
  />
);

const Txt = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) => (
  <input className="border rounded-md px-2 py-1 text-sm w-56" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
);

export default function CashQuickPanel() {
  const cash = useCashup();

  const [gastoLabel, setGastoLabel] = React.useState("");
  const [gastoAmount, setGastoAmount] = React.useState("");

  const [retiroLabel, setRetiroLabel] = React.useState("");
  const [retiroAmount, setRetiroAmount] = React.useState("");

  const [tipAmount, setTipAmount] = React.useState("");

  if (!cash.current) {
    return (
      <div className="p-3 border rounded-lg bg-yellow-50 text-yellow-800 text-sm">
        Abre un turno para registrar movimientos.
      </div>
    );
  }

  const by = cash.current.ops.salesRuntime.byMethod || {};
  const totalVentas = cash.current.ops.salesRuntime.total || 0;
  const gastos = (cash.current.ops.expenses || []).reduce((a, e) => a + (e?.amount || 0), 0);
  const retiros = cash.current.ops.withdrawals || 0;
  const propinas = cash.current.ops.tips.cashTips || 0;
  const esperado = cash.getExpectedCash(cash.current);

  const toNum = (v: string) => Number(String(v).replace(/[^\d]/g, "")) || 0;

  return (
    <div className="border rounded-xl p-4 bg-white space-y-3">
      <div className="font-semibold text-gray-900">Movimientos rápidos</div>

      <div className="grid md:grid-cols-3 gap-3">
        {/* Gasto */}
        <div className="border rounded-lg p-3 bg-gray-50">
          <div className="text-sm font-medium mb-2">Gasto</div>
          <div className="flex items-center gap-2">
            <Txt value={gastoLabel} onChange={setGastoLabel} placeholder="Ej. Insumos" />
            <Num value={gastoAmount} onChange={setGastoAmount} placeholder="$" />
            <button
              className="px-3 py-1.5 text-sm bg-rose-600 text-white rounded-md hover:bg-rose-700"
              onClick={() => {
                cash.addExpense(gastoLabel || "Gasto", toNum(gastoAmount));
                setGastoLabel(""); setGastoAmount("");
              }}
            >
              Agregar
            </button>
          </div>
        </div>

        {/* Retiro */}
        <div className="border rounded-lg p-3 bg-gray-50">
          <div className="text-sm font-medium mb-2">Retiro</div>
          <div className="flex items-center gap-2">
            <Txt value={retiroLabel} onChange={setRetiroLabel} placeholder="Ej. Depósito" />
            <Num value={retiroAmount} onChange={setRetiroAmount} placeholder="$" />
            <button
              className="px-3 py-1.5 text-sm bg-rose-600 text-white rounded-md hover:bg-rose-700"
              onClick={() => {
                cash.addWithdrawal(toNum(retiroAmount), retiroLabel || "Retiro");
                setRetiroLabel(""); setRetiroAmount("");
              }}
            >
              Registrar
            </button>
          </div>
        </div>

        {/* Propina (cash) */}
        <div className="border rounded-lg p-3 bg-gray-50">
          <div className="text-sm font-medium mb-2">Propina (efectivo)</div>
          <div className="flex items-center gap-2">
            <Num value={tipAmount} onChange={setTipAmount} placeholder="$" />
            <button
              className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
              onClick={() => {
                cash.addCashTip(toNum(tipAmount));
                setTipAmount("");
              }}
            >
              Sumar
            </button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-3 pt-2">
        <div className="px-3 py-2 bg-gray-50 rounded border text-sm flex items-center justify-between">
          <span>Ventas totales</span>
          <b>${CLP(totalVentas)}</b>
        </div>
        <div className="px-3 py-2 bg-gray-50 rounded border text-sm flex items-center justify-between">
          <span>Gastos</span>
          <b>${CLP(gastos)}</b>
        </div>
        <div className="px-3 py-2 bg-gray-50 rounded border text-sm flex items-center justify-between">
          <span>Retiros</span>
          <b>${CLP(retiros)}</b>
        </div>
        <div className="px-3 py-2 bg-gray-50 rounded border text-sm flex items-center justify-between">
          <span>Efectivo esperado</span>
          <b>${CLP(esperado)}</b>
        </div>
      </div>

      <div className="text-xs text-gray-500">
        Ventas por método: EF ${CLP(by.EFECTIVO_SISTEMA || 0)} • DB ${CLP(by.DEBITO_SISTEMA || 0)} • CR ${CLP(by.CREDITO_SISTEMA || 0)} • POS-DB ${CLP(by.POS_DEBITO || 0)} • POS-CR ${CLP(by.POS_CREDITO || 0)} • TRF ${CLP(by.TRANSFERENCIA || 0)} • MP ${CLP(by.MERCADO_PAGO || 0)}
      </div>
    </div>
  );
}
