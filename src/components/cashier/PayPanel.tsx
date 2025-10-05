// src/components/cashier/PayPanel.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  CreditCard,
  DollarSign,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Percent,
  FileText,
  Calculator,
  Wand2,
  BadgePercent,
  BadgeDollarSign,
  ChevronLeft,
  Printer,
} from "lucide-react";
import { useCashup } from "@/features/cashup/cashupContext";
import { getCashupCompat } from "@/features/cashup/compat";

/* =========================================================
   TIPOS y PROPS
   ========================================================= */
type PaymentMethod = "efectivo" | "debito" | "credito" | "transferencia" | "mp";

type Props = {
  total: number; // total del consumo (sin propina)
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
  onConfirmPay: () => void; // crea orden (lo ya existente en tu flujo)
  orderMeta?: any;
};

/* =========================================================
   UTILS CL
   ========================================================= */
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
  const withDots = chunks
    .map((c) => c.split("").reverse().join(""))
    .reverse()
    .join(".");
  return dv ? `${withDots}-${dv}` : withDots;
}

/* =========================================================
   MODAL PROPINA
   ========================================================= */
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
              onChange={(e) => setPct(Math.max(0, Number(e.target.value || 0)))}
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
            onClick={() => onAccept(Math.max(0, tip))}
          >
            Agregar propina
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   SUBCOMPONENTES UI
   ========================================================= */
const MethodCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`p-3 rounded-xl border text-left hover:shadow-sm transition ${
      active ? "bg-emerald-50 border-emerald-300" : "bg-white border-gray-200"
    }`}
    title={label}
  >
    <div className="flex items-center gap-2">
      <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center">
        {icon}
      </div>
      <div className="font-medium">{label}</div>
    </div>
  </button>
);

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({
  label,
  value,
}) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-gray-600">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);

const QuickCashButtons: React.FC<{
  value: string;
  onChange: (s: string) => void;
  targets?: number[];
}> = ({ value, onChange, targets = [1000, 2000, 5000, 10000, 20000, 50000] }) => {
  const v = toNumber(value);
  return (
    <div className="flex flex-wrap gap-1">
      {targets.map((t) => (
        <button
          key={t}
          onClick={() => onChange(String(v + t))}
          className="px-2 py-1 text-xs border rounded-md hover:bg-gray-50"
        >
          +{fmtCLP(t)}
        </button>
      ))}
      {v > 0 && (
        <button
          onClick={() => onChange("")}
          className="px-2 py-1 text-xs border rounded-md hover:bg-gray-50"
          title="Limpiar"
        >
          Limpiar
        </button>
      )}
    </div>
  );
};

const Numpad: React.FC<{
  onAppend: (digit: string) => void;
  onBackspace: () => void;
  onClear: () => void;
}> = ({ onAppend, onBackspace, onClear }) => (
  <div className="grid grid-cols-3 gap-1">
    {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map((d) => (
      <button
        key={d}
        onClick={() => onAppend(d)}
        className="py-2 border rounded-md hover:bg-gray-50"
      >
        {d}
      </button>
    ))}
    <button onClick={onBackspace} className="py-2 border rounded-md hover:bg-gray-50">
      ←
    </button>
    <button onClick={onClear} className="py-2 border rounded-md hover:bg-gray-50">
      C
    </button>
  </div>
);

/* =========================================================
   CONFIG PROMOS / DESCUENTOS
   ========================================================= */
const PROMO_CODES: Array<{ code: string; pct?: number; amount?: number }> = [
  { code: "KOI10", pct: 10 },
  { code: "KOI20", pct: 20 },
  { code: "DELIVERY2K", amount: 2000 },
];

