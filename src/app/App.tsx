import React, { useState } from 'react';
import type { UserRole } from '@/types';
import { useTicker } from '@/hooks/useTicker';
import { useOrders } from '@/features/orders/useOrders';
import { useCustomers } from '@/features/customers/useCustomers';

// Layout components
import { Header } from '@/components/layout/Header';
import { RoleSelector } from '@/components/layout/RoleSelector';

// Dashboard
import { Dashboard } from '@/components/dashboard/Dashboard';

// Role-specific components
// ✅ default import
import CashierPanel from '@/components/cashier/CashierPanel';

// import { CookBoard } from '@/components/cook/CookBoard';
// import { DeliveryList } from '@/components/delivery/DeliveryList';
// import { ClientTracker } from '@/components/client/ClientTracker';

export const App: React.FC = () => {
  // Global ticker for real-time updates
  useTicker();

  // Global state
  const [userRole, setUserRole] = useState<UserRole>('cashier');
  const [showDashboard, setShowDashboard] = useState(false);

  // Data hooks
  const orders = useOrders();
  const customers = useCustomers();

  // Role change handler
  const handleRoleChange = (role: UserRole) => {
    setUserRole(role);
    // Hide dashboard when switching roles
    setShowDashboard(false);
  };

  // Dashboard toggle handler
  const handleDashboardToggle = (show: boolean) => {
    setShowDashboard(show);
  };

  // Get role title
  const getRoleTitle = (): string => {
    const titles = {
      cashier: "🏪 Panel de Cajero/Vendedor",
      cook: "👨‍🍳 Panel de Cocinero",
      delivery: "🛵 Panel de Delivery",
      client: "🙋 Panel de Cliente",
    };
    return titles[userRole];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
      <div className="container-app">
        {/* Header */}
        <Header />

        {/* Role Selector */}
        <RoleSelector
          currentRole={userRole}
          showDashboard={showDashboard}
          onRoleChange={handleRoleChange}
          onDashboardToggle={handleDashboardToggle}
        />

        {/* Content Area */}
        {showDashboard ? (
          <Dashboard orders={orders.orders} />
        ) : (
          <div>
            {/* Role-specific content */}
            {userRole === 'cashier' && (
              <div className="w-full">
                {/* CashierPanel ya incluye su propio header y navegación */}
                <CashierPanel />
              </div>
            )}

            {userRole === 'cook' && (
              <div>
                {/* Role Title */}
                <div className="section-header">
                  <h2 className="section-title">{getRoleTitle()}</h2>
                </div>
                
                <div className="p-4 bg-white rounded-lg shadow">
                  <p>Panel de Cocinero - En desarrollo</p>
                  <p className="text-sm text-gray-600 mt-2">
                    Próximamente: Kanban de órdenes, tiempos de cocina, notificaciones
                  </p>
                </div>
              </div>
            )}

            {userRole === 'delivery' && (
              <div>
                {/* Role Title */}
                <div className="section-header">
                  <h2 className="section-title">{getRoleTitle()}</h2>
                </div>
                
                <div className="p-4 bg-white rounded-lg shadow">
                  <p>Panel de Delivery - En desarrollo</p>
                  <p className="text-sm text-gray-600 mt-2">
                    Próximamente: Lista de entregas, mapas de rutas, estado GPS
                  </p>
                </div>
              </div>
            )}

            {userRole === 'client' && (
              <div>
                {/* Role Title */}
                <div className="section-header">
                  <h2 className="section-title">{getRoleTitle()}</h2>
                </div>
                
                <div className="p-4 bg-white rounded-lg shadow">
                  <p>Panel de Cliente - En desarrollo</p>
                  <p className="text-sm text-gray-600 mt-2">
                    Próximamente: Seguimiento de pedidos, modo tótem, QR tracking
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Debug info in development */}
        {import.meta.env.DEV && userRole !== 'cashier' && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg text-sm text-gray-600">
            <h4 className="font-semibold mb-2">Debug Info:</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p><strong>Role:</strong> {userRole}</p>
                <p><strong>Dashboard:</strong> {showDashboard ? 'visible' : 'hidden'}</p>
              </div>
              <div>
                <p><strong>Orders:</strong> {orders.orders.length}</p>
                <p><strong>Customers:</strong> {customers.customers.length}</p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="mt-4 pt-4 border-t border-gray-300">
              <h5 className="font-medium mb-2">Quick Stats:</h5>
              <div className="flex gap-4 text-xs">
                <span className="bg-yellow-100 px-2 py-1 rounded">
                  Pending: {orders.orders.filter(o => o.status === 'pending').length}
                </span>
                <span className="bg-orange-100 px-2 py-1 rounded">
                  Cooking: {orders.orders.filter(o => o.status === 'cooking').length}
                </span>
                <span className="bg-green-100 px-2 py-1 rounded">
                  Ready: {orders.orders.filter(o => o.status === 'ready').length}
                </span>
                <span className="bg-blue-100 px-2 py-1 rounded">
                  Delivered: {orders.orders.filter(o => o.status === 'delivered').length}
                </span>
              </div>
            </div>
            
            {/* Performance Info */}
            <div className="mt-2 text-xs text-gray-500">
              <p>Last update: {new Date().toLocaleTimeString('es-CL')}</p>
              <p>Environment: {import.meta.env.MODE}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};