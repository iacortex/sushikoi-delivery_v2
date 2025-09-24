// src/features/cashup/CloseShiftWizard.tsx
import React from "react";
import { Lock, ShieldCheck, Calculator, AlertTriangle } from "lucide-react";
import { useCashup } from "./cashupContext";

const fmt = (n: number) => new Intl.NumberFormat("es-CL").format(Math.round(n || 0));
const onlyNum = (s: string) => Number(String(s).replace(/[^\d]/g, "")) || 0;

function maskPin(pin: string): string {
  if (!pin) return "";
  const last2 = pin.slice(-2);
  const masked = "*".repeat(Math.max(0, pin.length - 2)) + last2;
  return masked;
}

type Props = {
  onClosed?: (sessionClosed: any) => void;
  onCancel?: () => void;
};

const CloseShiftWizard: React.FC<Props> = ({ onClosed, onCancel }) => {
  const cash: any = useCashup();

  const current = cash?.current;
  const getExpectedCash =
    cash?.getExpectedCash ||
    ((cur: any) => {
      // fallback si el contexto no provee el cálculo
      const BASE = 45000;
      const efectivoSistema = cur?.ops?.salesRuntime?.byMethod?.EFECTIVO_SISTEMA ?? 0;
      const tips = cur?.ops?.tips?.cashTips ?? 0;
      const gastos = (cur?.ops?.expenses ?? []).reduce((a: number, e: any) => a + (e?.amount || 0), 0);
      const retiros = cur?.ops?.withdrawals ?? 0;
      return BASE + efectivoSistema + tips - gastos - retiros;
    });

  const closeSession =
    cash?.closeSession || cash?.closeShift || cash?.close || undefined;

  const expected = getExpectedCash(current);

  // UI state
  const [countedStr, setCountedStr] = React.useState<string>("");
  const [supervisorName, setSupervisorName] = React.useState<string>("");
  const [supervisorPin, setSupervisorPin] = React.useState<string>("");

  const counted = React.useMemo(() => onlyNum(countedStr), [countedStr]);
  const diff = counted - (expected || 0);

  const canClose =
    !!current &&
    typeof closeSession === "function" &&
    counted > 0 &&
    supervisorName.trim().length > 0 &&
    supervisorPin.trim().length >= 4; // ej. mínimo 4 dígitos

  const onConfirm = () => {
    if (!canClose) return;

    // 🔴 IMPORTANTE: aquí NO usamos `supervisorPin` a nivel raíz.
    // ✅ Usamos el bloque `supervisor` con `pinMasked` como pide el tipo.
    const opts = {
      countedCash: counted,
      supervisor: {
        name: supervisorName.trim(),
        pinMasked: maskPin(supervisorPin.trim()),
      },
      // Campos opcionales comúnmente aceptados por el tipo que mencionaste:
      // countedDenoms, signedBy… (agrega si los usas)
      // countedDenoms: undefined,
      // signedBy: current?.open?.cashierName,
    };

    try {
      const result = closeSession(counted, opts);
      onClosed?.(result);
    } catch (e) {
      console.error("[CloseShiftWizard] close error:", e);
      alert("No se pudo cerrar el turno. Revisa la consola para más detalles.");
    }
  };

  if (!current) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 flex items-start gap-2">
        <AlertTriangle size={16} className="mt-0.5" />
        Debes abrir la caja antes de poder cerrarla.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Lock className="text-rose-600" size={18} />
          <h3 className="font-semibold text-gray-900">Cerrar turno</h3>
        </div>
        <div className="text-sm text-gray-600">
          Cajero: <b>{current?.open?.cashierName || "Cajero"}</b>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <div className="text-xs text-gray-600 mb-1">Efectivo esperado</div>
          <div className="text-2xl font-bold">${fmt(expected)}</div>
          <div className="text-xs text-gray-500">Incluye fondo fijo ($45.000)</div>
        </div>

        <div className="md:col-span-2">
          <label className="text-sm text-gray-700">Efectivo contado</label>
          <input
            className="input mt-1"
            placeholder="$"
            inputMode="numeric"
            value={countedStr}
            onChange={(e) => setCountedStr(e.target.value)}
          />
          <div className="mt-2 text-sm flex items-center gap-2">
            <Calculator size={14} className="text-gray-500" />
            Diferencia:{" "}
            <b className={`${diff === 0 ? "text-gray-800" : diff > 0 ? "text-green-700" : "text-red-700"}`}>
              ${fmt(diff)}
            </b>
          </div>
        </div>
      </div>

      <div className="mt-6 grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-gray-700">Supervisor (nombre)</label>
          <input
            className="input mt-1"
            placeholder="Nombre supervisor"
            value={supervisorName}
            onChange={(e) => setSupervisorName(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm text-gray-700">Supervisor PIN</label>
          <input
            className="input mt-1"
            placeholder="****"
            inputMode="numeric"
            value={supervisorPin}
            onChange={(e) => setSupervisorPin(e.target.value)}
          />
          <div className="text-xs text-gray-500 mt-1">
            Se almacenará como: <code>{maskPin(supervisorPin || "") || "—"}</code>
          </div>
        </div>
      </div>

      {typeof closeSession !== "function" && (
        <div className="mt-4 p-3 rounded bg-yellow-50 border border-yellow-200 text-sm text-yellow-800">
          Tu <code>cashupContext</code> no implementa <b>closeSession</b>.
          El botón permanecerá deshabilitado hasta que lo agregues.
        </div>
      )}

      <div className="mt-6 flex items-center justify-end gap-2">
        <button className="px-4 py-2 border rounded-lg hover:bg-gray-50" onClick={onCancel}>
          Cancelar
        </button>
        <button
          className={`px-4 py-2 rounded-lg text-white inline-flex items-center gap-2 ${
            canClose ? "bg-rose-600 hover:bg-rose-700" : "bg-gray-300 cursor-not-allowed"
          }`}
          disabled={!canClose}
          onClick={onConfirm}
        >
          <ShieldCheck size={16} /> Confirmar cierre
        </button>
      </div>
    </div>
  );
};

export default CloseShiftWizard;