/* =========================================================
   COMPONENTE PRINCIPAL
   ========================================================= */
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

  // Método y canal MP
  const [method, setMethod] = useState<PaymentMethod>(
    customerData.paymentMethod || "debito"
  );
  const [mpChannel, setMpChannel] = useState<"delivery" | "local" | undefined>(
    customerData.mpChannel
  );

  // Efectivo
  const [cashInStr, setCashInStr] = useState<string>("");
  const cashIn = useMemo(() => toNumber(cashInStr), [cashInStr]);

  // Documento
  const [docEnabled, setDocEnabled] = useState<boolean>(false);
  const [docType, setDocType] = useState<"EBOLETA" | "EFACTURA">("EBOLETA");
  const [rutInput, setRutInput] = useState<string>(customerData.rut || "");
  const [razonSocial, setRazonSocial] = useState<string>("");

  // Propina
  const [tipAskOpen, setTipAskOpen] = useState(false);
  const [tipCash, setTipCash] = useState<number>(0);

  // Descuento/Recargo
  const [discountType, setDiscountType] = useState<"none" | "pct" | "amt">("none");
  const [discountVal, setDiscountVal] = useState<string>("");
  const [surchargeType, setSurchargeType] = useState<"none" | "pct" | "amt">("none");
  const [surchargeVal, setSurchargeVal] = useState<string>("");

  // Cupón
  const [coupon, setCoupon] = useState<string>("");
  const [couponOk, setCouponOk] = useState<{ pct?: number; amount?: number } | null>(null);

  // Numpad toggle
  const [showNumpad, setShowNumpad] = useState<boolean>(false);
  const cashInputRef = useRef<HTMLInputElement | null>(null);

  // Sync a customerData
  useEffect(() => { onChangeCustomerData({ paymentMethod: method }); }, [method, onChangeCustomerData]);
  useEffect(() => { onChangeCustomerData({ rut: rutInput }); }, [rutInput, onChangeCustomerData]);
  useEffect(() => { onChangeCustomerData({ mpChannel }); }, [mpChannel, onChangeCustomerData]);

  // Base neta (consumo)
  const baseTotal = Math.max(0, Math.round(total || 0));

  // Descuento manual
  const discAmtManual = useMemo(() => {
    if (discountType === "pct") {
      const pct = Math.max(0, Math.min(100, toNumber(discountVal)));
      return Math.round((baseTotal * pct) / 100);
    }
    if (discountType === "amt") {
      return Math.min(baseTotal, toNumber(discountVal));
    }
    return 0;
  }, [discountType, discountVal, baseTotal]);

  // Cupón
  const discCoupon = useMemo(() => {
    if (!couponOk) return 0;
    if (couponOk.pct) return Math.round((baseTotal * couponOk.pct) / 100);
    if (couponOk.amount) return Math.min(baseTotal, couponOk.amount);
    return 0;
  }, [couponOk, baseTotal]);

  // Recargo
  const surchargeAmt = useMemo(() => {
    if (surchargeType === "pct") {
      const pct = Math.max(0, Math.min(100, toNumber(surchargeVal)));
      return Math.round((baseTotal * pct) / 100);
    }
    if (surchargeType === "amt") {
      return toNumber(surchargeVal);
    }
    return 0;
  }, [surchargeType, surchargeVal, baseTotal]);

  // Total a cobrar por consumo (sin propina)
  const netTotal = Math.max(0, baseTotal - discAmtManual - discCoupon + surchargeAmt);

  // Total final si paga en efectivo (consumo + propina)
  const grand = Math.round(netTotal + tipCash);

  // Vuelto (sólo efectivo)
  const change = Math.max(0, Math.round(cashIn - grand));

  const saleMethodMap: Record<PaymentMethod, string> = {
    efectivo: "EFECTIVO_SISTEMA",
    debito: "DEBITO_SISTEMA",
    credito: "CREDITO_SISTEMA",
    transferencia: "TRANSFERENCIA",
    mp: "MERCADO_PAGO",
  };

  const canConfirm = useMemo(() => {
    if (!current) return false;
    if (netTotal <= 0) return false;
    if (isPaying) return false;
    if (method === "efectivo") {
      if (cashIn <= 0) return false;
      if (cashIn < grand) return false; // no mixtos
    }
    if (docEnabled) {
      if (docType === "EFACTURA") {
        if (!rutInput?.trim() || !validateRut(rutInput)) return false;
        if (!razonSocial.trim()) return false;
      } else {
        if (rutInput?.trim() && !validateRut(rutInput)) return false;
      }
    }
    return true;
  }, [
    current,
    netTotal,
    isPaying,
    method,
    cashIn,
    grand,
    docEnabled,
    rutInput,
    docType,
    razonSocial,
  ]);

  /* =================== LÓGICA DE COBRO =================== */
  const doConfirmInternal = async () => {
    try {
      // 1) Registrar venta SOLO por el CONSUMO NETO – descuentos/recargos incluidos.
      if (cash.registerSale) {
        await cash.registerSale({
          amount: Math.round(netTotal),
          method: saleMethodMap[method],
          meta: {
            baseTotal,
            discountManual: discAmtManual || undefined,
            discountCoupon: discCoupon || undefined,
            surcharge: surchargeAmt || undefined,
            coupon: couponOk ? coupon.trim().toUpperCase() : undefined,
            tipCash: method === "efectivo" ? (tipCash || undefined) : undefined,
            channel: method === "mp" ? mpChannel || "local" : undefined,
            cashIn: method === "efectivo" ? cashIn : undefined,
            change: method === "efectivo" ? change : undefined,
          },
        });
      }

      // 2) Registrar propina cash (para arqueo)
      if (method === "efectivo" && tipCash > 0 && cash.addCashTip) {
        await cash.addCashTip(Math.round(tipCash), { from: "PayPanel" });
      }

      // 3) Documento fiscal por el CONSUMO NETO (sin propina)
      if (docEnabled) {
        if (cash.registerFiscalDoc) {
          await cash.registerFiscalDoc({
            docType: docType,
            amount: Math.round(netTotal),
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
      // Continuamos igual para no trancar el flujo de caja
    }

    // 4) Dejar propina para boleta (Extras → Propina)
    try {
      (window as any).__KOI_LAST_TIP__ = tipCash || 0;
    } catch {}

    onConfirmPay();
  };

  /* =================== HANDLERS =================== */
  const applyCoupon = () => {
    const code = coupon.trim().toUpperCase();
    const hit = PROMO_CODES.find((c) => c.code === code);
    setCouponOk(hit ? { pct: hit.pct, amount: hit.amount } : null);
  };

  const printPreCuenta80mm = () => {
    // Pre-cuenta simple (sin items, sólo resumen)
    const html = `<!doctype html>
<html><head><meta charset="utf-8" />
<title>Pre-Cuenta</title>
<style>
  @page { size: 80mm auto; margin: 0 }
  * { font-family: ui-monospace, Menlo, Monaco, Consolas, "Courier New", monospace; }
  body { padding: 8px 10px }
  .center { text-align:center }
  .muted { color:#666; font-size:12px }
  .big { font-weight:700; font-size:16px }
  hr { border:none; border-top:1px dashed #ddd; margin:8px 0 }
  table { width:100%; font-size:13px }
  td { padding:2px 0 }
  .tot { font-weight:700 }
</style></head>
<body>
  <div class="center big">SUSHIKOI</div>
  <div class="center muted">Pre-cuenta</div>
  <hr/>
  <table>
    <tr><td>Consumo base</td><td style="text-align:right">$${fmtCLP(baseTotal)}</td></tr>
    ${
      discAmtManual
        ? `<tr><td>Descuento</td><td style="text-align:right">-$${fmtCLP(discAmtManual)}</td></tr>`
        : ""
    }
    ${
      discCoupon
        ? `<tr><td>Cupón</td><td style="text-align:right">-$${fmtCLP(discCoupon)}</td></tr>`
        : ""
    }
    ${
      surchargeAmt
        ? `<tr><td>Recargo</td><td style="text-align:right">$${fmtCLP(surchargeAmt)}</td></tr>`
        : ""
    }
    <tr class="tot"><td>Subtotal</td><td style="text-align:right">$${fmtCLP(netTotal)}</td></tr>
    <tr><td>Propina (cash)</td><td style="text-align:right">$${fmtCLP(tipCash)}</td></tr>
    <tr class="tot"><td>Total</td><td style="text-align:right">$${fmtCLP(netTotal + tipCash)}</td></tr>
  </table>
  <hr/>
  <div class="muted">Método: ${method.toUpperCase()} ${
      method === "mp" && mpChannel ? `• MP (${mpChannel})` : ""
    }</div>
  <div class="muted">Fecha: ${new Date().toLocaleString("es-CL")}</div>
  <div class="center muted" style="margin-top:8px;">Gracias • Sushikoi Puerto Montt</div>
  <script>window.print(); setTimeout(()=>window.close(), 400);</script>
</body></html>`;
    const w = window.open("", "_blank", "width=420,height=720");
    if (!w) return;
    w.document.open(); w.document.write(html); w.document.close();
  };

  /* =================== UI =================== */
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CreditCard size={18} className="text-rose-600" />
          <h3 className="font-semibold text-gray-900">Pagar Pedido</h3>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">Consumo neto</div>
          <div className="text-xl font-extrabold text-gray-900">
            ${fmtCLP(netTotal)}
          </div>
          <div className="text-sm text-gray-600 mt-1">Total a cobrar</div>
          <div className="text-2xl font-extrabold text-rose-600">
            ${fmtCLP(grand)}
          </div>
          {tipCash > 0 && (
            <div className="text-xs text-gray-500">
              Incluye propina: ${fmtCLP(tipCash)}
            </div>
          )}
        </div>
      </div>

      {!current && (
        <div className="mb-4 p-3 rounded border border-yellow-200 bg-yellow-50 text-sm text-yellow-800">
          Debes <b>abrir la caja</b> desde el panel superior para poder cobrar.
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Columna 1: método + extras */}
        <div className="lg:col-span-1 space-y-4">
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Método</div>
            <div className="grid grid-cols-2 gap-2">
              <MethodCard
                icon={<DollarSign className="text-amber-600" />}
                label="Efectivo"
                active={method === "efectivo"}
                onClick={() => setMethod("efectivo")}
              />
              <MethodCard
                icon={<CreditCard className="text-blue-600" />}
                label="Débito"
                active={method === "debito"}
                onClick={() => setMethod("debito")}
              />
              <MethodCard
                icon={<CreditCard className="text-purple-600" />}
                label="Crédito"
                active={method === "credito"}
                onClick={() => setMethod("credito")}
              />
              <MethodCard
                icon={<Building2 className="text-green-700" />}
                label="Transferencia"
                active={method === "transferencia"}
                onClick={() => setMethod("transferencia")}
              />
              <div className="col-span-2">
                <MethodCard
                  icon={<CreditCard className="text-emerald-600" />}
                  label="Mercado Pago"
                  active={method === "mp"}
                  onClick={() => setMethod("mp")}
                />
              </div>
            </div>

            {method === "mp" && (
              <div className="mt-3">
                <label className="text-sm text-gray-700">Canal</label>
                <select
                  className="input mt-1"
                  value={mpChannel || ""}
                  onChange={(e) =>
                    setMpChannel(
                      (e.target.value as "delivery" | "local") || undefined
                    )
                  }
                >
                  <option value="">Seleccionar…</option>
                  <option value="local">Local</option>
                  <option value="delivery">Delivery</option>
                </select>
              </div>
            )}
          </div>

          {/* Documento */}
          <div className="border rounded-lg p-3">
            <div className="text-sm font-medium text-gray-700 mb-2">
              Documento
            </div>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={docEnabled}
                onChange={(e) => setDocEnabled(e.target.checked)}
              />
              <FileText size={14} /> Emitir documento
            </label>

            {docEnabled && (
              <div className="mt-2 space-y-2">
                <select
                  className="input"
                  value={docType}
                  onChange={(e) =>
                    setDocType(e.target.value as "EBOLETA" | "EFACTURA")
                  }
                >
                  <option value="EBOLETA">Boleta electrónica</option>
                  <option value="EFACTURA">Factura electrónica</option>
                </select>

                <div>
                  <label className="text-sm text-gray-700">
                    RUT {docType === "EFACTURA" ? "empresa" : "(opcional)"}
                  </label>
                  <input
                    className={`input mt-1 ${
                      (docType === "EFACTURA" && !rutInput.trim()) ||
                      (rutInput && !validateRut(rutInput))
                        ? "border-red-400"
                        : ""
                    }`}
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
                    <label className="text-sm text-gray-700">
                      Razón Social
                    </label>
                    <input
                      className={`input mt-1 ${
                        !razonSocial.trim() ? "border-red-400" : ""
                      }`}
                      placeholder="Nombre empresa"
                      value={razonSocial}
                      onChange={(e) => setRazonSocial(e.target.value)}
                    />
                  </div>
                )}

                {!cash.registerFiscalDoc && (
                  <div className="p-2 rounded bg-yellow-50 border border-yellow-200 text-xs text-yellow-800 flex items-center gap-2">
                    <AlertTriangle size={14} /> Tu{" "}
                    <code>cashupContext</code> no implementa{" "}
                    <b>registerFiscalDoc</b>. Se creará el pedido igual, pero no
                    quedará el registro fiscal.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Columna 2: efectivo / calculadora + descuentos */}
        <div className="lg:col-span-1 space-y-4">
          <div className="border rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-700">
                Detalles de pago
              </div>
              {method === "efectivo" && (
                <button
                  className="text-xs px-2 py-1 border rounded-md hover:bg-gray-50 inline-flex items-center gap-1"
                  onClick={() => {
                    setShowNumpad((v) => !v);
                    setTimeout(() => cashInputRef.current?.focus(), 40);
                  }}
                  title="Teclado numérico"
                >
                  <Calculator size={12} /> Numpad
                </button>
              )}
            </div>

            {method === "efectivo" ? (
              <div className="mt-2 space-y-2">
                <label className="text-sm text-gray-700">¿Con cuánto paga?</label>
                <input
                  ref={cashInputRef}
                  className="input mt-1"
                  placeholder="$"
                  inputMode="numeric"
                  value={cashInStr}
                  onChange={(e) => setCashInStr(e.target.value)}
                />
                <QuickCashButtons value={cashInStr} onChange={setCashInStr} />
                {showNumpad && (
                  <div className="mt-2">
                    <Numpad
                      onAppend={(d) => setCashInStr((s) => (s + d).replace(/^0+/, ""))}
                      onBackspace={() => setCashInStr((s) => s.slice(0, -1))}
                      onClear={() => setCashInStr("")}
                    />
                  </div>
                )}
                <div className="mt-2 text-sm">
                  <div className="text-gray-600">
                    Consumo neto: <b>${fmtCLP(netTotal)}</b>
                  </div>
                  <div className="text-gray-600">
                    Propina: <b>${fmtCLP(tipCash)}</b>
                  </div>
                  <div className="text-gray-900">
                    Total a cobrar: <b>${fmtCLP(grand)}</b>
                  </div>
                  <div
                    className={`${
                      cashIn >= grand ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {cashIn >= grand ? "Vuelto" : "Falta"}:{" "}
                    <b>${fmtCLP(Math.abs(cashIn - grand))}</b>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-1 text-sm text-gray-500">
                El consumo se cobrará íntegro con <b>{method.toUpperCase()}</b>.
                <br />
                No se permiten pagos mixtos. La propina en efectivo se registra
                por separado en la caja.
              </div>
            )}
          </div>

          {/* Descuento / Recargo */}
          <div className="border rounded-lg p-3">
            <div className="text-sm font-medium text-gray-700 mb-2">
              Descuento y recargo (pago)
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Descuento */}
              <div className="border rounded-md p-2 bg-gray-50">
                <div className="flex items-center gap-1 text-sm font-medium">
                  <BadgePercent size={14} className="text-rose-600" />
                  Descuento
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <select
                    className="input"
                    value={discountType}
                    onChange={(e) =>
                      setDiscountType(e.target.value as "none" | "pct" | "amt")
                    }
                  >
                    <option value="none">Ninguno</option>
                    <option value="pct">% Porcentaje</option>
                    <option value="amt">$ Monto</option>
                  </select>
                  <input
                    className="input"
                    placeholder={discountType === "pct" ? "%" : "$"}
                    inputMode="numeric"
                    value={discountVal}
                    onChange={(e) => setDiscountVal(e.target.value)}
                    disabled={discountType === "none"}
                  />
                </div>
                {discAmtManual > 0 && (
                  <div className="text-xs text-gray-600 mt-1">
                    Descuento aplicado: <b>${fmtCLP(discAmtManual)}</b>
                  </div>
                )}
              </div>

              {/* Recargo */}
              <div className="border rounded-md p-2 bg-gray-50">
                <div className="flex items-center gap-1 text-sm font-medium">
                  <BadgeDollarSign size={14} className="text-emerald-600" />
                  Recargo
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <select
                    className="input"
                    value={surchargeType}
                    onChange={(e) =>
                      setSurchargeType(
                        e.target.value as "none" | "pct" | "amt"
                      )
                    }
                  >
                    <option value="none">Ninguno</option>
                    <option value="pct">% Porcentaje</option>
                    <option value="amt">$ Monto</option>
                  </select>
                  <input
                    className="input"
                    placeholder={surchargeType === "pct" ? "%" : "$"}
                    inputMode="numeric"
                    value={surchargeVal}
                    onChange={(e) => setSurchargeVal(e.target.value)}
                    disabled={surchargeType === "none"}
                  />
                </div>
                {surchargeAmt > 0 && (
                  <div className="text-xs text-gray-600 mt-1">
                    Recargo aplicado: <b>${fmtCLP(surchargeAmt)}</b>
                  </div>
                )}
              </div>
            </div>

            {/* Cupón */}
            <div className="mt-2">
              <div className="text-sm font-medium text-gray-700 mb-1">
                Cupón / código promo
              </div>
              <div className="flex items-center gap-2">
                <input
                  className="input"
                  placeholder="Ej.: KOI10"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                />
                <button
                  className="px-3 py-2 border rounded-md hover:bg-gray-50 text-sm inline-flex items-center gap-1"
                  onClick={applyCoupon}
                >
                  <Wand2 size={14} /> Aplicar
                </button>
              </div>
              {couponOk ? (
                <div className="text-xs text-emerald-700 mt-1">
                  Cupón aplicado:{" "}
                  {couponOk.pct
                    ? `${couponOk.pct}%`
                    : `$${fmtCLP(couponOk.amount || 0)}`}{" "}
                  — ahorro: <b>${fmtCLP(discCoupon)}</b>
                </div>
              ) : coupon.trim() ? (
                <div className="text-xs text-amber-700 mt-1">
                  No coincide con la lista actual.
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Columna 3: resumen y acciones */}
        <div className="lg:col-span-1 space-y-4">
          <div className="border rounded-lg p-3 bg-gray-50">
            <div className="text-sm font-semibold mb-2">Resumen</div>
            <Row label="Consumo base" value={`$${fmtCLP(baseTotal)}`} />
            {discAmtManual > 0 && (
              <Row label="Descuento" value={`-$${fmtCLP(discAmtManual)}`} />
            )}
            {discCoupon > 0 && (
              <Row label="Cupón" value={`-$${fmtCLP(discCoupon)}`} />
            )}
            {surchargeAmt > 0 && (
              <Row label="Recargo" value={`$${fmtCLP(surchargeAmt)}`} />
            )}
            <Row label="Consumo neto" value={<b>${fmtCLP(netTotal)}</b>} />
            <Row label="Propina (cash)" value={`$${fmtCLP(tipCash)}`} />
            <div className="mt-2 pt-2 border-t">
              <div className="flex items-center justify-between text-base">
                <span>Total a cobrar</span>
                <b className="text-rose-600 text-xl">${fmtCLP(grand)}</b>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onBackToCart}
              className="px-3 py-2 border rounded-lg hover:bg-gray-50 inline-flex items-center gap-2"
            >
              <ChevronLeft size={16} /> Volver
            </button>
            <button
              onClick={printPreCuenta80mm}
              className="px-3 py-2 border rounded-lg hover:bg-gray-50 inline-flex items-center gap-2"
              title="Imprimir pre-cuenta 80mm"
            >
              <Printer size={16} /> Pre-cuenta
            </button>
          </div>

          <button
            disabled={!canConfirm}
            onClick={() => setTipAskOpen(true)}
            className={`w-full px-4 py-2 rounded-lg text-white inline-flex items-center justify-center gap-2 ${
              canConfirm
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            <CheckCircle2 size={16} /> Confirmar y Cobrar
          </button>

          <div className="text-xs text-gray-500">
            • La <b>propina en efectivo</b> no se incluye en el documento fiscal y se registra
            en la caja como propina. <br />
            • No se permiten pagos mixtos en esta vista.
          </div>
        </div>
      </div>

      {/* Modal propina */}
      <TipModal
        open={tipAskOpen}
        total={netTotal}
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
