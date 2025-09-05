import { useCallback, useMemo } from 'react';
import type { Customer, Coordinates } from '@/types';
import type { CustomerRecord, CustomerSearchCriteria } from './customers.types';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { STORAGE_KEYS } from '@/lib/constants';
import { normalizePhone } from '@/lib/format';

// Hook return interface
interface UseCustomersReturn {
  customers: CustomerRecord[];
  addOrUpdateCustomer: (customer: Customer) => CustomerRecord;
  getCustomerByPhone: (phone: string) => CustomerRecord | undefined;
  searchCustomers: (criteria: CustomerSearchCriteria) => CustomerRecord[];
  updateCustomerStats: (phone: string, orderTotal: number) => void;
  deleteCustomer: (phone: string) => void;
  getTopCustomers: (limit?: number) => CustomerRecord[];
}

/**
 * Hook for managing customers with localStorage persistence
 */
export const useCustomers = (): UseCustomersReturn => {
  const [customers, setCustomers] = useLocalStorage<CustomerRecord[]>(STORAGE_KEYS.CUSTOMERS, []);

  // Add or update customer
  const addOrUpdateCustomer = useCallback((customer: Customer): CustomerRecord => {
    const normalizedPhone = normalizePhone(customer.phone);
    const now = Date.now();

    setCustomers(prevCustomers => {
      const existingIndex = prevCustomers.findIndex(c => 
        normalizePhone(c.phone) === normalizedPhone
      );

      const customerRecord: CustomerRecord = {
        ...customer,
        id: customer.phone,
        updatedAt: now,
        createdAt: existingIndex >= 0 ? prevCustomers[existingIndex].createdAt : now,
        totalOrders: existingIndex >= 0 ? prevCustomers[existingIndex].totalOrders : 0,
        totalSpent: existingIndex >= 0 ? prevCustomers[existingIndex].totalSpent : 0,
        lastOrderAt: existingIndex >= 0 ? prevCustomers[existingIndex].lastOrderAt : undefined,
      };

      if (existingIndex >= 0) {
        // Update existing customer
        const updated = [...prevCustomers];
        updated[existingIndex] = customerRecord;
        return updated;
      } else {
        // Add new customer
        return [...prevCustomers, customerRecord];
      }
    });

    // Return the updated record
    const updatedCustomer = customers.find(c => normalizePhone(c.phone) === normalizedPhone);
    return updatedCustomer || { ...customer, id: customer.phone, createdAt: now, updatedAt: now };
  }, [setCustomers, customers]);

  // Get customer by phone
  const getCustomerByPhone = useCallback((phone: string): CustomerRecord | undefined => {
    const normalizedPhone = normalizePhone(phone);
    return customers.find(customer => normalizePhone(customer.phone) === normalizedPhone);
  }, [customers]);

  // Search customers
  const searchCustomers = useCallback((criteria: CustomerSearchCriteria): CustomerRecord[] => {
    const { query, phone, name, city, limit = 10 } = criteria;
    
    let filtered = customers;

    if (phone) {
      const normalizedPhone = normalizePhone(phone);
      filtered = filtered.filter(customer => 
        normalizePhone(customer.phone).includes(normalizedPhone)
      );
    }

    if (name) {
      const nameQuery = name.toLowerCase();
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(nameQuery)
      );
    }

    if (city) {
      const cityQuery = city.toLowerCase();
      filtered = filtered.filter(customer =>
        customer.city.toLowerCase().includes(cityQuery)
      );
    }

    if (query) {
      const queryNormalized = query.toLowerCase();
      const queryPhone = normalizePhone(query);
      
      filtered = filtered.filter(customer => {
        const matchesName = customer.name.toLowerCase().includes(queryNormalized);
        const matchesPhone = normalizePhone(customer.phone).includes(queryPhone);
        const matchesAddress = `${customer.street} ${customer.number}`.toLowerCase().includes(queryNormalized);
        
        return matchesName || matchesPhone || matchesAddress;
      });
    }

    // Sort by last order date (most recent first), then by total spent
    return filtered
      .sort((a, b) => {
        if (a.lastOrderAt && b.lastOrderAt) {
          return b.lastOrderAt - a.lastOrderAt;
        }
        if (a.lastOrderAt && !b.lastOrderAt) return -1;
        if (!a.lastOrderAt && b.lastOrderAt) return 1;
        return (b.totalSpent || 0) - (a.totalSpent || 0);
      })
      .slice(0, limit);
  }, [customers]);

  // Update customer statistics after an order
  const updateCustomerStats = useCallback((phone: string, orderTotal: number) => {
    const normalizedPhone = normalizePhone(phone);
    
    setCustomers(prevCustomers =>
      prevCustomers.map(customer => {
        if (normalizePhone(customer.phone) === normalizedPhone) {
          return {
            ...customer,
            totalOrders: (customer.totalOrders || 0) + 1,
            totalSpent: (customer.totalSpent || 0) + orderTotal,
            lastOrderAt: Date.now(),
            updatedAt: Date.now(),
          };
        }
        return customer;
      })
    );
  }, [setCustomers]);

  // Delete customer
  const deleteCustomer = useCallback((phone: string) => {
    const normalizedPhone = normalizePhone(phone);
    setCustomers(prevCustomers =>
      prevCustomers.filter(customer => normalizePhone(customer.phone) !== normalizedPhone)
    );
  }, [setCustomers]);

  // Get top customers by total spent
  const getTopCustomers = useCallback((limit = 5): CustomerRecord[] => {
    return [...customers]
      .filter(customer => (customer.totalSpent || 0) > 0)
      .sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))
      .slice(0, limit);
  }, [customers]);

  return {
    customers,
    addOrUpdateCustomer,
    getCustomerByPhone,
    searchCustomers,
    updateCustomerStats,
    deleteCustomer,
    getTopCustomers,
  };
};