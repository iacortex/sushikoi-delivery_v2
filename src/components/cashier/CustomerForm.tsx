// src/components/cashier/CustomerForm.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  User, Phone, Home, Hash, MapPin, MessageSquare,
  AlertCircle, CreditCard, Package, Truck, Store, Edit3, CheckCircle
} from 'lucide-react';
import { CustomerSearch } from './CustomerSearch';

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

export type ServiceType = 'delivery' | 'local';
export type Protein = 'pollo' | 'salmon' | 'camaron' | 'kanikama' | 'loco' | 'pulpo';

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

interface CustomerFormData {
  name: string;
  phone: string;
  street: string;
  number: string;
  sector: string;
  city: string;
  references: string;
  paymentMethod: 'efectivo' | 'debito' | 'credito' | 'transferencia' | 'mp';
  paymentStatus: string;
  dueMethod: string;
  mpChannel?: 'delivery' | 'local';
}

interface FormErrors { [key: string]: string; }

interface Customer {
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
  customers: Customer[];
  onSelectCustomer: (customer: Customer) => void;
  cart: CartItem[];
  cartTotal: number;
  estimatedTime: number;

  /** Antes creaba el pedido; ahora el CTA manda al carrito */
  onCreateOrder: () => void;          // lo dejamos por compatibilidad (no se usa en el botón)
  isCreatingOrder: boolean;

  // Extras del pedido (delivery + cambios + salsas) desde el modal de promociones
  orderMeta?: OrderMeta;
  onRequestEditExtras?: () => void;

  /** Nuevo: callback para ir al tab Carrito */
  onGoToCart: () => void;
}

/* ===================== Constantes ===================== */
const PAYMENT_METHODS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'debito', label: 'Tarjeta de Débito' },
  { value: 'credito', label: 'Tarjeta de Crédito' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'mp', label: 'Mercado Pago' },
];

const CITIES = ['Puerto Montt', 'Puerto Varas', 'Osorno', 'Castro'];

const formatCLP = (amount: number) => new Intl.NumberFormat('es-CL').format(amount);

/* ===================== Componente ===================== */
type CustomerMode = 'new' | 'existing';

