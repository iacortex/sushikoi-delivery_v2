import React, { useState } from 'react';
import { 
  User, Phone, Home, Hash, MapPin, MessageSquare, Search,
  AlertCircle, CreditCard, DollarSign, Wallet, Package, Loader2
} from 'lucide-react';
import type { 
  CustomerFormData, 
  Coordinates, 
  GeocodeResult, 
  FormErrors,
  CartItem 
} from '@/types';
import type { UseCustomersReturn } from '@/features/customers/useCustomers';
import { PAYMENT_METHODS, CITIES } from '@/lib/constants';
import { formatCLP } from '@/lib/format';
import { LeafletMap } from '@/features/map/LeafletMap';
import { CustomerSearch } from './CustomerSearch';

interface CustomerFormProps {
  customerData: CustomerFormData;
  onCustomerDataChange: (data: CustomerFormData) => void;
  selectedCoords: Coordinates | null;
  onCoordsChange: (coords: Coordinates | null) => void;
  geocodedResult: GeocodeResult | null;
  isGeocoding: boolean;
  errors: FormErrors;
  customers: UseCustomersReturn;
  onSelectCustomer: (customer: any) => void;
  cart: CartItem[];
  cartTotal: number;
  estimatedTime: number;
  onCreateOrder: () => void;
  isCreatingOrder: boolean;
}

type CustomerMode = 'new' | 'existing';

