import React, { useMemo, useState } from "react";
import { CreditCard, Mail, Hash, AlertCircle } from "lucide-react";

/* ========= Tipos locales (superset del padre) ========= */
type ServiceType = "delivery" | "local";
type PaymentMethod = "efectivo" | "debito" | "credito" | "transferencia" | "mp";

type PayCustomerData = {
  name?: string;
  phone?: string;
  paymentMethod: PaymentMethod;
  mpChannel?: "delivery" | "local";
  // nuevos/opcionales
  rut?: string;
  receiptEmail?: string;
  cashGiven?: number | string;
  transferRef?: string;
  cardLast4?: string;
};

type OrderMetaLike = {
  service?: ServiceType;
  deliveryFee?: number;
  extrasTotal?: number;
  // opcionalmente podrían venir estos, los consideramos si existen:
  changes?: { fee?: number }[];
  soy?: { extraFee?: number; feeTotal?: number };
  ginger?: { extraFee?: number; feeTotal?: number };
  wasabi?: { extraFee?: number; feeTotal?: number };
  agridulce?: { extraFee?: number; feeTotal?: number };
  acevichada?: { extraFee?: number; feeTotal?: number };
};

type Props = {
  total: number;
  customerData: PayCustomerData;
  onChangeCustomerData: (d: PayCustomerData) => void;
  isPaying: boolean;
  onBackToCart: () => void;
  onConfirmPay: () => void;
  orderMeta?: OrderMetaLike;
};

/* ========= Utilidades ========= */
const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "efectivo", label: "Efectivo" },
  { value: "debito", label: "Tarjeta de Débito" },
  { value: "credito", label: "Tarjeta de Crédito" },
  { value: "transferencia", label: "Transferencia" },
  { value: "mp", label: "Mercado Pago" },
];

const clp = (n: number) =>
  new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 }).format(Math.round(n || 0));

const feeOf = (s?: { extraFee?: number; feeTotal?: number }) => s?.extraFee ?? s?.feeTotal ?? 0;
const calcExtras = (m?: OrderMetaLike) => {
  if (!m) return 0;
  const delivery = m.service === "delivery" ? m.deliveryFee ?? 0 : 0;
  const changes = (m.changes ?? []).reduce((s, c) => s + (c?.fee ?? 0), 0);
  const sauces =
    feeOf(m.soy) + feeOf(m.ginger) + feeOf(m.wasabi) + feeOf(m.agridulce) + feeOf(m.acevichada);
  return delivery + changes + sauces;
};

/* ==== RUT: limpiar, formatear y validar (Mod 11) ==== */
const cleanRut = (s = "") => s.replace(/[^0-9kK]/g, "").toUpperCase();
const calcDv = (body: string) => {
  let sum = 0,
    m = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i], 10) * m;
    m = m === 7 ? 2 : m + 1;
  }
  const r = 11 - (sum % 11);
  return r === 11 ? "0" : r === 10 ? "K" : String(r);
};
const isRutValid = (rut?: string) => {
  const c = cleanRut(rut || "");
  if (c.length < 2) return false;
  const body = c.slice(0, -1);
  const dv = c.slice(-1);
  return calcDv(body) === dv;
};
const formatRut = (rut: string) => {
  const c = cleanRut(rut);
  if (!c) return "";
  const body = c.slice(0, -1);
  const dv = c.slice(-1);
  let out = "";
  for (let i = body.length; i > 0; i -= 3) {
    const start = Math.max(i - 3, 0);
    const chunk = body.slice(start, i);
    out = (start > 0 ? "." : "") + chunk + out;
  }
  return `${out}-${dv}`;
};

