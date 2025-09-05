import React, { useMemo } from 'react';
import type { Order } from '@/types';
import { StatsCards } from './StatsCards';
import { TopClientsTable } from './TopClientsTable';

interface DashboardProps {
  orders: Order[];
}

interface DashboardStats {
  total: number;
  byStatus: Record<string, number>;
  due: number;
  deliveredCount: number;
  topClients: Array<{
    name: string;
    phone: string;
    total: number;
    count: number;
  }>;
}

export const Dashboard: React.FC<DashboardProps> = ({ orders }) => {
  const stats = useMemo((): DashboardStats => {
    const total = orders.reduce((sum, order) => sum + order.total, 0);
    
    const byStatus = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const due = orders.filter(order => order.paymentStatus === 'due').length;
    const deliveredCount = orders.filter(order => order.status === 'delivered').length;
    
    // Calculate top clients
    const clientMap = orders.reduce((acc, order) => {
      const key = order.phone || order.name;
      if (!acc[key]) {
        acc[key] = {
          name: order.name,
          phone: order.phone,
          total: 0,
          count: 0,
        };
      }
      acc[key].total += order.total;
      acc[key].count += 1;
      return acc;
    }, {} as Record<string, { name: string; phone: string; total: number; count: number }>);
    
    const topClients = Object.values(clientMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
    
    return {
      total,
      byStatus,
      due,
      deliveredCount,
      topClients,
    };
  }, [orders]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="section-header">
        <h2 className="section-title">📊 Dashboard Ejecutivo</h2>
        <p className="section-subtitle">
          Resumen de ventas, pedidos y clientes principales
        </p>
      </div>

      <StatsCards stats={stats} />
      <TopClientsTable clients={stats.topClients} />
    </div>
  );
};