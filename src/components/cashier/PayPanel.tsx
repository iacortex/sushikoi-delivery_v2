// src/components/cashier/PayPanel.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  CreditCard,
  DollarSign,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Percent,
  FileText,
} from "lucide-react";
import { useCashup } from "@/features/cashup/cashupContext";
import { getCashupCompat, MethodKey } from "@/features/cashup/compat";

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
const toNumber = (s: string | number) =>
  typeof s === "number" ? s : Number(String(s).replace(/[^\d]/g, "")) || 0;
const fmtCLP = (n: number) =>
  new Intl.NumberFormat("es-CL").format(Math.round(n || 0));

function cleanRut(r: string) {
  return (r || "").toUpperCase().replace(/[.\s]/g, "").replace(/-+/g, "-");
}
function splitRut(r: string): [string, string] {
  const c = cleanRut(r).replace(/[^0-9K\-]/g, "");
  const [b, dv] = c.includes("-") ? c.split("-") : [c.slice(0, -1), c.slice(-1)];
  return [b || "", dv || ""];
}
function computeDv(body: string) {
  let sum = 0,
    mul = 2;
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
  const withDots = chunks
    .map((c) => c.split("").reverse().join(""))
    .reverse()
    .join(".");
  return dv ? `${withDots}-${dv}` : withDots;
}

/* ===== Modal propina ===== */
const TipModal: React.FC<{
  open: boolean;
  total: number;
  defaultPct?: number;
  onCancel: () => void;
  onAccept: (tipAmount: number) => void;
}> = ({ open, total, defaultPct = 10, onCancel, onAccept }) => {
  const [pct, setPct] = useState<number>(defaultPct);
  const [amountStr, setAmountStr] = useState<string>("");

  useEffect(() => {
    if (open) {
      setPct(defaultPct);
      setAmountStr("");
    }
  }, [open, defaultPct]);

  if (!open) return null;

  const calc = Math.round((total || 0) * (pct / 100));
  const manual = toNumber(amountStr);
  const tip = amountStr ? manual : calc;

  return (
    <div className="fixed inset-0 z-[70] bg-black/40 flex items-end md:items-center justify-center">
      <div className="bg-white w-full md:w-[420px] rounded-t-2xl md:rounded-2xl shadow-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Percent size={16} className="text-rose-600" />
          <h3 className="font-semibold">¿Agregar propina?</h3>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          Sugerimos el <b>{defaultPct}%</b> del total. Puedes cambiar el
          porcentaje o ingresar un monto manual.
        </p>

        <div className="grid gap-3">
          <div>
            <label className="text-sm text-gray-700">Porcentaje</label>
            <input
              className="input mt-1"
              type="number"
              min={0}
              value={pct}
              onChange={(e) =>
                setPct(Math.max(0, Number(e.target.value || 0)))
              }
            />
            <div className="text-xs text-gray-500 mt-1">
              Sugerido: ${fmtCLP(calc)}
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-700">Monto manual</label>
            <input
              className="input mt-1"
              placeholder="$"
              inputMode="numeric"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
            />
            <div className="text-xs text-gray-500 mt-1">
              Si lo dejas vacío usamos el porcentaje.
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button className="btn-light" onClick={onCancel}>
            Omitir
          </button>
          <button
            className="px-4 py-2 rounded-lg text-white bg-rose-600 hover:bg-rose-700"
            onClick={() => onAccept(tip)}
          >
            Agregar propina
          </button>
        </div>
      </div>
    </div>
  );
};

