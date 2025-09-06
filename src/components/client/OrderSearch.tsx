import React, { useState, useEffect } from 'react';
import { Search, Phone, Hash, QrCode, AlertCircle } from 'lucide-react';
import type { Order } from '@/types';

interface OrderSearchProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onOrderFound: (order: Order) => void;
  orders: Order[];
}

export const OrderSearch: React.FC<OrderSearchProps> = ({
  searchQuery,
  onSearchQueryChange,
  onOrderFound,
  orders,
}) => {
  const [searchError, setSearchError] = useState<string>('');
  const [searchMode, setSearchMode] = useState<'phone' | 'code'>('phone');

  // Clear error when query changes
  useEffect(() => {
    if (searchError) {
      setSearchError('');
    }
  }, [searchQuery]);

  // Search function
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchError('Por favor ingresa un teléfono o código');
      return;
    }

    let foundOrder: Order | undefined;

    if (searchMode === 'phone') {
      // Search by phone - normalize both search and stored numbers
      const normalizedSearch = searchQuery.replace(/\D/g, ''); // Remove non-digits
      
      foundOrder = orders.find(order => {
        const normalizedPhone = order.phone.replace(/\D/g, '');
        return normalizedPhone.includes(normalizedSearch) || 
               normalizedSearch.includes(normalizedPhone);
      });
    } else {
      // Search by order code
      const codeSearch = searchQuery.toUpperCase().trim();
      
      foundOrder = orders.find(order => {
        const orderCode = order.id.toString().slice(-4).toUpperCase();
        const shortCode = order.id.toString().slice(-5).toUpperCase();
        return orderCode === codeSearch || 
               shortCode === codeSearch ||
               order.id.toString() === codeSearch;
      });
    }

    if (foundOrder) {
      onOrderFound(foundOrder);
      setSearchError('');
    } else {
      setSearchError(
        searchMode === 'phone' 
          ? 'No encontramos pedidos con ese número de teléfono'
          : 'No encontramos pedidos con ese código'
      );
    }
  };

  // Handle enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const placeholderText = searchMode === 'phone' 
    ? '+56 9 1234 5678' 
    : '12345';

  const inputIcon = searchMode === 'phone' ? Phone : Hash;

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="font-semibold text-gray-800">Buscar tu Pedido</h3>
      </div>
      
      <div className="card-body space-y-4">
        {/* Search Mode Toggle */}
        <div className="bg-gray-100 rounded-lg p-1 flex">
          <button
            onClick={() => setSearchMode('phone')}
            className={`
              flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-all duration-200 flex-1
              ${searchMode === 'phone' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            <Phone size={16} />
            <span>Por Teléfono</span>
          </button>
          
          <button
            onClick={() => setSearchMode('code')}
            className={`
              flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-all duration-200 flex-1
              ${searchMode === 'code' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            <Hash size={16} />
            <span>Por Código</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="space-y-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {React.createElement(inputIcon, { 
                size: 16, 
                className: "text-gray-400" 
              })}
            </div>
            
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholderText}
              className={`
                w-full pl-10 pr-4 py-3 border rounded-lg transition-colors duration-200
                ${searchError 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                }
                focus:ring-2 focus:outline-none
              `}
            />
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            disabled={!searchQuery.trim()}
            className="btn-primary w-full"
          >
            <Search size={16} />
            Buscar Pedido
          </button>
        </div>

        {/* Error Message */}
        {searchError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle size={16} />
              <span className="font-medium">{searchError}</span>
            </div>
            <p className="text-sm text-red-600 mt-1">
              {searchMode === 'phone' 
                ? 'Verifica que el número sea exactamente como lo registraste'
                : 'El código aparece en tu boleta o confirmación de pedido'
              }
            </p>
          </div>
        )}

        {/* Help Text */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-blue-800 mb-2">
            <QrCode size={16} />
            <span className="font-medium">💡 Consejos de búsqueda</span>
          </div>
          
          <div className="text-sm text-blue-700 space-y-1">
            {searchMode === 'phone' ? (
              <>
                <p>• Usa el mismo formato que diste al hacer el pedido</p>
                <p>• Incluye o excluye el +56 según como lo registraste</p>
                <p>• Ejemplo: +56 9 1234 5678 o 912345678</p>
              </>
            ) : (
              <>
                <p>• El código aparece en tu boleta de confirmación</p>
                <p>• Son 4 o 5 dígitos, ejemplo: 12345</p>
                <p>• También puedes escanearlo con código QR</p>
              </>
            )}
          </div>
        </div>

        {/* Quick Search Examples */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Pedidos recientes encontrados:
          </h4>
          
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {orders
              .filter(order => order.status !== 'delivered')
              .slice(0, 3)
              .map((order) => (
                <button
                  key={order.id}
                  onClick={() => {
                    const code = order.id.toString().slice(-4);
                    onSearchQueryChange(code);
                    setSearchMode('code');
                  }}
                  className="w-full text-left p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {order.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        Código: {order.id.toString().slice(-4)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleTimeString('es-CL')}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'cooking' ? 'bg-orange-100 text-orange-800' :
                        order.status === 'ready' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status === 'pending' && 'En cola'}
                        {order.status === 'cooking' && 'Cocinando'}
                        {order.status === 'ready' && 'Listo'}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
          </div>
          
          {orders.filter(order => order.status !== 'delivered').length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              No hay pedidos activos en este momento
            </p>
          )}
        </div>
      </div>
    </div>
  );
};