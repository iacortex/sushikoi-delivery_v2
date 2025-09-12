import React, { useState, useMemo } from 'react';
import { Search, User, Phone, MapPin, Clock } from 'lucide-react';

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

interface CustomerSearchProps {
  customers: Customer[];
  onSelectCustomer: (customer: Customer) => void;
}

const formatCLP = (amount: number) => {
  return new Intl.NumberFormat('es-CL').format(amount);
};

export const CustomerSearch: React.FC<CustomerSearchProps> = ({
  customers,
  onSelectCustomer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Search customers based on query
  const filteredCustomers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    
    if (!query) {
      // Return recent customers if no query
      return customers
        .filter(customer => customer.lastOrderAt)
        .sort((a, b) => (b.lastOrderAt || 0) - (a.lastOrderAt || 0))
        .slice(0, 6);
    }

    // Search by name, phone, or address
    return customers.filter(customer => 
      customer.name.toLowerCase().includes(query) ||
      customer.phone.includes(query) ||
      customer.street.toLowerCase().includes(query) ||
      (customer.sector && customer.sector.toLowerCase().includes(query))
    ).slice(0, 10);
  }, [searchQuery, customers]);

  const handleSelectCustomer = (customer: Customer) => {
    onSelectCustomer(customer);
    setSearchQuery(''); // Clear search after selection
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b">
        <h4 className="font-semibold text-gray-700 flex items-center gap-2">
          <Search size={18} />
          Buscar Cliente Existente
        </h4>
      </div>
      
      <div className="p-6 space-y-4">
        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            placeholder="Buscar por nombre, teléfono o dirección..."
            aria-label="Buscar cliente"
          />
        </div>

        {/* Search Results */}
        <div className="space-y-3">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              {searchQuery ? (
                <>
                  <Search size={48} className="mx-auto mb-2 text-gray-300" />
                  <p>No se encontraron clientes</p>
                  <p className="text-sm">Intenta con otro criterio de búsqueda</p>
                </>
              ) : (
                <>
                  <User size={48} className="mx-auto mb-2 text-gray-300" />
                  <p>Sin clientes registrados aún</p>
                  <p className="text-sm">Los clientes aparecerán aquí después del primer pedido</p>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredCustomers.map((customer, index) => (
                <CustomerCard
                  key={`${customer.phone}-${index}`}
                  customer={customer}
                  onSelect={handleSelectCustomer}
                />
              ))}
            </div>
          )}
        </div>

        {/* Search Tips */}
        {!searchQuery && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h5 className="font-medium text-blue-800 mb-1">💡 Tips de búsqueda:</h5>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Busca por nombre: "Juan", "María"</li>
              <li>• Busca por teléfono: "9 1234", "+56"</li>
              <li>• Busca por dirección: "Mirasol", "Ávalos"</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

interface CustomerCardProps {
  customer: Customer;
  onSelect: (customer: Customer) => void;
}

const CustomerCard: React.FC<CustomerCardProps> = ({ customer, onSelect }) => {
  const handleSelect = () => {
    onSelect(customer);
  };

  const formatLastOrder = (timestamp?: number): string => {
    if (!timestamp) return 'Primer pedido';
    
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Hoy';
    if (days === 1) return 'Ayer';
    if (days < 7) return `Hace ${days} días`;
    if (days < 30) return `Hace ${Math.floor(days / 7)} semanas`;
    return `Hace ${Math.floor(days / 30)} meses`;
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-red-300 transition-all duration-200 cursor-pointer group">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          {/* Customer Name */}
          <div className="flex items-center gap-2 mb-2">
            <User size={16} className="text-gray-500" />
            <h6 className="font-semibold text-gray-800 group-hover:text-red-600 transition-colors">
              {customer.name}
            </h6>
          </div>

          {/* Phone */}
          <div className="flex items-center gap-2 mb-1">
            <Phone size={14} className="text-gray-400" />
            <span className="text-sm text-gray-600">{customer.phone}</span>
          </div>

          {/* Address */}
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={14} className="text-gray-400" />
            <span className="text-sm text-gray-600">
              {customer.street} {customer.number}
              {customer.sector && `, ${customer.sector}`}
            </span>
          </div>

          {/* Stats */}
          {(customer.totalOrders || customer.totalSpent) && (
            <div className="flex items-center gap-4 mt-3 pt-2 border-t border-gray-100">
              {customer.totalOrders && (
                <span className="text-xs text-gray-500">
                  {customer.totalOrders} pedido{customer.totalOrders !== 1 ? 's' : ''}
                </span>
              )}
              {customer.totalSpent && (
                <span className="text-xs text-gray-500">
                  ${formatCLP(customer.totalSpent)} total
                </span>
              )}
              {customer.lastOrderAt && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock size={10} />
                  {formatLastOrder(customer.lastOrderAt)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Select Button */}
        <button
          onClick={handleSelect}
          className="ml-3 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm rounded-md transition-colors flex-shrink-0"
          aria-label={`Seleccionar cliente ${customer.name}`}
        >
          Usar
        </button>
      </div>
    </div>
  );
};