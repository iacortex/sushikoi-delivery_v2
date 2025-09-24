// src/features/cashup/ExpenseModal.tsx
import * as React from "react";
import { X, Wallet, MinusCircle, PlusCircle, FileUp } from "lucide-react";
import { useCashup } from "./cashupContext";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CL").format(Math.round(n || 0));
const onlyNum = (s: string) => Number(String(s).replace(/[^\d]/g, "")) || 0;

type Props = {
  /** controla la visibilidad del modal */
  open: boolean;
  /** callback clásico para cerrar (compatibilidad) */
  onClose?: () => void;
  /** callback alternativo (algunos lugares lo usan) */
  onClosed?: () => void;
};

type Mode = "expense" | "withdrawal" | "tip";

const QUICK_NOTES = ["Tomates", "Gas", "Cocina", "Envases", "Delivery", "Otro"];

const Pill: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({
  onClick,
  children,
}) => (
  <button
    type="button"
    onClick={onClick}
    className="px-2 py-1 text-xs rounded-full border border-gray-300 hover:bg-gray-50"
  >
    {children}
  </button>
);

const Info: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mt-2 text-xs text-gray-500">{children}</div>
);

const ExpenseModal: React.FC<Props> = ({ open, onClose, onClosed }) => {
  const cash: any = useCashup(); // feature-detect para evitar errores TS por métodos no tipados

  const [mode, setMode] = React.useState<Mode>("expense");
  const [amountStr, setAmountStr] = React.useState<string>("");
  const [note, setNote] = React.useState<string>("");
  const [attachmentPreview, setAttachmentPreview] = React.useState<string | null>(null);

  const amount = React.useMemo(() => onlyNum(amountStr), [amountStr]);

  // --- Wrappers tolerantes ---
  const callAddExpense = React.useCallback(
    (payload: { amount: number; note?: string }) => {
      if (typeof cash?.addExpense === "function") return cash.addExpense(payload);
      if (typeof cash?.pushExpense === "function") return cash.pushExpense(payload);
      if (typeof cash?.ops?.addExpense === "function") return cash.ops.addExpense(payload);
      console.warn("[ExpenseModal] addExpense no implementado en cashupContext");
      return null;
    },
    [cash]
  );

  const callWithdraw = React.useCallback(
    (amt: number, noteStr?: string) => {
      if (typeof cash?.withdrawCash === "function") return cash.withdrawCash(amt, noteStr);
      if (typeof cash?.addWithdrawal === "function") return cash.addWithdrawal(amt, noteStr);
      if (typeof cash?.registerWithdrawal === "function") return cash.registerWithdrawal(amt, noteStr);
      console.warn("[ExpenseModal] withdrawCash/addWithdrawal no implementados");
      return null;
    },
    [cash]
  );

  const callAddTip = React.useCallback(
    (amt: number, noteStr?: string) => {
      if (typeof cash?.addCashTip === "function") return cash.addCashTip(amt, noteStr);
      if (typeof cash?.registerTip === "function") return cash.registerTip({ amount: amt, note: noteStr });
      if (typeof cash?.tips?.add === "function") return cash.tips.add(amt, noteStr);
      console.warn("[ExpenseModal] addCashTip/registerTip no implementados");
      return null;
    },
    [cash]
  );

  const resetForm = () => {
    setAmountStr("");
    setNote("");
    setAttachmentPreview(null);
  };

  const canSave = amount > 0;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;

    try {
      if (mode === "expense") {
        // Solo enviamos los campos válidos del tipo: { amount, note }
        callAddExpense({ amount, note: note.trim() || undefined });
      } else if (mode === "withdrawal") {
        callWithdraw(amount, note.trim() || undefined);
      } else if (mode === "tip") {
        callAddTip(amount, note.trim() || undefined);
      }
      resetForm();
      onClose?.();
      onClosed?.();
    } catch (err) {
      console.error("[ExpenseModal] submit error:", err);
      alert("No se pudo registrar el movimiento. Revisa la consola para más detalles.");
    }
  };

  const onPickQuick = (q: string) => {
    setNote((prev) => (prev ? `${prev} ${q}` : q));
  };

  const onFile = (f?: File | null) => {
    if (!f) {
      setAttachmentPreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      // Solo vista previa local; NO se envía al contexto porque el tipo no acepta 'attachmentBase64'
      setAttachmentPreview(String(reader.result || ""));
    };
    reader.readAsDataURL(f);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-lg border border-gray-200">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Wallet size={18} className="text-rose-600" />
            <h3 className="font-semibold text-gray-900">Movimiento de caja</h3>
          </div>
          <button className="icon-btn" onClick={() => { onClose?.(); onClosed?.(); }} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setMode("expense")}
              className={`px-3 py-2 rounded-lg border text-sm flex items-center justify-center gap-2 ${
                mode === "expense" ? "bg-gray-900 text-white" : "bg-white hover:bg-gray-50"
              }`}
            >
              <MinusCircle size={16} /> Gasto
            </button>
            <button
              type="button"
              onClick={() => setMode("withdrawal")}
              className={`px-3 py-2 rounded-lg border text-sm flex items-center justify-center gap-2 ${
                mode === "withdrawal" ? "bg-gray-900 text-white" : "bg-white hover:bg-gray-50"
              }`}
            >
              <MinusCircle size={16} /> Retiro
            </button>
            <button
              type="button"
              onClick={() => setMode("tip")}
              className={`px-3 py-2 rounded-lg border text-sm flex items-center justify-center gap-2 ${
                mode === "tip" ? "bg-gray-900 text-white" : "bg-white hover:bg-gray-50"
              }`}
            >
              <PlusCircle size={16} /> Propina
            </button>
          </div>

          <div>
            <label className="text-sm text-gray-700">Monto</label>
            <input
              className="input mt-1"
              inputMode="numeric"
              placeholder="$"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
            />
            <Info>Monto: ${fmt(amount)}</Info>
          </div>

          <div>
            <label className="text-sm text-gray-700">
              Concepto / Nota (se guarda como <code>note</code>)
            </label>
            <input
              className="input mt-1"
              placeholder="Ej: Compra de tomates, recursos cocina…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {QUICK_NOTES.map((q) => (
                <Pill key={q} onClick={() => onPickQuick(q)}>
                  {q}
                </Pill>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-700 flex items-center gap-2">
              <FileUp size={16} /> Adjuntar boleta/foto (opcional)
            </label>
            <input
              type="file"
              accept="image/*,.pdf"
              className="mt-1 block w-full text-sm"
              onChange={(e) => onFile(e.target.files?.[0] || null)}
            />
            {attachmentPreview && (
              <div className="mt-2 border rounded p-2 bg-gray-50 text-xs text-gray-600">
                Adjuntaste un archivo. (Solo vista previa — no se envía al contexto porque el
                tipo de <code>Expense</code> no acepta <code>attachmentBase64</code>).
              </div>
            )}
          </div>

          {/* Avisos si faltan métodos en el contexto */}
          {/* Expense */}
          {typeof cash?.addExpense !== "function" &&
            typeof cash?.pushExpense !== "function" &&
            typeof cash?.ops?.addExpense !== "function" && (
              <div className="p-2 text-xs rounded bg-yellow-50 border border-yellow-200 text-yellow-800">
                Tu <code>cashupContext</code> no expone <b>addExpense</b>. Agrega ese método para
                persistir gastos.
              </div>
            )}

          {/* Withdrawal */}
          {typeof cash?.withdrawCash !== "function" &&
            typeof cash?.addWithdrawal !== "function" &&
            typeof cash?.registerWithdrawal !== "function" && (
              <div className="p-2 text-xs rounded bg-yellow-50 border border-yellow-200 text-yellow-800">
                Tu <code>cashupContext</code> no expone un método de retiro. Se registrará cuando lo
                implementes.
              </div>
            )}

          {/* Tip */}
          {typeof cash?.addCashTip !== "function" &&
            typeof cash?.registerTip !== "function" &&
            typeof cash?.tips?.add !== "function" && (
              <div className="p-2 text-xs rounded bg-yellow-50 border border-yellow-200 text-yellow-800">
                Tu <code>cashupContext</code> no expone un método de propinas en efectivo.
              </div>
            )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              onClick={() => {
                onClose?.();
                onClosed?.();
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`px-4 py-2 rounded-lg text-white ${
                canSave ? "bg-rose-600 hover:bg-rose-700" : "bg-gray-300 cursor-not-allowed"
              }`}
              disabled={!canSave}
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseModal;
