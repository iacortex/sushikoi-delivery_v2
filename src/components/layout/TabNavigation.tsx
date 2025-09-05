import React from 'react';
import { ShoppingCart, User, Utensils } from 'lucide-react';

interface Tab {
  key: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  badge?: string | number;
}

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: Tab[];
  className?: string;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
  tabs,
  className = '',
}) => {
  return (
    <nav className={`mb-6 ${className}`} role="tablist">
      <div className="flex flex-wrap gap-2 justify-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`
                px-4 py-2 rounded-lg font-medium transition-all duration-200 
                flex items-center gap-2 relative min-w-[140px] justify-center
                ${isActive 
                  ? 'bg-red-500 text-white shadow-lg transform scale-105' 
                  : 'bg-white text-gray-600 hover:bg-gray-100 hover:shadow-md border border-gray-200'
                }
              `}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.key}`}
              aria-label={tab.label}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
              
              {/* Badge */}
              {tab.badge && (
                <span 
                  className={`
                    absolute -top-2 -right-2 min-w-[20px] h-5 
                    flex items-center justify-center text-xs font-bold
                    rounded-full px-1.5
                    ${isActive 
                      ? 'bg-white text-red-500' 
                      : 'bg-red-500 text-white'
                    }
                  `}
                  aria-label={`${tab.badge} elementos`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};