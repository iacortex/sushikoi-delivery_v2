// src/features/cashup/CashupBar.tsx
import React from "react";
import { Wallet, PlusCircle, MinusCircle, HandCoins, ReceiptText } from "lucide-react";
import ExpenseModal from "./ExpenseModal";
import { useCashup } from "./cashupContext";

const fmt = (n: number) => new Intl.NumberFormat("es-CL").format(Math.round(n || 0));

const CashupBar: React.FC = () => {
  const cash: any = useCashup();

  // estado para abrir/cerrar el modal
  const [showModal, setShowModal] = React.useState(false);

  // datos mínimos para mostrar algo útil
  const current = cash?.current;
  const getExpectedCash =
    cash?.getExpectedCash ||
    ((cur: any) => {
      const BASE = 45000;
      const efectivoSistema = cur?.ops?.salesRuntime?.byMethod?.EFECTIVO_SISTEMA ?? 0;
      const tips = cur?.ops?.tips?.cashTips ?? 0;
      const gastos = (cur?.ops?.expenses ?? []).reduce((a: number, e: any) => a + (e?.amount || 0), 0);
      const retiros = cur?.ops?.withdrawals ?? 0;
      return BASE + efectivoSistema + tips - gastos - retiros;
    });

  const expected = getExpectedCash(current);
  const by = current?.ops?.salesRuntime?.byMethod || {};
  const totalsByMethod = {
    efectivo: by.EFECTIVO_SISTEMA || 0,
    debito: by.DEBITO_SISTEMA || 0,
    credito: by.CREDITO_SISTEMA || 0,
    posDebito: by.POS_DEBITO || 0,
    posCredito: by.POS_CREDITO || 0,
    transferencia: by.TRANSFERENCIA || 0,
    mp: by.MERCADO_PAGO || 0,
  };

  const gastos = (current?.ops?.expenses || []).reduce((acc: number, e: any) => acc + (e?.amount || 0), 0);
  const retiros = current?.ops?.withdrawals || 0;
  const propinas = current?.ops?.tips?.cashTips || 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet size={18} className="text-rose-600" />
          <span className="font-semibold text-gray-900">Caja</span>
        </div>
        <div className="text-sm text-gray-600">
          Esperado: <b className="text-gray-900">${fmt(expected)}</b>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-3 mt-3">
        <Info label="Efectivo sistema" value={`$${fmt(totalsByMethod.efectivo)}`} />
        <Info label="Débito sistema" value={`$${fmt(totalsByMethod.debito)}`} />
        <Info label="Crédito sistema" value={`$${fmt(totalsByMethod.credito)}`} />
        <Info label="MP / Transf." value={`$${fmt(totalsByMethod.mp + totalsByMethod.transferencia)}`} />
      </div>

      <div className="grid md:grid-cols-3 gap-3 mt-3">
        <Info label="Gastos" value={`$${fmt(gastos)}`} />
        <Info label="Retiros" value={`$${fmt(retiros)}`} />
        <Info label="Propinas (cash)" value={`$${fmt(propinas)}`} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button className="btn-light inline-flex items-center gap-2" onClick={() => setShowModal(true)}>
          <PlusCircle size={16} /> Registrar gasto / retiro / propina
        </button>

        {typeof cash?.openSession === "function" && (
          <button className="btn-light inline-flex items-center gap-2" onClick={() => cash.openSession?.("Cajero")}>
            <HandCoins size={16} /> Abrir turno
          </button>
        )}

        {typeof cash?.listSessions === "function" && (
          <button
            className="btn-light inline-flex items-center gap-2"
            onClick={() => {
              try {
                const last = cash.listSessions?.().find((s: any) => s.status === "CLOSED");
                if (!last) return alert("Sin cierres previos.");
                alert(
                  `Último cierre:\nCajero: ${last.open?.cashierName}\nEsperado: $${fmt(
                    last.close?.expectedCash || 0
                  )}\nContado: $${fmt(last.close?.countedCash || 0)}`
                );
              } catch (e) {
                console.warn(e);
              }
            }}
          >
            <ReceiptText size={16} /> Ver último cierre
          </button>
        )}
      </div>

      {/* Modal de movimiento */}
      <ExpenseModal
        open={showModal}
        onClose={() => setShowModal(false)}
        // onClosed también es aceptado si prefieres usarlo
        // onClosed={() => setShowModal(false)}
      />
    </div>
  );
};

const Info: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="px-3 py-2 bg-gray-50 rounded border text-sm flex items-center justify-between">
    <span className="text-gray-600">{label}</span>
    <span className="font-semibold">{value}</span>
  </div>
);

export default CashupBar;