/* ========= Componente ========= */
const PayPanel: React.FC<Props> = ({
  total,
  customerData,
  onChangeCustomerData,
  isPaying,
  onBackToCart,
  onConfirmPay,
  orderMeta,
}) => {
  const setField = <K extends keyof PayCustomerData>(k: K, v: PayCustomerData[K]) =>
    onChangeCustomerData({ ...customerData, [k]: v });

  const extras = useMemo(
    () =>
      typeof orderMeta?.extrasTotal === "number" ? orderMeta!.extrasTotal : calcExtras(orderMeta),
    [orderMeta]
  );
  const deliveryFee =
    orderMeta?.service === "delivery" ? Math.max(0, orderMeta?.deliveryFee ?? 0) : 0;
  const productsSubtotal = Math.max(0, total - (extras || 0));

  // Estado y validaciones
  const [rutTouched, setRutTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);

  const rutVal = customerData.rut || "";
  const rutOk = isRutValid(rutVal);
  const emailVal = (customerData.receiptEmail || "").trim();
  const emailOk = !emailVal || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal);

  const needsMpChannel = customerData.paymentMethod === "mp";
  const canConfirm =
    !!total && !!rutVal && rutOk && emailOk && (!needsMpChannel || !!customerData.mpChannel);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-xl border shadow-sm">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <CreditCard className="text-rose-600" /> Pago
          </h3>
          <div className="text-right text-sm text-gray-600">
            <div>
              Cliente:{" "}
              <b className="text-gray-900">
                {customerData.name?.trim() || "—"}
              </b>
            </div>
            <div>Tel: {customerData.phone?.trim() || "—"}</div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Columna izquierda: datos + método */}
          <div className="md:col-span-2 space-y-5">
            {/* RUT + Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Hash size={14} className="inline mr-1" />
                  RUT del cliente <span className="text-rose-600">*</span>
                </label>
                <input
                  value={rutVal}
                  onChange={(e) => setField("rut", formatRut(e.target.value))}
                  onBlur={() => setRutTouched(true)}
                  placeholder="12.345.678-5"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent ${
                    rutTouched && !rutOk ? "border-rose-500" : "border-gray-300"
                  }`}
                  inputMode="text"
                  autoComplete="off"
                />
                {rutTouched && !rutOk && (
                  <p className="mt-1 text-xs text-rose-600 flex items-center gap-1">
                    <AlertCircle size={12} /> RUT inválido. Revisa dígito verificador.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Mail size={14} className="inline mr-1" />
                  Email boleta (opcional)
                </label>
                <input
                  value={customerData.receiptEmail || ""}
                  onChange={(e) => setField("receiptEmail", e.target.value)}
                  onBlur={() => setEmailTouched(true)}
                  placeholder="cliente@correo.cl"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent ${
                    emailTouched && !emailOk ? "border-rose-500" : "border-gray-300"
                  }`}
                  inputMode="email"
                  autoComplete="off"
                />
                {emailTouched && !emailOk && (
                  <p className="mt-1 text-xs text-rose-600 flex items-center gap-1">
                    <AlertCircle size={12} /> Email inválido.
                  </p>
                )}
              </div>
            </div>

            {/* Método de pago */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Método de pago
                </label>
                <select
                  value={customerData.paymentMethod}
                  onChange={(e) =>
                    setField("paymentMethod", e.target.value as PaymentMethod)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {customerData.paymentMethod === "mp" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Canal Mercado Pago
                  </label>
                  <select
                    value={customerData.mpChannel || ""}
                    onChange={(e) => setField("mpChannel", e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  >
                    <option value="">Selecciona canal…</option>
                    <option value="local">Local</option>
                    <option value="delivery">Delivery</option>
                  </select>
                  {!customerData.mpChannel && (
                    <p className="mt-1 text-xs text-gray-500">
                      Sugerencia por servicio: <b>{orderMeta?.service || "local"}</b>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Campos específicos por método */}
            {customerData.paymentMethod === "efectivo" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto entregado (opcional)
                </label>
                <input
                  type="number"
                  min={0}
                  value={customerData.cashGiven ?? ""}
                  onChange={(e) =>
                    setField("cashGiven", e.target.value === "" ? "" : Number(e.target.value))
                  }
                  placeholder="¿Con cuánto paga?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
                {!!customerData.cashGiven && Number(customerData.cashGiven) >= total && (
                  <p className="mt-1 text-xs text-gray-600">
                    Vuelto: <b>${clp(Number(customerData.cashGiven) - total)}</b>
                  </p>
                )}
              </div>
            )}

            {customerData.paymentMethod === "transferencia" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  N°/Comentario de transferencia
                </label>
                <input
                  value={customerData.transferRef || ""}
                  onChange={(e) => setField("transferRef", e.target.value)}
                  placeholder="Ej: #OP123456 o comentario"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
              </div>
            )}

            {(customerData.paymentMethod === "debito" ||
              customerData.paymentMethod === "credito") && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Últimos 4 dígitos (opcional)
                </label>
                <input
                  value={customerData.cardLast4 || ""}
                  onChange={(e) =>
                    setField("cardLast4", e.target.value.replace(/[^0-9]/g, "").slice(0, 4))
                  }
                  placeholder="1234"
                  className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  inputMode="numeric"
                />
              </div>
            )}
          </div>

          {/* Columna derecha: resumen */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="text-sm text-gray-600">Resumen</div>
            <div className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Productos</span>
                <span>${clp(productsSubtotal)}</span>
              </div>
              {deliveryFee > 0 && (
                <div className="flex justify-between">
                  <span>Delivery</span>
                  <span>${clp(deliveryFee)}</span>
                </div>
              )}
              {extras - deliveryFee > 0 && (
                <div className="flex justify-between">
                  <span>Extras (cambios/salsas)</span>
                  <span>${clp(extras - deliveryFee)}</span>
                </div>
              )}
            </div>
            <div className="mt-3 border-t pt-2 flex justify-between text-base font-semibold">
              <span>Total</span>
              <span className="text-rose-600">${clp(total)}</span>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={onBackToCart}
                className="flex-1 h-10 border rounded-lg hover:bg-gray-100"
              >
                Volver al carrito
              </button>
              <button
                onClick={onConfirmPay}
                disabled={!canConfirm || isPaying}
                className="flex-1 h-10 bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50"
                title={canConfirm ? "Crear pedido" : "Completa los datos requeridos"}
              >
                {isPaying ? "Procesando…" : "Confirmar y crear pedido"}
              </button>
            </div>

            {!rutVal && (
              <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                Ingresa el RUT para emitir boleta con identificación del cliente.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export { PayPanel };
export default PayPanel;
