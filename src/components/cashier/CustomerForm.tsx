// src/components/cashier/CustomerForm.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  User, Phone, Home, Hash, MapPin, MessageSquare,
  AlertCircle, Package, Truck, Store, Edit3, CheckCircle, Save
} from "lucide-react";
import { CustomerSearch } from "./CustomerSearch";
import { useCustomers } from "@/features/customers/useCustomers";
import type { CustomerRecord } from "@/features/customers/types";
import { normalizePhone } from "@/lib/format";

/* ===================== Tipos ===================== */
interface CartItem {
  id: number;
  name: string;
  description: string;
  items: string[];
  originalPrice: number;
  discountPrice: number;
  discount: number;
  image: string;
  popular: boolean;
  cookingTime: number;
  quantity: number;
}

export type ServiceType = "delivery" | "local";
export type Protein = "pollo" | "salmon" | "camaron" | "kanikama" | "loco" | "pulpo";

interface ChangeLine { from?: Protein; to?: Protein; fee: number; }
interface SauceLine { qty: number; included?: number; extraFee?: number; feeTotal?: number; }

export interface OrderMeta {
  service: ServiceType;
  deliveryZone?: string;
  deliveryFee?: number;
  chopsticks?: number;
  changes?: ChangeLine[];
  soy?: SauceLine;
  ginger?: SauceLine;
  wasabi?: SauceLine;
  agridulce?: SauceLine;
  acevichada?: SauceLine;
  extrasTotal?: number;
}

export interface CustomerFormData {
  name: string;
  phone: string;
  street: string;
  number: string;
  sector: string;
  city: string;
  references: string;
  // Los siguientes campos existen para compatibilidad, pero NO se editan aquí
  paymentMethod: "efectivo" | "debito" | "credito" | "transferencia" | "mp";
  paymentStatus: string;
  dueMethod: string;
  mpChannel?: "delivery" | "local";
}

interface FormErrors { [key: string]: string; }

/** Compat: forma básica de cliente que a veces recibes “legacy” */
interface LegacyCustomer {
  name: string;
  phone: string;
  street: string;
  number: string;
  sector?: string;
  city?: string;
  references?: string;
  totalOrders?: number;
  totalSpent?: number;
  lastOrderAt?: number;
}

interface CustomerFormProps {
  customerData: CustomerFormData;
  onCustomerDataChange: (data: CustomerFormData) => void;
  errors: FormErrors;

  /** Legacy: si llega lo usamos, pero preferimos useCustomers() */
  customers?: LegacyCustomer[];
  onSelectCustomer: (customer: LegacyCustomer) => void;

  cart: CartItem[];
  cartTotal: number;
  estimatedTime: number;

  /** Compat (no usados aquí): */
  onCreateOrder?: () => void;
  isCreatingOrder?: boolean;

  orderMeta?: OrderMeta;
  onRequestEditExtras?: () => void;
  onGoToCart: () => void;
}

/* ===================== Constantes ===================== */
const CITIES = ["Puerto Montt", "Puerto Varas", "Osorno", "Castro"];
const formatCLP = (n: number) => new Intl.NumberFormat("es-CL").format(n);

/* ===================== Helpers ===================== */
type CustomerMode = "new" | "existing";
const clean = (s?: string) => (s ?? "").trim();
const isPhoneOk = (p?: string) => normalizePhone(clean(p)).length >= 9;

const validateCustomer = (c: CustomerFormData): FormErrors => {
  const e: FormErrors = {};
  if (!clean(c.name) || clean(c.name).length < 3) e.name = "Nombre mínimo 3 caracteres";
  if (!isPhoneOk(c.phone)) e.phone = "Teléfono inválido";
  if (!clean(c.street)) e.street = "Calle obligatoria";
  if (!clean(c.number)) e.number = "Número obligatorio";
  if (!clean(c.city)) e.city = "Ciudad obligatoria";
  return e;
};

