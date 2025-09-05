import React, { useState, useEffect } from 'react';
import { Search, Monitor, Smartphone, QrCode } from 'lucide-react';
import { useOrders } from '@/features/orders/useOrders';
import { useTicker } from '@/hooks/useTicker';
import { OrderTracker } from './OrderTracker';
import { TotemBoard } from './TotemBoard';
import { OrderSearch } from './OrderSearch';

type ClientMode = 'search' | 'totem';

export const ClientPanel: React.FC = () => {
  // Real-time updates
  useTicker();
  
  // State
  const [mode, setMode] = useState<ClientMode>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [foundOrder, setFoundOrder] = useState<any>(null);
  
  // Orders data
  const { orders, getOrderByCode } = useOrders();

  // Check for direct order link from URL hash
  useEffect(() => {
    const checkForOrderInUrl = () => {
      const hash = window.location.hash;
      const match = hash.match(/#order-(\w{4,6})/i);
      
      if (match) {
        const code = match[1];
        const order = getOrderByCode(code);
        
        if (order) {
          setFoundOrder(order);
          setSearchQuery(code);
          setMode('search');
          
          // Clean URL hash after processing
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
    };

    checkForOrderInUrl();
    
    // Listen for hash changes (e.g., when QR codes are scanned)
    window.addEventListener('hashchange', checkForOrderInUrl);
    return () => window.removeEventListener('hashchange', checkForOrderInUrl);
  }, [getOrderByCode]);

  const handleOrderFound = (order: any) => {
    setFoundOrder(order);
  };

  const handleClearSearch = () => {
    setFoundOrder(null);
    setSearchQuery('');
  };

  const modes = [
    {
      key: 'search' as const,
      label: 'Seguimiento',
      icon: Search,
      description: 'Buscar y seguir pedido',
    },
    {
      key: 'totem' as const,
      label: 'Modo Tótem',
      icon: Monitor,
      description: 'Vista de pantalla completa',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header with Mode Selection */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Smartphone className="text-blue-600" />
                Panel de Cliente
              </h2>
              <p className="text-gray-600 mt-1">
                Seguimiento de pedidos en tiempo real
              </p>
            </div>

            {/* Mode Toggle */}
            <div className="bg-gray-100 rounded-lg p-1 flex">
              {modes.map((modeOption) => {
                const Icon = modeOption.icon;
                const isActive = mode === modeOption.key;
                
                return (
                  <button
                    key={modeOption.key}
                    onClick={() => setMode(modeOption.key)}
                    className={`
                      flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-all duration-200
                      ${isActive 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'text-gray-700 hover:bg-gray-200'
                      }
                    `}
                    title={modeOption.description}
                  >
                    <Icon size={16} />
                    <span className="hidden sm:inline">{modeOption.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mode Description */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-blue-800">
              <QrCode size={16} />
              <span className="font-medium">
                {mode === 'search' 
                  ? 'Busca tu pedido por teléfono o código QR'
                  : 'Vista de tótem para mostrar todos los pedidos activos'
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Based on Mode */}
      {mode === 'search' ? (
        <div className="space-y-6">
          {/* Search Interface */}
          {!foundOrder && (
            <OrderSearch
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              onOrderFound={handleOrderFound}
              orders={orders}
            />
          )}

          {/* Order Tracker */}
          {foundOrder && (
            <OrderTracker
              order={foundOrder}
              onClear={handleClearSearch}
            />
          )}

          {/* Instructions */}
          {!foundOrder && (
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  📱 Cómo seguir tu pedido
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-700">Por Teléfono:</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-2">
                        Ingresa tu número de teléfono tal como lo diste al hacer el pedido:
                      </p>
                      <code className="text-sm bg-gray-200 px-2 py-1 rounded">
                        +56 9 1234 5678
                      </code>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-700">Por Código:</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-2">
                        Usa el código de 5 dígitos de tu boleta o confirmación:
                      </p>
                      <code className="text-sm bg-gray-200 px-2 py-1 rounded">
                        12345
                      </code>
                    </div>
                  </div>
                </div>

                <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-2">🎯 Código QR</h4>
                  <p className="text-sm text-green-700">
                    Si tienes un código QR de seguimiento, simplemente escanéalo con tu teléfono 
                    y serás dirigido automáticamente al estado de tu pedido.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <TotemBoard orders={orders} />
      )}

      {/* Quick Stats Footer */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-gray-600">
                📊 Total de pedidos hoy: <strong>{orders.length}</strong>
              </span>
              <span className="text-gray-600">
                ✅ Entregados: <strong>{orders.filter(o => o.status === 'delivered').length}</strong>
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Actualizando en tiempo real</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};