export const CustomerForm: React.FC<CustomerFormProps> = ({
  customerData,
  onCustomerDataChange,
  errors,
  customers,
  onSelectCustomer,
  cart,
  cartTotal,
  estimatedTime,
  onCreateOrder,
  isCreatingOrder,
  orderMeta,
  onRequestEditExtras,
  onGoToCart,
}) => {
  const [customerMode, setCustomerMode] = useState<CustomerMode>('new');
  const [allowEditExisting, setAllowEditExisting] = useState(false);

  const handleInputChange = (field: keyof CustomerFormData, value: string | undefined) => {
    onCustomerDataChange({ ...customerData, [field]: value } as CustomerFormData);
  };

  const requiresMpChannel = customerData.paymentMethod === 'mp';

  // Prefill de canal MP según servicio
  useEffect(() => {
    if (!requiresMpChannel) return;
    if (!orderMeta?.service) return;
    if (!customerData.mpChannel) {
      handleInputChange('mpChannel', orderMeta.service);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requiresMpChannel, orderMeta?.service]);

  // Helper para obtener el costo de una salsa sin mezclar ?? y ||
  const feeOf = (s?: { extraFee?: number; feeTotal?: number }) =>
    (s?.extraFee ?? s?.feeTotal ?? 0);

  // Cálculos de extras
  const saucesFee = useMemo(() => {
    const soyFee = feeOf(orderMeta?.soy);
    const gFee   = feeOf(orderMeta?.ginger);
    const wFee   = feeOf(orderMeta?.wasabi);
    const agFee  = feeOf(orderMeta?.agridulce);
    const acFee  = feeOf(orderMeta?.acevichada);
    return soyFee + gFee + wFee + agFee + acFee;
  }, [orderMeta]);

  const changesFee = useMemo(() => {
    return (orderMeta?.changes ?? []).reduce((s, c) => s + (c?.fee ?? 0), 0);
  }, [orderMeta]);

  const deliveryFee = orderMeta?.deliveryFee ?? 0;

  const extrasTotal = useMemo(() => {
    return typeof orderMeta?.extrasTotal === 'number'
      ? orderMeta.extrasTotal
      : (changesFee + saucesFee + deliveryFee);
  }, [orderMeta?.extrasTotal, changesFee, saucesFee, deliveryFee]);

  const grandTotal = cartTotal + extrasTotal;

  const hasCartItems = cart.length > 0;

  // Para enviar a carrito NO exigimos todos los campos del cliente;
  // sólo que exista al menos un item
  const canGoToCart = hasCartItems;

  // 👉 cliente existente seleccionado (no mostrar el formulario largo)
  const existingSelected =
    customerMode === 'existing' &&
    !!customerData.name &&
    !!customerData.phone &&
    !!customerData.street &&
    !!customerData.number &&
    !allowEditExisting;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header + Toggle */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
              <User className="text-red-500" />
              Datos del Cliente
            </h2>

            <div className="bg-gray-100 rounded-lg p-1 flex">
              <button
                onClick={() => { setCustomerMode('new'); setAllowEditExisting(false); }}
                className={`px-4 py-2 text-sm rounded-md transition-colors ${
                  customerMode === 'new' ? 'bg-red-500 text-white shadow-md' : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                Nuevo Cliente
              </button>
              <button
                onClick={() => { setCustomerMode('existing'); setAllowEditExisting(false); }}
                className={`px-4 py-2 text-sm rounded-md transition-colors ${
                  customerMode === 'existing' ? 'bg-red-500 text-white shadow-md' : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                Cliente Existente
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Buscador cuando es cliente existente */}
      {customerMode === 'existing' && (
        <CustomerSearch customers={customers} onSelectCustomer={onSelectCustomer} />
      )}

      {/* Si es EXISTENTE y ya seleccionaste uno: solo resumen (sin formulario) */}
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
                    {customerData.sector ? `, ${customerData.sector}` : ''} — {customerData.city}
                  </div>
                  {customerData.references && (
                    <div className="md:col-span-2 text-gray-600">
                      <MessageSquare size={14} className="inline mr-1" /> {customerData.references}
                    </div>
                  )}
                </div>
              </div>

              <button
                className="h-10 px-3 rounded-lg border hover:bg-gray-50 text-sm flex items-center gap-1"
                onClick={() => setAllowEditExisting(true)}
                title="Editar datos del cliente"
              >
                <Edit3 size={16}/> Editar datos
              </button>
            </div>

            {/* Pago + extras + CTA */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <CreditCard size={16} className="inline mr-1" /> Método de pago
                </label>
                <select
                  value={customerData.paymentMethod}
                  onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  {PAYMENT_METHODS.map((m) => (<option key={m.value} value={m.value}>{m.label}</option>))}
                </select>

                {customerData.paymentMethod === 'mp' && (
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Canal de cobro MP
                    </label>
                    <select
                      value={customerData.mpChannel ?? ''}
                      onChange={(e) => handleInputChange('mpChannel', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="">Selecciona canal…</option>
                      <option value="local">Local</option>
                      <option value="delivery">Delivery</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <div className="bg-gray-50 rounded-lg border p-3 text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <Package size={16} className="text-rose-600" />
                    <b>Total carrito:</b> ${formatCLP(cartTotal)}
                    <span className="mx-2 text-gray-400">•</span>
                    <b>Extras:</b> ${formatCLP(extrasTotal)}
                    <span className="mx-2 text-gray-400">•</span>
                    <b>Total:</b> <span className="text-rose-600 font-semibold">${formatCLP(grandTotal)}</span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    <Store size={12} className="inline mr-1" /> Servicio: {orderMeta?.service ?? 'local'}
                    {orderMeta?.service === 'delivery' && (
                      <> — <Truck size={12} className="inline mr-1" /> Delivery: ${formatCLP(deliveryFee)}</>
                    )}
                    {onRequestEditExtras && (
                      <button onClick={onRequestEditExtras} className="ml-2 text-blue-600 hover:underline">
                        editar extras
                      </button>
                    )}
                  </div>
                </div>

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
          </div>
        </div>
      )}

      {/* Formulario completo:
          - visible para NUEVO cliente
          - o si EXISTENTE pero hiciste clic en “Editar datos” */}
      {(!existingSelected) && (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User size={16} className="inline mr-1" /> Nombre completo
                </label>
                <input
                  type="text"
                  value={customerData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ej: Cristian Hu"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1 flex items-center gap-1"><AlertCircle size={12} />{errors.name}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Phone size={16} className="inline mr-1" /> Teléfono
                </label>
                <input
                  type="tel"
                  value={customerData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="+56 9 1234 5678"
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1 flex items-center gap-1"><AlertCircle size={12} />{errors.phone}</p>}
              </div>

              {/* Street */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Home size={16} className="inline mr-1" /> Calle
                </label>
                <input
                  type="text"
                  value={customerData.street}
                  onChange={(e) => handleInputChange('street', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                    errors.street ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ej: Av. Capitán Ávalos"
                />
                {errors.street && <p className="text-red-500 text-sm mt-1 flex items-center gap-1"><AlertCircle size={12} />{errors.street}</p>}
              </div>

              {/* Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Hash size={16} className="inline mr-1" /> Número
                </label>
                <input
                  type="text"
                  value={customerData.number}
                  onChange={(e) => handleInputChange('number', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                    errors.number ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ej: 6130"
                />
                {errors.number && <p className="text-red-500 text-sm mt-1 flex items-center gap-1"><AlertCircle size={12} />{errors.number}</p>}
              </div>

              {/* Sector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin size={16} className="inline mr-1" /> Población / Sector (opcional)
                </label>
                <input
                  type="text"
                  value={customerData.sector}
                  onChange={(e) => handleInputChange('sector', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Ej: Mirasol, Puerto Sur"
                />
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin size={16} className="inline mr-1" /> Ciudad
                </label>
                <select
                  value={customerData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  {CITIES.map((city) => (<option key={city} value={city}>{city}</option>))}
                </select>
              </div>
            </div>

            {/* Referencias */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MessageSquare size={16} className="inline mr-1" /> Referencias (opcional)
              </label>
              <textarea
                value={customerData.references}
                onChange={(e) => handleInputChange('references', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows={3}
                placeholder="Ej: Casa amarilla con reja negra, frente al semáforo..."
              />
            </div>

            {/* Pago */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <CreditCard size={16} className="inline mr-1" /> Método de pago
                </label>
                <select
                  value={customerData.paymentMethod}
                  onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  {PAYMENT_METHODS.map((m) => (<option key={m.value} value={m.value}>{m.label}</option>))}
                </select>
              </div>

              {customerData.paymentMethod === 'mp' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Canal de cobro MP
                  </label>
                  <select
                    value={customerData.mpChannel ?? ''}
                    onChange={(e) => handleInputChange('mpChannel', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="">Selecciona canal…</option>
                    <option value="local">Local</option>
                    <option value="delivery">Delivery</option>
                  </select>
                </div>
              )}
            </div>

            {/* Resumen + CTA */}
            <div className="mt-6 bg-gray-50 rounded-lg border p-3 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <Package size={16} className="text-rose-600" />
                <b>Total carrito:</b> ${formatCLP(cartTotal)}
                <span className="mx-2 text-gray-400">•</span>
                <b>Extras:</b> ${formatCLP(extrasTotal)}
                <span className="mx-2 text-gray-400">•</span>
                <b>Total:</b> <span className="text-rose-600 font-semibold">${formatCLP(grandTotal)}</span>
              </div>
              <div className="mt-1 text-xs text-gray-500">
                <Store size={12} className="inline mr-1" /> Servicio: {orderMeta?.service ?? 'local'}
                {orderMeta?.service === 'delivery' && (
                  <> — <Truck size={12} className="inline mr-1" /> Delivery: ${formatCLP(deliveryFee)}</>
                )}
                {onRequestEditExtras && (
                  <button onClick={onRequestEditExtras} className="ml-2 text-blue-600 hover:underline">
                    editar extras
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 flex gap-3">
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
    </div>
  );
};