/* ===== Component ===== */
const PayPanel: React.FC<Props> = ({
  total,
  customerData,
  onChangeCustomerData,
  isPaying,
  onBackToCart,
  onConfirmPay,
}) => {
  const cashCtx = useCashup() as any;
  const cash = getCashupCompat(cashCtx);
  const current = cash.current;

  const [method, setMethod] = useState<PaymentMethod>(
    customerData.paymentMethod || "debito"
  );
  const [cashInStr, setCashInStr] = useState<string>("");
  const [docEnabled, setDocEnabled] = useState<boolean>(false);
  const [docType, setDocType] = useState<"EBOLETA" | "EFACTURA">("EBOLETA");
  const [rutInput, setRutInput] = useState<string>(customerData.rut || "");
  const [razonSocial, setRazonSocial] = useState<string>(""); // factura
  const [mpChannel, setMpChannel] = useState<"delivery" | "local" | undefined>(
    customerData.mpChannel
  );

  const [tipAskOpen, setTipAskOpen] = useState(false);
  const [tipCash, setTipCash] = useState<number>(0);

  useEffect(() => { onChangeCustomerData({ paymentMethod: method }); }, [method, onChangeCustomerData]);
  useEffect(() => { onChangeCustomerData({ rut: rutInput }); }, [rutInput, onChangeCustomerData]);
  useEffect(() => { onChangeCustomerData({ mpChannel }); }, [mpChannel, onChangeCustomerData]);

  // total que el cliente trae si paga en efectivo: consumo + propina
  const grand = Math.round(total + tipCash);
  const cashIn = useMemo(() => toNumber(cashInStr), [cashInStr]);
  const change = Math.max(0, Math.round(cashIn - grand));

  const canConfirm = useMemo(() => {
    if (!current) return false;
    if (total <= 0) return false;
    if (isPaying) return false;
    if (method === "efectivo") {
      if (cashIn <= 0) return false;
      if (cashIn < grand) return false; // no mixtos
    }
    if (docEnabled) {
      // Factura: RUT y Razón Social obligatorios
      if (docType === "EFACTURA") {
        if (!rutInput?.trim() || !validateRut(rutInput)) return false;
        if (!razonSocial.trim()) return false;
      } else {
        // Boleta: RUT opcional, pero si viene debe ser válido
        if (rutInput?.trim() && !validateRut(rutInput)) return false;
      }
    }
    return true;
  }, [current, total, isPaying, method, cashIn, grand, docEnabled, rutInput, docType, razonSocial]);

  const saleMethodMap: Record<PaymentMethod, MethodKey> = {
    efectivo: "EFECTIVO_SISTEMA",
    debito: "DEBITO_SISTEMA",
    credito: "CREDITO_SISTEMA",
    transferencia: "TRANSFERENCIA",
    mp: "MERCADO_PAGO",
  };

  const doConfirmInternal = async () => {
    try {
      // 1) Registrar venta SOLO por el CONSUMO (NO incluir propina)
      if (cash.registerSale) {
        await cash.registerSale({
          amount: Math.round(total),
          method: saleMethodMap[method],
          meta: {
            tipCash: method === "efectivo" ? (tipCash || undefined) : undefined,
            channel: method === "mp" ? mpChannel || "local" : undefined,
            cashIn: method === "efectivo" ? cashIn : undefined,
            change: method === "efectivo" ? change : undefined,
          },
        });
      }

      // 2) Registrar propina cash en la caja (para arqueo)
      if (method === "efectivo" && tipCash > 0 && cash.addCashTip) {
        await cash.addCashTip(Math.round(tipCash), { from: "PayPanel" });
      }

      // 3) Documento fiscal por el CONSUMO (sin propina)
      if (docEnabled) {
        if (cash.registerFiscalDoc) {
          await cash.registerFiscalDoc({
            docType: docType, // "EBOLETA" | "EFACTURA"
            amount: Math.round(total),
            rut: rutInput?.trim() ? formatRut(rutInput) : undefined,
            items: 1,
            businessName: docType === "EFACTURA" ? razonSocial.trim() : undefined,
          });
        } else {
          console.warn("[PayPanel] registerFiscalDoc no está implementado en cashupContext");
        }
      }
    } catch (e) {
      console.error("register sale/fiscal/tip error", e);
      // igual dejamos continuar
    }

    // 4) Dejar propina para que CashierPanel la muestre en boleta (Extras → Propina)
    try { (window as any).__KOI_LAST_TIP__ = tipCash || 0; } catch {}

    onConfirmPay();
  };

  const onClickConfirm = () => setTipAskOpen(true);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CreditCard size={18} className="text-rose-600" />
          <h3 className="font-semibold text-gray-900">Pagar Pedido</h3>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">Consumo</div>
          <div className="text-xl font-extrabold text-gray-900">${fmtCLP(total)}</div>
          <div className="text-sm text-gray-600 mt-1">Total a cobrar</div>
          <div className="text-2xl font-extrabold text-rose-600">${fmtCLP(grand)}</div>
          {tipCash > 0 && (
            <div className="text-xs text-gray-500">Incluye propina: ${fmtCLP(tipCash)}</div>
          )}
        </div>
      </div>

      {!current && (
        <div className="mb-4 p-3 rounded border border-yellow-200 bg-yellow-50 text-sm text-yellow-800">
          Debes <b>abrir la caja</b> desde el panel superior para poder cobrar.
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Método */}
        <div className="md:col-span-1">
          <div className="text-sm font-medium text-gray-700 mb-2">Método</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              className={`px-3 py-2 border rounded-lg text-sm ${method === "efectivo" ? "border-rose-500 text-rose-600 bg-rose-50" : "hover:bg-gray-50"}`}
              onClick={() => setMethod("efectivo")}
            >
              <DollarSign className="inline mr-1" size={14} /> Efectivo
            </button>
            <button
              className={`px-3 py-2 border rounded-lg text-sm ${method === "debito" ? "border-rose-500 text-rose-600 bg-rose-50" : "hover:bg-gray-50"}`}
              onClick={() => setMethod("debito")}
            >
              <CreditCard className="inline mr-1" size={14} /> Débito
            </button>
            <button
              className={`px-3 py-2 border rounded-lg text-sm ${method === "credito" ? "border-rose-500 text-rose-600 bg-rose-50" : "hover:bg-gray-50"}`}
              onClick={() => setMethod("credito")}
            >
              <CreditCard className="inline mr-1" size={14} /> Crédito
            </button>
            <button
              className={`px-3 py-2 border rounded-lg text-sm ${method === "transferencia" ? "border-rose-500 text-rose-600 bg-rose-50" : "hover:bg-gray-50"}`}
              onClick={() => setMethod("transferencia")}
            >
              <Building2 className="inline mr-1" size={14} /> Transferencia
            </button>
            <button
              className={`px-3 py-2 border rounded-lg text-sm col-span-2 ${method === "mp" ? "border-rose-500 text-rose-600 bg-rose-50" : "hover:bg-gray-50"}`}
              onClick={() => setMethod("mp")}
            >
              <CreditCard className="inline mr-1" size={14} /> Mercado Pago
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

        {/* Efectivo */}
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
                <div className="text-gray-600">Consumo: <b>${fmtCLP(total)}</b></div>
                <div className="text-gray-600">Propina: <b>${fmtCLP(tipCash)}</b></div>
                <div className="text-gray-900">Total a cobrar: <b>${fmtCLP(grand)}</b></div>
                <div className={`text-${cashIn >= grand ? "green" : "red"}-700`}>
                  {cashIn >= grand ? "Vuelto" : "Falta"}: <b>${fmtCLP(Math.abs(cashIn - grand))}</b>
                </div>
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-500">
              El consumo se cobrará íntegro con <b>{method.toUpperCase()}</b>. (No se permiten pagos mixtos)
              <br/>La propina (si la dejas) no se incluye en el documento y, si es en efectivo, se registra en caja como propina.
            </div>
          )}
        </div>

        {/* Documento fiscal */}
        <div className="md:col-span-1">
          <div className="text-sm font-medium text-gray-700 mb-2">Documento</div>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={docEnabled} onChange={(e) => setDocEnabled(e.target.checked)} />
            <FileText size={14} /> Emitir documento
          </label>

          {docEnabled && (
            <div className="mt-2 space-y-2">
              <select
                className="input"
                value={docType}
                onChange={(e) => setDocType(e.target.value as "EBOLETA" | "EFACTURA")}
              >
                <option value="EBOLETA">Boleta electrónica</option>
                <option value="EFACTURA">Factura electrónica</option>
              </select>

              <div>
                <label className="text-sm text-gray-700">
                  RUT {docType === "EFACTURA" ? "empresa" : "(opcional)"}
                </label>
                <input
                  className={`input mt-1 ${(docType === "EFACTURA" && !rutInput.trim()) || (rutInput && !validateRut(rutInput)) ? "border-red-400" : ""}`}
                  placeholder="12.345.678-5"
                  value={rutInput}
                  onChange={(e) => setRutInput(e.target.value)}
                  onBlur={() => setRutInput((v) => formatRut(v))}
                />
                {rutInput && !validateRut(rutInput) && (
                  <div className="text-xs text-red-600 mt-1">RUT inválido</div>
                )}
              </div>

              {docType === "EFACTURA" && (
                <div>
                  <label className="text-sm text-gray-700">Razón Social</label>
                  <input
                    className={`input mt-1 ${!razonSocial.trim() ? "border-red-400" : ""}`}
                    placeholder="Nombre empresa"
                    value={razonSocial}
                    onChange={(e) => setRazonSocial(e.target.value)}
                  />
                </div>
              )}

              {!cash.registerFiscalDoc && (
                <div className="p-2 rounded bg-yellow-50 border border-yellow-200 text-xs text-yellow-800 flex items-center gap-2">
                  <AlertTriangle size={14} /> Tu <code>cashupContext</code> no implementa <b>registerFiscalDoc</b>. Se creará el pedido igual, pero no quedará el registro fiscal.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className="mt-6 flex items-center justify-between">
        <button onClick={onBackToCart} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Volver</button>
        <button
          disabled={!canConfirm}
          onClick={() => setTipAskOpen(true)}
          className={`px-4 py-2 rounded-lg text-white inline-flex items-center gap-2 ${canConfirm ? "bg-rose-600 hover:bg-rose-700" : "bg-gray-300 cursor-not-allowed"}`}
        >
          <CheckCircle2 size={16} /> Confirmar y Cobrar
        </button>
      </div>

      {/* Modal propina */}
      <TipModal
        open={tipAskOpen}
        total={total}
        defaultPct={10}
        onCancel={() => {
          setTipCash(0);
          setTipAskOpen(false);
          doConfirmInternal();
        }}
        onAccept={(tip) => {
          setTipCash(Math.max(0, Math.round(tip || 0)));
          setTipAskOpen(false);
          doConfirmInternal();
        }}
      />
    </div>
  );
};

export default PayPanel;