export const CustomerForm: React.FC<CustomerFormProps> = ({
  customerData,
  onCustomerDataChange,
  selectedCoords,
  onCoordsChange,
  geocodedResult,
  isGeocoding,
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

  const handleMapMarkerDrag = (coords: Coordinates) => {
    onCoordsChange(coords);
  };

  const hasCartItems = cart.length > 0;
  const canCreateOrder = hasCartItems && 
                         customerData.name && 
                         customerData.phone && 
                         customerData.street && 
                         customerData.number && 
                         selectedCoords;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header with Mode Toggle */}
      <div className="card">
        <div className="card-header">
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
      <div className="card">
        <div className="card-body">
          <div className="form-grid">
            {/* Name */}
            <div className="form-row">
              <label className="form-label">
                <User size={16} className="inline mr-1" />
                Nombre completo
              </label>
              <input
                type="text"
                value={customerData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`input ${errors.name ? 'input-error' : ''}`}
                placeholder="Ej: Juan Pérez"
                aria-describedby={errors.name ? 'name-error' : undefined}
              />
              {errors.name && (
                <p id="name-error" className="form-error">
                  <AlertCircle size={12} />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Phone */}
            <div className="form-row">
              <label className="form-label">
                <Phone size={16} className="inline mr-1" />
                Teléfono
              </label>
              <input
                type="tel"
                value={customerData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className={`input ${errors.phone ? 'input-error' : ''}`}
                placeholder="+56 9 1234 5678"
                aria-describedby={errors.phone ? 'phone-error' : undefined}
              />
              {errors.phone && (
                <p id="phone-error" className="form-error">
                  <AlertCircle size={12} />
                  {errors.phone}
                </p>
              )}
            </div>

            {/* Street */}
            <div className="form-row">
              <label className="form-label">
                <Home size={16} className="inline mr-1" />
                Calle
              </label>
              <input
                type="text"
                value={customerData.street}
                onChange={(e) => handleInputChange('street', e.target.value)}
                className={`input ${errors.street ? 'input-error' : ''}`}
                placeholder="Ej: Av. Capitán Ávalos"
                aria-describedby={errors.street ? 'street-error' : undefined}
              />
              {errors.street && (
                <p id="street-error" className="form-error">
                  <AlertCircle size={12} />
                  {errors.street}
                </p>
              )}
            </div>

            {/* Number */}
            <div className="form-row">
              <label className="form-label">
                <Hash size={16} className="inline mr-1" />
                Número
              </label>
              <input
                type="text"
                value={customerData.number}
                onChange={(e) => handleInputChange('number', e.target.value)}
                className={`input ${errors.number ? 'input-error' : ''}`}
                placeholder="Ej: 6130"
                aria-describedby={errors.number ? 'number-error' : undefined}
              />
              {errors.number && (
                <p id="number-error" className="form-error">
                  <AlertCircle size={12} />
                  {errors.number}
                </p>
              )}
            </div>

            {/* Sector */}
            <div className="form-row">
              <label className="form-label">
                <MapPin size={16} className="inline mr-1" />
                Población / Sector (opcional)
              </label>
              <input
                type="text"
                value={customerData.sector}
                onChange={(e) => handleInputChange('sector', e.target.value)}
                className="input"
                placeholder="Ej: Mirasol, Puerto Sur"
              />
            </div>

            {/* City */}
            <div className="form-row">
              <label className="form-label">
                <MapPin size={16} className="inline mr-1" />
                Ciudad
              </label>
              <select
                value={customerData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className="input"
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
          <div className="form-row mt-4">
            <label className="form-label">
              <MessageSquare size={16} className="inline mr-1" />
              Referencias (opcional)
            </label>
            <textarea
              value={customerData.references}
              onChange={(e) => handleInputChange('references', e.target.value)}
              className="input"
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
              <div className="form-row">
                <label className="form-label">
                  <CreditCard size={16} className="inline mr-1" />
                  Método de pago
                </label>
                <select
                  value={customerData.paymentMethod}
                  onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                  className="input"
                >
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Status */}
              <div className="form-row">
                <label className="form-label">
                  <DollarSign size={16} className="inline mr-1" />
                  Estado del pago
                </label>
                <select
                  value={customerData.paymentStatus}
                  onChange={(e) => handleInputChange('paymentStatus', e.target.value)}
                  className="input"
                >
                  <option value="paid">Pagado</option>
                  <option value="due">Por pagar en entrega</option>
                </select>
              </div>

              {/* Due Method (if applicable) */}
              {customerData.paymentStatus === 'due' && (
                <div className="form-row">
                  <label className="form-label">
                    <Wallet size={16} className="inline mr-1" />
                    Método al recibir
                  </label>
                  <select
                    value={customerData.dueMethod}
                    onChange={(e) => handleInputChange('dueMethod', e.target.value)}
                    className="input"
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

      {/* Map Section */}
      {(selectedCoords || geocodedResult) && (
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-700">
                Ubicación en el mapa
              </h4>
              
              {/* Geocoding Status */}
              <div className="flex items-center gap-2">
                {isGeocoding && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-sm">Geocodificando...</span>
                  </div>
                )}
                
                {geocodedResult && geocodedResult.precision !== 'exact' && (
                  <span className="text-xs px-2 py-1 rounded bg-amber-50 text-amber-800 flex items-center gap-1">
                    <AlertCircle size={12} />
                    Ubicación aproximada ({geocodedResult.precision})
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="card-body">
            <p className="text-sm text-gray-600 mb-4">
              Arrastra el marcador rojo para ajustar la ubicación exacta si es necesario
            </p>
            
            <LeafletMap
              center={selectedCoords || { lat: -41.4662, lng: -72.9990 }}
              zoom={16}
              height="400px"
              destination={selectedCoords || undefined}
              draggableMarker={true}
              showRoute={true}
              onMarkerDrag={handleMapMarkerDrag}
            />
            
            {selectedCoords && (
              <p className="text-xs text-gray-500 mt-2">
                Coordenadas: {selectedCoords.lat.toFixed(6)}, {selectedCoords.lng.toFixed(6)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Errors */}
      {errors.coordinates && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span className="font-medium">{errors.coordinates}</span>
          </div>
        </div>
      )}

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
        <div className="card">
          <div className="card-header">
            <h4 className="font-semibold text-gray-700">
              Resumen del Pedido
            </h4>
          </div>
          
          <div className="card-body">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <h5 className="font-semibold text-green-800 mb-2">
                Pedido para: {customerData.name || 'Cliente'}
              </h5>
              <ul className="text-sm text-green-700 space-y-1 mb-3">
                {cart.map((item) => (
                  <li key={item.id}>
                    {item.quantity}x {item.name} - ${formatCLP(item.discountPrice * item.quantity)}
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
              className="btn-success w-full text-lg py-3"
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
                Completa todos los campos obligatorios y confirma la ubicación en el mapa
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};