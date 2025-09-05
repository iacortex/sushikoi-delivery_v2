import React from 'react';
import { Users } from 'lucide-react';
import { formatCLP } from '@/lib/format';

interface TopClientsTableProps {
  clients: Array<{
    name: string;
    phone: string;
    total: number;
    count: number;
  }>;
}

export const TopClientsTable: React.FC<TopClientsTableProps> = ({ clients }) => {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Users className="text-purple-600" size={20} />
          Top Clientes
        </h3>
      </div>
      
      <div className="card-body">
        {clients.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users size={48} className="mx-auto mb-4 text-gray-300" />
            <p>Sin datos de clientes aún</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-200">
                  <th className="pb-3 text-sm font-medium text-gray-600">
                    #
                  </th>
                  <th className="pb-3 text-sm font-medium text-gray-600">
                    Cliente
                  </th>
                  <th className="pb-3 text-sm font-medium text-gray-600">
                    Teléfono
                  </th>
                  <th className="pb-3 text-sm font-medium text-gray-600 text-center">
                    Pedidos
                  </th>
                  <th className="pb-3 text-sm font-medium text-gray-600 text-right">
                    Total Gastado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {clients.map((client, index) => (
                  <tr 
                    key={`${client.phone}-${index}`}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="py-3 text-sm text-gray-500">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-600 font-semibold text-xs">
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="font-medium text-gray-900">
                        {client.name}
                      </div>
                    </td>
                    <td className="py-3 text-sm text-gray-600">
                      {client.phone}
                    </td>
                    <td className="py-3 text-sm text-gray-600 text-center">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {client.count}
                      </span>
                    </td>
                    <td className="py-3 text-sm font-semibold text-gray-900 text-right">
                      ${formatCLP(client.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};