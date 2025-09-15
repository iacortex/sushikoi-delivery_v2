import { useState } from 'react';
import type { UserRole } from '@/types';
import { useTicker } from '@/hooks/useTicker';
import { useOrders } from '@/features/orders/useOrders';
import { useCustomers } from '@/features/customers/useCustomers';

// Layout
import { Header } from '@/components/layout/Header';
import { RoleSelector } from '@/components/layout/RoleSelector';
import OrientalBackground from '@/components/layout/OrientalBackground';

// Dashboard
import { Dashboard } from '@/components/dashboard/Dashboard';

// Role-specific
import CashierPanel from '@/components/cashier/CashierPanel';
import { CookBoard } from '@/components/cook/CookBoard';
import { KitchenNotifications } from '@/components/cook/KitchenNotificacions';

export function App() {
  useTicker();

  const [userRole, setUserRole] = useState<UserRole>('cashier');
  const [showDashboard, setShowDashboard] = useState(false);

  // ✅ Instancia ÚNICA del estado de órdenes
  const orders = useOrders();
  const customers = useCustomers();

  const handleRoleChange = (role: UserRole) => {
    setUserRole(role);
    setShowDashboard(false);
  };
  const handleDashboardToggle = (show: boolean) => setShowDashboard(show);

  // 🔔 al crear una orden, ir a cocina
  const handleOrderCreated = () => {
    setUserRole('cook');
    setShowDashboard(false);
  };

  const getRoleTitle = (): string => {
    const titles = {
      cashier: '🏪 Panel de Cajero/Vendedor',
      cook: '👨‍🍳 Panel de Cocinero',
      delivery: '🛵 Panel de Delivery',
      client: '🙋 Panel de Cliente',
    } as const;
    return titles[userRole];
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <OrientalBackground density={44} showPattern />

      <div className="container-app">
        <Header />

        <div className="mt-6 md:mt-8">
          <RoleSelector
            currentRole={userRole}
            showDashboard={showDashboard}
            onRoleChange={handleRoleChange}
            onDashboardToggle={handleDashboardToggle}
          />
        </div>

        {showDashboard ? (
          <Dashboard orders={orders.orders} />
        ) : (
          <div>
            {userRole === 'cashier' && (
              <div className="w-full">
                <CashierPanel
                  ordersApi={orders}
                  onOrderCreated={handleOrderCreated}
                />
              </div>
            )}

            {userRole === 'cook' && (
              <div className="w-full space-y-4">
                <div className="section-header flex items-center justify-between">
                  <h2 className="section-title">{getRoleTitle()}</h2>
                  <KitchenNotifications orders={orders.orders} />
                </div>
                {/* Cocina usa la MISMA instancia del store */}
                <CookBoard ordersApi={orders} />
              </div>
            )}

            {userRole === 'delivery' && (
              <div>
                <div className="section-header">
                  <h2 className="section-title">{getRoleTitle()}</h2>
                </div>
                <div className="p-4 koi-panel">
                  <p>Panel de Delivery - En desarrollo</p>
                  <p className="text-sm text-gray-600 mt-2">
                    Próximamente: Lista de entregas, mapas de rutas, estado GPS
                  </p>
                </div>
              </div>
            )}

            {userRole === 'client' && (
              <div>
                <div className="section-header">
                  <h2 className="section-title">{getRoleTitle()}</h2>
                </div>
                <div className="p-4 koi-panel">
                  <p>Panel de Cliente - En desarrollo</p>
                  <p className="text-sm text-gray-600 mt-2">
                    Próximamente: Seguimiento de pedidos, modo tótem, QR tracking
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

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
            <div className="mt-2 text-xs text-gray-500">
              <p>Last update: {new Date().toLocaleTimeString('es-CL')}</p>
              <p>Environment: {import.meta.env.MODE}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
