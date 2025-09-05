import React from 'react';
import { Store, ChefHat, Truck, User, BarChart3 } from 'lucide-react';
import type { UserRole } from '@/types';

interface RoleSelectorProps {
  currentRole: UserRole;
  showDashboard: boolean;
  onRoleChange: (role: UserRole) => void;
  onDashboardToggle: (show: boolean) => void;
}

interface RoleConfig {
  key: UserRole;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  bgColor: string;
  emoji: string;
}

const ROLES: RoleConfig[] = [
  {
    key: 'cashier',
    label: 'Cajero',
    icon: Store,
    bgColor: 'bg-blue-500',
    emoji: '🏪',
  },
  {
    key: 'cook',
    label: 'Cocina',
    icon: ChefHat,
    bgColor: 'bg-orange-500',
    emoji: '👨‍🍳',
  },
  {
    key: 'delivery',
    label: 'Delivery',
    icon: Truck,
    bgColor: 'bg-green-500',
    emoji: '🛵',
  },
  {
    key: 'client',
    label: 'Cliente',
    icon: User,
    bgColor: 'bg-pink-600',
    emoji: '🙋',
  },
];

export const RoleSelector: React.FC<RoleSelectorProps> = ({
  currentRole,
  showDashboard,
  onRoleChange,
  onDashboardToggle,
}) => {
  const handleRoleClick = (role: UserRole) => {
    onRoleChange(role);
    onDashboardToggle(false);
  };

  const handleDashboardClick = () => {
    onDashboardToggle(!showDashboard);
  };

  return (
    <div className="card mb-6">
      <div className="card-body">
        <div className="flex flex-wrap items-center gap-3 justify-center">
          {/* Role buttons */}
          {ROLES.map((role) => {
            const Icon = role.icon;
            const isActive = currentRole === role.key && !showDashboard;
            
            return (
              <button
                key={role.key}
                onClick={() => handleRoleClick(role.key)}
                className={`
                  px-4 py-2 rounded-lg font-medium transition-all duration-200 
                  flex items-center gap-2 min-w-[120px] justify-center
                  ${isActive 
                    ? `${role.bgColor} text-white shadow-lg transform scale-105` 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                  }
                `}
                aria-pressed={isActive}
                aria-label={`Cambiar a rol de ${role.label}`}
              >
                <span className="text-lg" role="img" aria-hidden="true">
                  {role.emoji}
                </span>
                <span className="hidden sm:inline">{role.label}</span>
                <span className="sm:hidden">{role.label}</span>
              </button>
            );
          })}

          {/* Separator */}
          <div className="hidden sm:block h-8 w-px bg-gray-300" aria-hidden="true" />
          <span className="sm:hidden text-gray-300">|</span>

          {/* Dashboard button */}
          <button
            onClick={handleDashboardClick}
            className={`
              px-4 py-2 rounded-lg font-medium transition-all duration-200 
              flex items-center gap-2 min-w-[120px] justify-center
              ${showDashboard 
                ? 'bg-purple-600 text-white shadow-lg transform scale-105' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
              }
            `}
            aria-pressed={showDashboard}
            aria-label="Ver dashboard"
          >
            <BarChart3 size={18} />
            <span>Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};