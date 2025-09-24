import React, { useEffect, useMemo, useState } from "react";
import { CreditCard, DollarSign, Building2, CheckCircle2, AlertTriangle } from "lucide-react";
import { useCashup } from "@/features/cashup/cashupContext";

type PaymentMethod = "efectivo" | "debito" | "credito" | "transferencia" | "mp";

type Props = {
  total: number;
  customerData: {
    name?: string;
    phone?: string;
    rut?: string;
    paymentMethod: PaymentMethod;
    mpChannel?: "delivery" | "local";
  };
  onChangeCustomerData: (d: Partial<Props["customerData"]>) => void;
  isPaying: boolean;
  onBackToCart: () => void;
  onConfirmPay: () => void;
  orderMeta?: any;
};

/* ===== Utils CL ===== */
const toNumber = (s: string | number) => {
  if (typeof s === "number") return s;
  return Number(String(s).replace(/[^\d]/g, "")) || 0;
};
const fmtCLP = (n: number) => new Intl.NumberFormat("es-CL").format(Math.round(n || 0));

/** RUT helpers */
function cleanRut(r: string) {
  return (r || "").toUpperCase().replace(/[.\s]/g, "").replace(/-+/g, "-");
}
function splitRut(r: string): [string, string] {
  const c = cleanRut(r).replace(/[^0-9K\-]/g, "");
  const [b, dv] = c.includes("-") ? c.split("-") : [c.slice(0, -1), c.slice(-1)];
  return [b || "", dv || ""];
}
function computeDv(body: string) {
  let sum = 0, mul = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i], 10) * mul;
    mul = mul === 7 ? 2 : mul + 1;
  }
  const res = 11 - (sum % 11);
  if (res === 11) return "0";
  if (res === 10) return "K";
  return String(res);
}
export function validateRut(rut: string) {
  const [body, dv] = splitRut(rut);
  if (!body || !dv) return false;
  return computeDv(body) === dv;
}
export function formatRut(rut: string) {
  const [body, dv] = splitRut(rut);
  if (!body) return "";
  const rev = body.split("").reverse().join("");
  const chunks = rev.match(/.{1,3}/g) || [];
  const withDots = chunks.map(c => c.split("").reverse().join("")).reverse().join(".");
  return dv ? `${withDots}-${dv}` : withDots;
}

