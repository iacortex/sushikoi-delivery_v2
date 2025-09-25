// src/features/cashup/FloatingCashup.tsx
import React from "react";
import { Wallet, X, PlusCircle } from "lucide-react";
import CashDrawerControl from "./CashDrawerControl";
import { useCashup } from "./cashupContext";

type Props = {
  /** opcional: lo puedes usar para ocultar el botón según el rol */
  hidden?: boolean;
};

const FloatingCashup: React.FC<Props> = ({ hidden }) => {
  const [open, setOpen] = React.useState(false);
  const cash = useCashup() as any;

  return (
    <>
      {/* Botón flotante */}
      {!hidden && (
        <button
          onClick={() => setOpen(true)}
          className="fixed right-4 bottom-4 z-40 bg-rose-600 hover:bg-rose-700 text-white px-4 py-3 rounded-full shadow-lg inline-flex items-center gap-2"
          title="Abrir panel de caja"
        >
          <Wallet size={18} />
          Caja
        </button>
      )}

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Panel lateral */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[520px] z-50 bg-white border-l border-gray-200 shadow-xl transform transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Wallet className="text-rose-600" size={20} />
            <h3 className="font-semibold text-gray-900">Panel de Caja</h3>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-2 rounded hover:bg-gray-100"
            title="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-auto h-[calc(100%-56px)]">
          {/* Control principal abrir/cerrar turno + últimos cierres */}
          <CashDrawerControl />

          {/* Atajos opcionales (si tu contexto los implementa) */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <PlusCircle size={18} className="text-rose-600" />
                <h4 className="font-medium text-gray-900">Acciones rápidas</h4>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                className="btn-light"
                onClick={() => {
                  if (typeof cash?.openExpenseModal === "function") {
                    cash.openExpenseModal();
                  } else {
                    // Si no tienes modal, puedes implementar el tuyo
                    alert("Implementa ExpenseModal / openExpenseModal en tu cashupContext.");
                  }
                }}
              >
                + Gasto
              </button>

              <button
                className="btn-light"
                onClick={() => {
                  if (typeof cash?.quickWithdraw === "function") {
                    const v = Number(
                      prompt("Monto a retirar (CLP):", "10000")?.replace(/[^\d]/g, "") || 0
                    );
                    if (v > 0) cash.quickWithdraw(v);
                  } else {
                    alert("Implementa quickWithdraw en tu cashupContext.");
                  }
                }}
              >
                + Retiro
              </button>

              <button
                className="btn-light"
                onClick={() => {
                  if (typeof cash?.addCashTip === "function") {
                    const v = Number(
                      prompt("Propina en efectivo (CLP):", "2000")?.replace(/[^\d]/g, "") || 0
                    );
                    if (v > 0) cash.addCashTip(v);
                  } else {
                    alert("Implementa addCashTip en tu cashupContext.");
                  }
                }}
              >
                + Propina
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-2">
              Estos atajos dependen de si tu <code>cashupContext</code> implementa los métodos.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default FloatingCashup;
