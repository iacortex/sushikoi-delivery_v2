import React, { useState } from 'react';
import { 
  User, Phone, Home, Hash, MapPin, MessageSquare, 
  AlertCircle, CreditCard, DollarSign, Wallet, Package, 
  Loader2, Search 
} from 'lucide-react';
import { CustomerSearch } from './CustomerSearch';

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

interface CustomerFormData {
  name: string;
  phone: string;
  street: string;
  number: string;
  sector: string;
  city: string;
  references: string;
  paymentMethod: string;
  paymentStatus: string;
  dueMethod: string;
}

interface FormErrors {
  [key: string]: string;
}

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
  onCreateOrder: () => void;
  isCreatingOrder: boolean;
}

const PAYMENT_METHODS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'debito', label: 'Tarjeta de Débito' },
  { value: 'credito', label: 'Tarjeta de Crédito' },
  { value: 'transferencia', label: 'Transferencia' }
];

const CITIES = ['Puerto Montt', 'Puerto Varas', 'Osorno', 'Castro'];

const formatCLP = (amount: number) => {
  return new Intl.NumberFormat('es-CL').format(amount);
};

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
}) => {
  const [customerMode, setCustomerMode] = useState<CustomerMode>('new');

  const handleInputChange = (field: keyof CustomerFormData, value: string) => {
    onCustomerDataChange({
      ...customerData,
      [field]: value,
    });
  };

  const hasCartItems = cart.length > 0;
  const canCreateOrder = hasCartItems && 
                         customerData.name && 
                         customerData.phone && 
                         customerData.street && 
                         customerData.number;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with Mode Toggle */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
              <User className="text-red-500" />
              Datos del Cliente
            </h2>
            
            {/* Mode Toggle */}
            <div className="bg-gray-100 rounded-lg p-1 flex">
              <button
                onClick={() => setCustomerMode('new')}
                className={`px-4 py-2 text-sm rounded-md transition-colors ${
                  customerMode === 'new'
                    ? 'bg-red-500 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                Nuevo Cliente
              </button>
              <button
                onClick={() => setCustomerMode('existing')}
                className={`px-4 py-2 text-sm rounded-md transition-colors ${
                  customerMode === 'existing'
                    ? 'bg-red-500 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                Cliente Existente
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Search (Existing Mode) */}
      {customerMode === 'existing' && (
        <CustomerSearch
          customers={customers}
          onSelectCustomer={onSelectCustomer}
        />
      )}

      {/* Customer Form */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User size={16} className="inline mr-1" />
                Nombre completo
              </label>
              <input
                type="text"
                value={customerData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ej: Juan Pérez"
                aria-describedby={errors.name ? 'name-error' : undefined}
              />
              {errors.name && (
                <p id="name-error" className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Phone size={16} className="inline mr-1" />
                Teléfono
              </label>
              <input
                type="tel"
                value={customerData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="+56 9 1234 5678"
                aria-describedby={errors.phone ? 'phone-error' : undefined}
              />
              {errors.phone && (
                <p id="phone-error" className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.phone}
                </p>
              )}
            </div>

            {/* Street */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Home size={16} className="inline mr-1" />
                Calle
              </label>
              <input
                type="text"
                value={customerData.street}
                onChange={(e) => handleInputChange('street', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                  errors.street ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ej: Av. Capitán Ávalos"
                aria-describedby={errors.street ? 'street-error' : undefined}
              />
              {errors.street && (
                <p id="street-error" className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.street}
                </p>
              )}
            </div>

            {/* Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Hash size={16} className="inline mr-1" />
                Número
              </label>
              <input
                type="text"
                value={customerData.number}
                onChange={(e) => handleInputChange('number', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                  errors.number ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ej: 6130"
                aria-describedby={errors.number ? 'number-error' : undefined}
              />
              {errors.number && (
                <p id="number-error" className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.number}
                </p>
              )}
            </div>

            {/* Sector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MapPin size={16} className="inline mr-1" />
                Población / Sector (opcional)
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
                <MapPin size={16} className="inline mr-1" />
                Ciudad
              </label>
              <select
                value={customerData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                {CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* References */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MessageSquare size={16} className="inline mr-1" />
              Referencias (opcional)
            </label>
            <textarea
              value={customerData.references}
              onChange={(e) => handleInputChange('references', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Ej: Casa amarilla con reja negra, frente al semáforo..."
              rows={3}
            />
          </div>

          {/* Payment Information */}
          <div className="mt-6 border-t pt-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">
              Información de Pago
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <CreditCard size={16} className="inline mr-1" />
                  Método de pago
                </label>
                <select
                  value={customerData.paymentMethod}
                  onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <DollarSign size={16} className="inline mr-1" />
                  Estado del pago
                </label>
                <select
                  value={customerData.paymentStatus}
                  onChange={(e) => handleInputChange('paymentStatus', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="paid">Pagado</option>
                  <option value="due">Por pagar en entrega</option>
                </select>
              </div>

              {/* Due Method (if applicable) */}
              {customerData.paymentStatus === 'due' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Wallet size={16} className="inline mr-1" />
                    Método al recibir
                  </label>
                  <select
                    value={customerData.dueMethod}
                    onChange={(e) => handleInputChange('dueMethod', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    {PAYMENT_METHODS.map((method) => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Errors */}
      {errors.cart && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span className="font-medium">{errors.cart}</span>
          </div>
        </div>
      )}

      {/* Order Summary & Create Button */}
      {hasCartItems && (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b">
            <h4 className="font-semibold text-gray-700">
              Resumen del Pedido
            </h4>
          </div>
          
          <div className="p-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <h5 className="font-semibold text-green-800 mb-2">
                Pedido para: {customerData.name || 'Cliente'}
              </h5>
              <ul className="text-sm text-green-700 space-y-1 mb-3">
                {cart.map((item) => (
                  <li key={item.id} className="flex justify-between">
                    <span>{item.quantity}x {item.name}</span>
                    <span>${formatCLP(item.discountPrice * item.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="border-t border-green-300 pt-3 space-y-1">
                <div className="flex justify-between font-bold text-green-800">
                  <span>Total:</span>
                  <span>${formatCLP(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-green-600">
                  <span>Tiempo estimado:</span>
                  <span>{estimatedTime} minutos</span>
                </div>
                <div className="flex justify-between text-sm text-green-600">
                  <span>Método de pago:</span>
                  <span className="capitalize">
                    {customerData.paymentStatus === 'paid' 
                      ? customerData.paymentMethod 
                      : `${customerData.dueMethod} (por pagar)`
                    }
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onCreateOrder}
              disabled={!canCreateOrder || isCreatingOrder}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-lg py-3 px-4 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
            >
              {isCreatingOrder ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creando pedido...
                </>
              ) : (
                <>
                  <Package size={18} />
                  Crear Pedido y Enviar a Cocina
                </>
              )}
            </button>
            
            {!canCreateOrder && (
              <p className="text-sm text-gray-500 text-center mt-2">
                Completa todos los campos obligatorios para crear el pedido
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};