/* ===== Component ===== */
const PayPanel: React.FC<Props> = ({
  total,
  customerData,
  onChangeCustomerData,
  isPaying,
  onBackToCart,
  onConfirmPay,
}) => {
  // ⬇️ Usamos el contexto como any para que compile aunque no tenga los métodos
  const cash = useCashup() as any;
  const current = cash?.current;

  const supportsRegisterSale = typeof cash?.registerSale === "function";
  const supportsFiscalDoc = typeof cash?.registerFiscalDoc === "function";

  const [method, setMethod] = useState<PaymentMethod>(customerData.paymentMethod || "debito");
  const [cashInStr, setCashInStr] = useState<string>("");
  const [emitBoleta, setEmitBoleta] = useState<boolean>(false);
  const [rutInput, setRutInput] = useState<string>(customerData.rut || "");
  const [mpChannel, setMpChannel] = useState<"delivery" | "local" | undefined>(customerData.mpChannel);

  useEffect(() => {
    onChangeCustomerData({ paymentMethod: method });
  }, [method, onChangeCustomerData]);

  useEffect(() => {
    onChangeCustomerData({ rut: rutInput });
  }, [rutInput, onChangeCustomerData]);

  useEffect(() => {
    onChangeCustomerData({ mpChannel });
  }, [mpChannel, onChangeCustomerData]);

  const cashIn = useMemo(() => toNumber(cashInStr), [cashInStr]);
  const change = Math.max(0, Math.round(cashIn - Math.round(total)));

  const canConfirm = useMemo(() => {
    if (!current) return false;         // exige turno abierto
    if (total <= 0) return false;
    if (isPaying) return false;
    if (method === "efectivo") {
      if (cashIn <= 0) return false;
      if (cashIn < Math.round(total)) return false; // no mixtos
    }
    if (emitBoleta && rutInput.trim().length > 0 && !validateRut(rutInput)) return false;
    return true;
  }, [current, total, isPaying, method, cashIn, emitBoleta, rutInput]);

  const saleMethodMap: Record<PaymentMethod, string> = {
    efectivo: "EFECTIVO_SISTEMA",
    debito: "DEBITO_SISTEMA",
    credito: "CREDITO_SISTEMA",
    transferencia: "TRANSFERENCIA",
    mp: "MERCADO_PAGO",
  };

  const doConfirm = async () => {
    try {
      // registra la venta en el arqueo si tu contexto lo soporta
      if (supportsRegisterSale) {
        await cash.registerSale({
          amount: Math.round(total),
          method: saleMethodMap[method],
          meta: {
            channel: method === "mp" ? (mpChannel || "local") : undefined,
            cashIn: method === "efectivo" ? cashIn : undefined,
            change: method === "efectivo" ? change : undefined,
          },
        });
      }

      // registro fiscal (e-boleta) si está disponible
      if (emitBoleta) {
        const rutFormatted = formatRut(rutInput);
        if (supportsFiscalDoc) {
          await cash.registerFiscalDoc({
            docType: "EBOLETA",
            amount: Math.round(total),
            rut: rutFormatted || undefined,
            items: 1,
          });
        } else {
          // aviso no bloqueante
          console.warn("[PayPanel] registerFiscalDoc no está implementado en cashupContext");
        }
      }
    } catch (e) {
      console.error("register sale/fiscal error", e);
      // No bloqueamos la creación del pedido aunque falle el log
    }
    onConfirmPay();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CreditCard size={18} className="text-rose-600" />
          <h3 className="font-semibold text-gray-900">Pagar Pedido</h3>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">Total a pagar</div>
          <div className="text-2xl font-extrabold text-rose-600">${fmtCLP(total)}</div>
        </div>
      </div>

      {!current && (
        <div className="mb-4 p-3 rounded border border-yellow-200 bg-yellow-50 text-sm text-yellow-800">
          Debes <b>abrir la caja</b> desde el panel superior para poder cobrar.
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Método de pago */}
        <div className="md:col-span-1">
          <div className="text-sm font-medium text-gray-700 mb-2">Método</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              className={`px-3 py-2 border rounded-lg text-sm ${method === "efectivo" ? "border-rose-500 text-rose-600 bg-rose-50" : "hover:bg-gray-50"}`}
              onClick={() => setMethod("efectivo")}
            >
              <DollarSign className="inline mr-1" size={14}/> Efectivo
            </button>
            <button
              className={`px-3 py-2 border rounded-lg text-sm ${method === "debito" ? "border-rose-500 text-rose-600 bg-rose-50" : "hover:bg-gray-50"}`}
              onClick={() => setMethod("debito")}
            >
              <CreditCard className="inline mr-1" size={14}/> Débito
            </button>
            <button
              className={`px-3 py-2 border rounded-lg text-sm ${method === "credito" ? "border-rose-500 text-rose-600 bg-rose-50" : "hover:bg-gray-50"}`}
              onClick={() => setMethod("credito")}
            >
              <CreditCard className="inline mr-1" size={14}/> Crédito
            </button>
            <button
              className={`px-3 py-2 border rounded-lg text-sm ${method === "transferencia" ? "border-rose-500 text-rose-600 bg-rose-50" : "hover:bg-gray-50"}`}
              onClick={() => setMethod("transferencia")}
            >
              <Building2 className="inline mr-1" size={14}/> Transferencia
            </button>
            <button
              className={`px-3 py-2 border rounded-lg text-sm col-span-2 ${method === "mp" ? "border-rose-500 text-rose-600 bg-rose-50" : "hover:bg-gray-50"}`}
              onClick={() => setMethod("mp")}
            >
              <CreditCard className="inline mr-1" size={14}/> Mercado Pago
            </button>
          </div>

          {method === "mp" && (
            <div className="mt-3">
              <label className="text-sm text-gray-700">Canal</label>
              <select
                className="input mt-1"
                value={mpChannel || ""}
                onChange={(e) => setMpChannel((e.target.value as "delivery" | "local") || undefined)}
              >
                <option value="">Seleccionar…</option>
                <option value="local">Local</option>
                <option value="delivery">Delivery</option>
              </select>
            </div>
          )}
        </div>

        {/* Efectivo: con cuánto paga */}
        <div className="md:col-span-1">
          <div className="text-sm font-medium text-gray-700 mb-2">Detalles</div>
          {method === "efectivo" ? (
            <>
              <label className="text-sm text-gray-700">¿Con cuánto paga?</label>
              <input
                className="input mt-1"
                placeholder="$"
                inputMode="numeric"
                value={cashInStr}
                onChange={(e) => setCashInStr(e.target.value)}
              />
              <div className="mt-2 text-sm">
                <div className="text-gray-600">Total: <b>${fmtCLP(total)}</b></div>
                <div className={`text-${cashIn >= total ? "green" : "red"}-700`}>
                  {cashIn >= total ? "Vuelto" : "Falta"}: <b>${fmtCLP(Math.abs(cashIn - Math.round(total)))}</b>
                </div>
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-500">
              El total se cobrará íntegro con <b>{method.toUpperCase()}</b>. (No se permiten pagos mixtos)
            </div>
          )}
        </div>

        {/* E-Boleta */}
        <div className="md:col-span-1">
          <div className="text-sm font-medium text-gray-700 mb-2">E-Boleta</div>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={emitBoleta} onChange={(e) => setEmitBoleta(e.target.checked)} />
            Emitir e-boleta
          </label>

          <div className="mt-2">
            <label className="text-sm text-gray-700">RUT (opcional)</label>
            <input
              className={`input mt-1 ${emitBoleta && rutInput && !validateRut(rutInput) ? "border-red-400" : ""}`}
              placeholder="12.345.678-5"
              value={rutInput}
              onChange={(e) => setRutInput(e.target.value)}
              onBlur={() => setRutInput((v) => formatRut(v))}
            />
            {emitBoleta && rutInput && !validateRut(rutInput) && (
              <div className="text-xs text-red-600 mt-1">RUT inválido</div>
            )}
            {!supportsFiscalDoc && emitBoleta && (
              <div className="mt-2 p-2 rounded bg-yellow-50 border border-yellow-200 text-xs text-yellow-800 flex items-center gap-2">
                <AlertTriangle size={14}/> Tu <code>cashupContext</code> no implementa <b>registerFiscalDoc</b>. Se creará el pedido igual, pero no quedará el registro fiscal.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="mt-6 flex items-center justify-between">
        <button onClick={onBackToCart} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Volver</button>
        <button
          disabled={!canConfirm}
          onClick={doConfirm}
          className={`px-4 py-2 rounded-lg text-white inline-flex items-center gap-2 ${canConfirm ? "bg-rose-600 hover:bg-rose-700" : "bg-gray-300 cursor-not-allowed"}`}
        >
          <CheckCircle2 size={16} /> Confirmar y Cobrar
        </button>
      </div>
    </div>
  );
};

export default PayPanel;
