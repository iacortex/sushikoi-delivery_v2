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

// Role-specific components (to be imported as needed)
// import { CashierPanel } from '@/components/cashier/CashierPanel';
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
            {/* Role Title */}
            <div className="section-header">
              <h2 className="section-title">{getRoleTitle()}</h2>
            </div>

            {/* Role-specific content */}
            {userRole === 'cashier' && (
              <div className="p-4 bg-white rounded-lg shadow">
                <p>Panel de Cajero - En desarrollo</p>
              </div>
            )}

            {userRole === 'cook' && (
              <div className="p-4 bg-white rounded-lg shadow">
                <p>Panel de Cocinero - En desarrollo</p>
              </div>
            )}

            {userRole === 'delivery' && (
              <div className="p-4 bg-white rounded-lg shadow">
                <p>Panel de Delivery - En desarrollo</p>
              </div>
            )}

            {userRole === 'client' && (
              <div className="p-4 bg-white rounded-lg shadow">
                <p>Panel de Cliente - En desarrollo</p>
                <p>Aquí irá el seguimiento de pedidos y modo tótem</p>
              </div>
            )}
          </div>
        )}

        {/* Debug info in development */}
        {import.meta.env.DEV && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg text-sm text-gray-600">
            <h4 className="font-semibold mb-2">Debug Info:</h4>
            <p>Role: {userRole}</p>
            <p>Dashboard: {showDashboard ? 'visible' : 'hidden'}</p>
            <p>Orders: {orders.orders.length}</p>
            <p>Customers: {customers.customers.length}</p>
          </div>
        )}
      </div>
    </div>
  );
};