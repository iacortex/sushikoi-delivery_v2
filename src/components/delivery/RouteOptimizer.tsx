import React, { useState, useMemo } from 'react';
import { Route, MapPin, Clock, Navigation, Zap, AlertCircle } from 'lucide-react';
import type { Order } from '@/types';
import { formatKm, formatDur } from '@/lib/format';
import { ORIGIN } from '@/lib/constants';

interface RouteOptimizerProps {
  orders: Order[];
  onOptimizedRoute?: (orderIds: number[]) => void;
}

interface DeliveryStop {
  order: Order;
  distanceFromOrigin: number;
  estimatedDeliveryTime: number;
}

export const RouteOptimizer: React.FC<RouteOptimizerProps> = ({
  orders,
  onOptimizedRoute,
}) => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState<DeliveryStop[]>([]);
  
  // Filter ready orders with route metadata
  const readyOrders = useMemo(() => {
    return orders.filter(order => 
      order.status === 'ready' && 
      order.routeMeta &&
      order.coordinates
    );
  }, [orders]);

  // Calculate optimized route using simple nearest neighbor algorithm
  const optimizeRoute = async () => {
    if (readyOrders.length === 0) return;
    
    setIsOptimizing(true);
    
    try {
      // Simulate optimization delay (in real app, this would call a routing service)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simple optimization: sort by distance from origin (nearest first)
      const optimized = readyOrders
        .map(order => ({
          order,
          distanceFromOrigin: order.routeMeta?.distance || 0,
          estimatedDeliveryTime: (order.routeMeta?.duration || 0) + (10 * 60), // +10min delivery time
        }))
        .sort((a, b) => a.distanceFromOrigin - b.distanceFromOrigin);
      
      setOptimizedRoute(optimized);
      
      // Notify parent component
      onOptimizedRoute?.(optimized.map(stop => stop.order.id));
      
    } catch (error) {
      console.error('Route optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Calculate total route statistics
  const routeStats = useMemo(() => {
    if (optimizedRoute.length === 0) return null;
    
    const totalDistance = optimizedRoute.reduce((sum, stop) => sum + stop.distanceFromOrigin, 0);
    const totalTime = optimizedRoute.reduce((sum, stop) => sum + stop.estimatedDeliveryTime, 0);
    const estimatedFuelCost = (totalDistance / 1000) * 0.5; // Rough estimate: $0.5 per km
    
    return {
      totalDistance,
      totalTime,
      estimatedFuelCost,
      stops: optimizedRoute.length,
    };
  }, [optimizedRoute]);

  if (readyOrders.length === 0) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="text-center py-6">
            <Route size={48} className="mx-auto mb-3 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              No hay pedidos para optimizar
            </h3>
            <p className="text-gray-500 text-sm">
              Los pedidos listos para delivery aparecerán aquí para optimización de ruta
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Route size={18} className="text-blue-600" />
              Optimizador de Rutas
            </h3>
            
            <button
              onClick={optimizeRoute}
              disabled={isOptimizing || readyOrders.length === 0}
              className="btn-primary"
            >
              {isOptimizing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Optimizando...
                </>
              ) : (
                <>
                  <Zap size={16} />
                  Optimizar Ruta
                </>
              )}
            </button>
          </div>
        </div>
        
        <div className="card-body">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>{readyOrders.length} pedido(s) disponible(s)</span>
            {routeStats && (
              <>
                <span>•</span>
                <span>{routeStats.stops} parada(s) optimizada(s)</span>
                <span>•</span>
                <span>{formatKm(routeStats.totalDistance)} total</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Route Statistics */}
      {routeStats && (
        <div className="card">
          <div className="card-header">
            <h4 className="font-semibold text-gray-800">Estadísticas de la Ruta Optimizada</h4>
          </div>
          
          <div className="card-body">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <MapPin size={20} className="mx-auto mb-2 text-blue-600" />
                <p className="text-lg font-bold text-blue-800">{routeStats.stops}</p>
                <p className="text-sm text-blue-700">Paradas</p>
              </div>
              
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <Route size={20} className="mx-auto mb-2 text-green-600" />
                <p className="text-lg font-bold text-green-800">
                  {formatKm(routeStats.totalDistance)}
                </p>
                <p className="text-sm text-green-700">Distancia</p>
              </div>
              
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <Clock size={20} className="mx-auto mb-2 text-orange-600" />
                <p className="text-lg font-bold text-orange-800">
                  {formatDur(routeStats.totalTime)}
                </p>
                <p className="text-sm text-orange-700">Tiempo</p>
              </div>
              
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <Navigation size={20} className="mx-auto mb-2 text-purple-600" />
                <p className="text-lg font-bold text-purple-800">
                  ${routeStats.estimatedFuelCost.toFixed(0)}
                </p>
                <p className="text-sm text-purple-700">Est. Combustible</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Optimized Route List */}
      {optimizedRoute.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h4 className="font-semibold text-gray-800">Secuencia de Entrega Optimizada</h4>
          </div>
          
          <div className="card-body">
            <div className="space-y-3">
              {/* Origin */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  🏪
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">Punto de Partida</p>
                  <p className="text-sm text-gray-600">{ORIGIN.name}</p>
                </div>
                <div className="text-sm text-gray-500">0:00</div>
              </div>

              {/* Delivery Stops */}
              {optimizedRoute.map((stop, index) => (
                <div key={stop.order.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-gray-800">
                        Pedido #{stop.order.id.toString().slice(-4)}
                      </p>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {stop.order.name}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{stop.order.address}</p>
                    
                    {/* Payment status */}
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        stop.order.paymentStatus === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {stop.order.paymentStatus === 'paid' ? 'Pagado' : 'Por cobrar'}
                      </span>
                      <span className="text-xs text-gray-500">
                        ${stop.order.total.toLocaleString('es-CL')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right text-sm">
                    <p className="text-gray-700 font-medium">
                      {formatKm(stop.distanceFromOrigin)}
                    </p>
                    <p className="text-gray-500">
                      {formatDur(stop.estimatedDeliveryTime)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Optimization Tips */}
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-blue-600 mt-0.5" />
                <div>
                  <h5 className="font-medium text-blue-800 mb-1">Consejos de Optimización</h5>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• La ruta está optimizada por proximidad geográfica</li>
                    <li>• Considera priorizar pedidos ya pagados</li>
                    <li>• Revisa el tráfico en tiempo real antes de salir</li>
                    {routeStats.estimatedFuelCost > 10 && (
                      <li>• Ruta larga detectada - considera dividir en múltiples viajes</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};