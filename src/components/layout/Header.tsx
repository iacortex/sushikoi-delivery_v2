import React from 'react';
import { MapPin } from 'lucide-react';
import { ORIGIN } from '@/lib/constants';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ 
  title = "🍣 Sushi Delivery Puerto Montt",
  subtitle = "Sistema de gestión con roles, geocodificación exacta y pagos"
}) => {
  return (
    <header className="section-header">
      <h1 className="text-4xl font-bold text-gray-800 mb-2">
        {title}
      </h1>
      <p className="text-gray-600 mb-4">
        {subtitle}
      </p>
      <div className="inline-flex items-center gap-2 text-sm text-blue-600 bg-blue-50 rounded-full px-4 py-2">
        <MapPin size={16} />
        <span className="font-medium">Origen:</span>
        <span>{ORIGIN.name}</span>
      </div>
    </header>
  );
};