/* ===================== Componente ===================== */
function CustomerForm({
  customerData,
  onCustomerDataChange,
  errors,
  customers,                    // legacy (opcional)
  onSelectCustomer,
  cart,
  cartTotal,
  estimatedTime,
  onCreateOrder: _onCreateOrder,     // evitamos warning TS (no se usa aquí)
  isCreatingOrder: _isCreatingOrder, // idem
  orderMeta,
  onRequestEditExtras,
  onGoToCart,
}: CustomerFormProps) {
  const { addOrUpdateCustomer, customers: allCustomers } = useCustomers();

  const [customerMode, setCustomerMode] = useState<CustomerMode>("new");
  const [allowEditExisting, setAllowEditExisting] = useState(false);

  const hasCartItems = cart.length > 0;
  const canGoToCart = hasCartItems;

  /** Preferimos la data de useCustomers; si no existe, caemos a la legacy */
  const searchSource: LegacyCustomer[] =
    (allCustomers?.length ? allCustomers : (customers ?? [])) as any;

  /* ======= Preselección de canal MP según servicio (compat) ======= */
  const requiresMpChannel = customerData.paymentMethod === "mp";
  useEffect(() => {
    if (!requiresMpChannel) return;
    if (!orderMeta?.service) return;
    if (!customerData.mpChannel) {
      onCustomerDataChange({ ...customerData, mpChannel: orderMeta.service });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requiresMpChannel, orderMeta?.service]);

  /* ======= Extras y totales ======= */
  const feeOf = (s?: { extraFee?: number; feeTotal?: number }) => s?.extraFee ?? s?.feeTotal ?? 0;

  const saucesFee = useMemo(() => {
    return feeOf(orderMeta?.soy)
      + feeOf(orderMeta?.ginger)
      + feeOf(orderMeta?.wasabi)
      + feeOf(orderMeta?.agridulce)
      + feeOf(orderMeta?.acevichada);
  }, [orderMeta]);

  const changesFee = useMemo(
    () => (orderMeta?.changes ?? []).reduce((s, c) => s + (c?.fee ?? 0), 0),
    [orderMeta]
  );

  const deliveryFee = orderMeta?.deliveryFee ?? 0;

  const extrasTotal = useMemo(() => {
    return typeof orderMeta?.extrasTotal === "number"
      ? orderMeta.extrasTotal
      : changesFee + saucesFee + deliveryFee;
  }, [orderMeta?.extrasTotal, changesFee, saucesFee, deliveryFee]);

  const grandTotal = cartTotal + extrasTotal;

  /* ======= EXISTENTE seleccionado (resumen compacto) ======= */
  const existingSelected =
    customerMode === "existing" &&
    !!customerData.name &&
    !!customerData.phone &&
    !!customerData.street &&
    !!customerData.number &&
    !allowEditExisting;

  /* ======= setters ======= */
  const setField = (field: keyof CustomerFormData, value: string | undefined) =>
    onCustomerDataChange({ ...customerData, [field]: value } as CustomerFormData);

  /* ======= persistencia ======= */
  const persistCustomer = (): CustomerRecord | null => {
    const localErrors = validateCustomer(customerData);
    if (Object.keys(localErrors).length) {
      alert("Faltan datos del cliente. Revisa los campos marcados.");
      return null;
    }

    const saved = addOrUpdateCustomer({
      name: clean(customerData.name),
      phone: normalizePhone(customerData.phone),
      street: clean(customerData.street),
      number: clean(customerData.number),
      sector: clean(customerData.sector),
      city: clean(customerData.city),
      references: clean(customerData.references),
    } as any);

    // Notifica selección inmediata al contenedor
    onSelectCustomer?.({
      name: saved.name,
      phone: saved.phone,
      street: saved.street,
      number: saved.number,
      sector: saved.sector,
      city: saved.city,
      references: saved.references,
    });

    return saved;
  };

  /* ===================== UI ===================== */
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header + Toggle */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
              <User className="text-rose-600" />
              Datos del Cliente
            </h2>

            <div className="bg-gray-100 rounded-lg p-1 flex">
              <button
                onClick={() => { setCustomerMode("new"); setAllowEditExisting(false); }}
                className={`px-4 py-2 text-sm rounded-md transition-colors ${
                  customerMode === "new" ? "bg-rose-600 text-white shadow-md" : "text-gray-700 hover:bg-gray-200"
                }`}
                title="Registrar nuevo cliente"
              >
                Nuevo Cliente
              </button>
              <button
                onClick={() => { setCustomerMode("existing"); setAllowEditExisting(false); }}
                className={`px-4 py-2 text-sm rounded-md transition-colors ${
                  customerMode === "existing" ? "bg-rose-600 text-white shadow-md" : "text-gray-700 hover:bg-gray-200"
                }`}
                title="Buscar cliente ya registrado"
              >
                Cliente Existente
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Buscador cuando es cliente existente */}
      {customerMode === "existing" && (
        <CustomerSearch
          customers={searchSource}
          onSelectCustomer={(c) => {
            onCustomerDataChange({
              ...customerData,
              name: c.name,
              phone: c.phone,
              street: c.street,
              number: c.number,
              sector: c.sector ?? "",
              city: c.city ?? CITIES[0],
              references: c.references ?? "",
            });
            onSelectCustomer(c);
          }}
        />
      )}

      {/* EXISTENTE seleccionado -> resumen + acciones */}
      {existingSelected && (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle size={18} />
                  <span className="font-semibold">Cliente seleccionado</span>
                </div>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
                  <div><User size={14} className="inline mr-1" /> {customerData.name}</div>
                  <div><Phone size={14} className="inline mr-1" /> {customerData.phone}</div>
                  <div className="md:col-span-2">
                    <Home size={14} className="inline mr-1" />
                    {customerData.street} {customerData.number}
                    {customerData.sector ? `, ${customerData.sector}` : ""} — {customerData.city}
                  </div>
                  {customerData.references && (
                    <div className="md:col-span-2 text-gray-600">
                      <MessageSquare size={14} className="inline mr-1" /> {customerData.references}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="h-10 px-3 rounded-lg border hover:bg-gray-50 text-sm flex items-center gap-1"
                  onClick={() => setAllowEditExisting(true)}
                  title="Editar datos del cliente"
                >
                  <Edit3 size={16} /> Editar
                </button>
                <button
                  className="h-10 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm flex items-center gap-1"
                  onClick={() => persistCustomer()}
                  title="Guardar/actualizar en clientes"
                >
                  <Save size={16} /> Guardar
                </button>
              </div>
            </div>

            <OrderTotals
              cartTotal={cartTotal}
              extrasTotal={extrasTotal}
              grandTotal={grandTotal}
              service={orderMeta?.service}
              deliveryFee={deliveryFee}
              onRequestEditExtras={onRequestEditExtras}
              estimatedTime={estimatedTime}
            />

            <div className="mt-3 flex gap-3">
              <button
                onClick={onGoToCart}
                disabled={!canGoToCart}
                className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Enviar a carrito
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formulario completo (nuevo o editar existente) */}
      {!existingSelected && (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="Nombre completo"
                icon={<User size={16} />}
                value={customerData.name}
                onChange={(v) => setField("name", v)}
                placeholder="Ej: María Soto"
                error={errors.name}
              />
              <Field
                label="Teléfono"
                icon={<Phone size={16} />}
                value={customerData.phone}
                onChange={(v) => setField("phone", v)}
                placeholder="+56 9 1234 5678"
                error={errors.phone}
              />
              <Field
                label="Calle"
                icon={<Home size={16} />}
                value={customerData.street}
                onChange={(v) => setField("street", v)}
                placeholder="Ej: Av. Capitán Ávalos"
                error={errors.street}
              />
              <Field
                label="Número"
                icon={<Hash size={16} />}
                value={customerData.number}
                onChange={(v) => setField("number", v)}
                placeholder="Ej: 6130"
                error={errors.number}
              />
              <Field
                label="Población / Sector (opcional)"
                icon={<MapPin size={16} />}
                value={customerData.sector}
                onChange={(v) => setField("sector", v)}
                placeholder="Ej: Mirasol, Puerto Sur"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin size={16} className="inline mr-1" /> Ciudad
                </label>
                <select
                  value={customerData.city}
                  onChange={(e) => setField("city", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                >
                  {CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {errors.city && <ErrorText text={errors.city} />}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MessageSquare size={16} className="inline mr-1" /> Referencias (opcional)
              </label>
              <textarea
                value={customerData.references}
                onChange={(e) => setField("references", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                rows={3}
                placeholder="Ej: Casa amarilla con reja negra, frente al semáforo…"
              />
            </div>

            {/* Totales + extras (sin controles de pago en esta pestaña) */}
            <OrderTotals
              cartTotal={cartTotal}
              extrasTotal={extrasTotal}
              grandTotal={grandTotal}
              service={orderMeta?.service}
              deliveryFee={deliveryFee}
              onRequestEditExtras={onRequestEditExtras}
              estimatedTime={estimatedTime}
            />

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={() => persistCustomer()}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white"
                title="Guardar cliente"
              >
                <Save size={16} /> Guardar cliente
              </button>
              <button
                onClick={() => {
                  const saved = persistCustomer();
                  if (saved) onGoToCart();
                }}
                disabled={!canGoToCart}
                className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Enviar a carrito
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ========== UI auxiliares ========== */
const Field: React.FC<{
  label: string;
  icon?: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
}> = ({ label, icon, value, onChange, placeholder, error }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {icon && <span className="inline-block mr-1 align-middle">{icon}</span>} {label}
    </label>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent ${
        error ? "border-rose-500" : "border-gray-300"
      }`}
    />
    {error && <ErrorText text={error} />}
  </div>
);

const ErrorText: React.FC<{ text: string }> = ({ text }) => (
  <p className="text-rose-600 text-xs mt-1 flex items-center gap-1">
    <AlertCircle size={12} /> {text}
  </p>
);

const OrderTotals: React.FC<{
  cartTotal: number;
  extrasTotal: number;
  grandTotal: number;
  service?: ServiceType;
  deliveryFee: number;
  onRequestEditExtras?: () => void;
  estimatedTime: number; // ✅ agregado
}> = ({ cartTotal, extrasTotal, grandTotal, service = "local", deliveryFee, onRequestEditExtras, estimatedTime }) => (
  <div className="mt-6 bg-gray-50 rounded-lg border p-3 text-sm text-gray-700">
    <div className="flex flex-wrap items-center gap-2">
      <Package size={16} className="text-rose-600" />
      <b>Total carrito:</b> ${formatCLP(cartTotal)}
      <span className="hidden sm:inline mx-2 text-gray-300">•</span>
      <b>Extras:</b> ${formatCLP(extrasTotal)}
      <span className="hidden sm:inline mx-2 text-gray-300">•</span>
      <b>Total:</b>{" "}
      <span className="text-rose-600 font-semibold">${formatCLP(grandTotal)}</span>
    </div>
    <div className="mt-1 text-xs text-gray-500">
      <Store size={12} className="inline mr-1" /> Servicio: {service}
      {service === "delivery" && (
        <>
          {" "}— <Truck size={12} className="inline mr-1" /> Delivery: ${formatCLP(deliveryFee)}
        </>
      )}
      {onRequestEditExtras && (
        <button onClick={onRequestEditExtras} className="ml-2 text-blue-600 hover:underline">
          editar extras
        </button>
      )}
    </div>
    <div className="text-xs text-gray-400 mt-1">⏱️ Tiempo estimado: {estimatedTime} min</div>
  </div>
);

/* Exports seguros: named + default */
export { CustomerForm };
export default CustomerForm;
