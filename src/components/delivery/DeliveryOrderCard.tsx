import React, { useState } from 'react';
import { 
  Navigation, CheckCircle, CreditCard, MapPin, Phone, User, 
  AlertCircle, Clock, Package, ExternalLink, QrCode, Timer
} from 'lucide-react';
import type { Order } from '@/types';
import { formatCLP, formatKm, formatDur, shortCode, formatTimeRemaining } from '@/lib/format';
import { gmapsDir, wazeUrl, getWazeQRUrl, getTrackingQRUrl } from '@/lib/urls';
import { LeafletMap } from '@/features/map/LeafletMap';
import { ORDER_STATUS_CONFIG } from '@/lib/constants';

interface DeliveryOrderCardProps {
  order: Order;
  onMarkAsDelivered: (orderId: number) => void;
  onConfirmPayment: (orderId: number) => void;
}

export const DeliveryOrderCard: React.FC<DeliveryOrderCardProps> = ({
  order,
  onMarkAsDelivered,
  onConfirmPayment,
}) => {
  const [showMap, setShowMap] = useState(false);
  
  // Payment status
  const isPaid = order.paymentStatus === 'paid';
  const paymentMethod = isPaid ? order.paymentMethod : order.dueMethod;
  
  // Status configuration
  const statusConfig = ORDER_STATUS_CONFIG[order.status];
  
  // Can deliver check (must be paid if it was due)
  const canDeliver = order.status === 'ready' && (isPaid || order.paymentStatus !== 'due');
  
  // Packing status
  const packingInfo = React.useMemo(() => {
    if (order.status !== 'ready' || !order.packUntil) return null;
    
    const now = Date.now();
    const timeLeft = Math.max(0, order.packUntil - now);
    const expired = timeLeft <= 0;
    
    return {
      timeLeft,
      expired,
      packed: order.packed,
      formattedTime: formatTimeRemaining(timeLeft),
    };
  }, [order.packUntil, order.packed, order.status]);

  const handleMarkAsDelivered = () => {
    if (canDeliver) {
      onMarkAsDelivered(order.id);
    }
  };

  const handleConfirmPayment = () => {
    onConfirmPayment(order.id);
  };

  const handleOpenGoogleMaps = () => {
    window.open(gmapsDir(order.coordinates.lat, order.coordinates.lng), '_blank');
  };

  const handleOpenWaze = () => {
    window.open(wazeUrl(order.coordinates.lat, order.coordinates.lng), '_blank');
  };

  // Card styling based on status and urgency
  const getCardClasses = () => {
    let classes = 'card transition-all duration-200 ';
    
    if (order.status === 'delivered') {
      classes += 'border-blue-300 bg-blue-50 ';
    } else if (!isPaid && order.paymentStatus === 'due') {
      classes += 'border-red-300 bg-red-50 ';
    } else if (packingInfo?.expired && !packingInfo.packed) {
      classes += 'border-amber-300 bg-amber-50 ';
    } else {
      classes += 'border-green-300 bg-green-50 hover:shadow-lg ';
    }
    
    return classes;
  };

  return (
    <div className={getCardClasses()}>
      <div className="card-body">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-gray-800">
                Pedido #{order.id.toString().slice(-4)}
              </h3>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                {shortCode(order.id)}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <User size={14} />
              <span className="font-medium">{order.name}</span>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <Phone size={12} />
              <span>{order.phone}</span>
            </div>
            
            <p className="text-xs text-gray-500">
              {new Date(order.createdAt).toLocaleString('es-CL')}
            </p>
          </div>

          {/* Status Badge */}
          <div className={`status-pill ${statusConfig.color}`}>
            {order.status === 'ready' && <Package size={14} />}
            {order.status === 'delivered' && <CheckCircle size={14} />}
            <span>{statusConfig.label}</span>
          </div>
        </div>

        {/* Address Information */}
        <div className="mb-4 p-3 bg-white rounded-lg border">
          <div className="flex items-start gap-2 mb-2">
            <MapPin size={16} className="text-gray-500 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-gray-800">{order.address}</p>
              <p className="text-sm text-gray-600">{order.city}</p>
              
              {order.references && (
                <p className="text-sm text-blue-600 mt-1">
                  <strong>Referencias:</strong> {order.references}
                </p>
              )}
              
              {order.geocodePrecision && order.geocodePrecision !== 'exact' && (
                <div className="flex items-center gap-1 mt-2">
                  <AlertCircle size={12} className="text-amber-600" />
                  <span className="text-xs text-amber-700">
                    Ubicación aproximada ({order.geocodePrecision})
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Route Information */}
          {order.routeMeta && (
            <div className="flex items-center gap-4 text-sm text-gray-600 pt-2 border-t">
              <span>🛣️ {formatKm(order.routeMeta.distance)}</span>
              <span>⏱️ {formatDur(order.routeMeta.duration)}</span>
            </div>
          )}
        </div>

        {/* Order Items */}
        <div className="mb-4">
          <h4 className="font-semibold text-gray-700 mb-2 text-sm">Pedido:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {order.cart.map((item, index) => (
              <li key={index} className="flex justify-between">
                <span>{item.quantity}x {item.name}</span>
                <span>${formatCLP(item.discountPrice * item.quantity)}</span>
              </li>
            ))}
          </ul>
          
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between font-bold text-gray-800">
              <span>Total:</span>
              <span>${formatCLP(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h5 className="font-semibold text-gray-700 mb-2 text-sm">Estado de Pago</h5>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                isPaid 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {isPaid ? 'Pagado' : 'Por pagar'}
              </span>
              <span className="text-sm text-gray-600 capitalize">
                {paymentMethod}
              </span>
            </div>
            
            {!isPaid && order.paymentStatus === 'due' && (
              <button
                onClick={handleConfirmPayment}
                className="flex items-center gap-1 px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs rounded transition-colors"
              >
                <CreditCard size={12} />
                Confirmar Pago
              </button>
            )}
          </div>
          
          {order.paidAt && (
            <p className="text-xs text-gray-500 mt-1">
              Pagado: {new Date(order.paidAt).toLocaleString('es-CL')}
            </p>
          )}
        </div>

        {/* Packing Status */}
        {packingInfo && order.status === 'ready' && (
          <div className="mb-4">
            {packingInfo.packed ? (
              <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-2 rounded">
                <CheckCircle size={14} />
                <span className="font-medium">Empacado y listo para entregar</span>
              </div>
            ) : packingInfo.expired ? (
              <div className="flex items-center gap-2 text-amber-700 text-sm bg-amber-50 p-2 rounded">
                <AlertCircle size={14} />
                <span className="font-medium">Tiempo de empaque vencido</span>
              </div>
            ) : (
              <div className="bg-blue-50 p-2 rounded">
                <div className="flex items-center justify-between text-sm text-blue-700 mb-1">
                  <span className="font-medium">Empacando...</span>
                  <span className="font-bold">{packingInfo.formattedTime}</span>
                </div>
                <div className="w-full h-2 bg-blue-200 rounded-full overflow-hidden">
                  <div 
                    className="h-2 bg-blue-500 transition-all duration-1000"
                    style={{ 
                      width: `${Math.max(0, (packingInfo.timeLeft / 90_000) * 100)}%` 
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Map Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h5 className="font-semibold text-gray-700 text-sm">Ubicación y Navegación</h5>
            <button
              onClick={() => setShowMap(!showMap)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {showMap ? 'Ocultar mapa' : 'Ver mapa'}
            </button>
          </div>

          {showMap && (
            <div className="mb-3">
              <LeafletMap
                center={order.coordinates}
                zoom={16}
                height="250px"
                destination={order.coordinates}
                draggableMarker={false}
                showRoute={true}
                className="rounded-lg"
              />
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              onClick={handleOpenGoogleMaps}
              className="flex items-center justify-center gap-2 py-2 px-3 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Navigation size={14} />
              Google Maps
              <ExternalLink size={12} />
            </button>
            
            <button
              onClick={handleOpenWaze}
              className="flex items-center justify-center gap-2 py-2 px-3 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Navigation size={14} />
              Waze
              <ExternalLink size={12} />
            </button>
          </div>

          {/* QR Codes */}
          <div className="grid grid-cols-2 gap-3">
            {/* Waze QR */}
            <div className="qr-container">
              <h6 className="text-xs font-medium text-gray-700 mb-2">QR Navegación Waze</h6>
              <img
                src={getWazeQRUrl(order.coordinates.lat, order.coordinates.lng, 120)}
                alt="QR Waze"
                className="qr-image w-24 h-24"
              />
              <p className="text-xs text-gray-500">Escanear para navegar</p>
            </div>

            {/* Tracking QR */}
            <div className="qr-container">
              <h6 className="text-xs font-medium text-gray-700 mb-2">QR Seguimiento</h6>
              <img
                src={getTrackingQRUrl(shortCode(order.id), 120)}
                alt="QR Seguimiento"
                className="qr-image w-24 h-24"
              />
              <p className="text-xs text-gray-500">Compartir con cliente</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {order.status === 'ready' && (
          <div className="space-y-2">
            {/* Delivery Button */}
            <button
              onClick={handleMarkAsDelivered}
              disabled={!canDeliver}
              className={`w-full py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                canDeliver
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <CheckCircle size={16} />
              {canDeliver ? 'Marcar como Entregado' : 'Confirmar pago primero'}
            </button>

            {/* Payment reminder */}
            {!canDeliver && (
              <p className="text-xs text-red-600 text-center">
                ⚠️ Debe confirmar el pago antes de marcar como entregado
              </p>
            )}
          </div>
        )}

        {/* Delivered Status */}
        {order.status === 'delivered' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-2 text-blue-700 mb-1">
              <CheckCircle size={16} />
              <span className="font-medium">Pedido Entregado</span>
            </div>
            <p className="text-xs text-blue-600">
              Entregado: {new Date(order.createdAt).toLocaleString('es-CL')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};