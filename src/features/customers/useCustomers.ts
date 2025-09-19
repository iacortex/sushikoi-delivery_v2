// src/features/customers/useCustomers.ts
import { useCallback, useEffect, useMemo, useState } from "react";

/* =========================
 * Tipos locales (sin imports)
 * ========================= */

export interface Customer {
  name: string;
  phone: string;
  street: string;
  number: string;
  sector?: string;
  city: string;
  references?: string;
}

export interface CustomerRecord extends Customer {
  id: string;           // usamos el phone normalizado como id
  createdAt: number;    // timestamp ms
  updatedAt: number;    // timestamp ms
  totalOrders: number;  // acumulado
  totalSpent: number;   // acumulado CLP
  lastOrderAt?: number; // timestamp ms del último pedido
}

export interface CustomerSearchCriteria {
  query?: string; // búsqueda libre: nombre, phone, dirección
  phone?: string;
  name?: string;
  city?: string;
  limit?: number; // por defecto 10
}

/* =========================
 * Constantes y helpers
 * ========================= */

const STORAGE_KEYS = {
  CUSTOMERS: "sushikoi.customers.v1",
} as const;

// Normaliza teléfono: deja solo dígitos
const normalizePhone = (raw: string) => (raw || "").replace(/\D+/g, "");

// Hook de localStorage minimal, sin dependencias externas
function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // noop
    }
  }, [key, value]);

  return [value, setValue] as const;
}

/* =========================
 * Interfaz pública del hook
 * ========================= */

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
  const [customers, setCustomers] = useLocalStorage<CustomerRecord[]>(
    STORAGE_KEYS.CUSTOMERS,
    []
  );

  // Add or update customer
  const addOrUpdateCustomer = useCallback(
    (customer: Customer): CustomerRecord => {
      const normalizedPhone = normalizePhone(customer.phone);
      const now = Date.now();

      let result: CustomerRecord;

      setCustomers((prev) => {
        const existingIndex = prev.findIndex(
          (c) => normalizePhone(c.phone) === normalizedPhone
        );

        const baseExisting =
          existingIndex >= 0 ? prev[existingIndex] : undefined;

        const customerRecord: CustomerRecord = {
          id: normalizedPhone || customer.phone,
          name: customer.name?.trim() || "Sin nombre",
          phone: customer.phone?.trim() || "",
          street: customer.street?.trim() || "",
          number: customer.number?.trim() || "",
          sector: (customer.sector ?? "").trim(),
          city: customer.city?.trim() || "Puerto Montt",
          references: (customer.references ?? "").trim(),
          createdAt: baseExisting?.createdAt ?? now,
          updatedAt: now,
          totalOrders: baseExisting?.totalOrders ?? 0,
          totalSpent: baseExisting?.totalSpent ?? 0,
          lastOrderAt: baseExisting?.lastOrderAt,
        };

        result = customerRecord;

        if (existingIndex >= 0) {
          // Update existing
          const updated = [...prev];
          updated[existingIndex] = customerRecord;
          return updated;
        } else {
          // Insert new
          return [...prev, customerRecord];
        }
      });

      // devolvemos el registro ya calculado (no dependemos del state “stale”)
      // @ts-expect-error – 'result' siempre queda definido dentro de setCustomers
      return result;
    },
    [setCustomers]
  );

  // Get customer by phone
  const getCustomerByPhone = useCallback(
    (phone: string): CustomerRecord | undefined => {
      const normalizedPhone = normalizePhone(phone);
      return customers.find(
        (customer) => normalizePhone(customer.phone) === normalizedPhone
      );
    },
    [customers]
  );

  // Search customers
  const searchCustomers = useCallback(
    (criteria: CustomerSearchCriteria): CustomerRecord[] => {
      const { query, phone, name, city, limit = 10 } = criteria || {};

      const q = (query || "").toLowerCase().trim();
      const qPhone = normalizePhone(query || "");
      const qName = (name || "").toLowerCase().trim();
      const qCity = (city || "").toLowerCase().trim();
      const qPhoneOnly = normalizePhone(phone || "");

      let filtered = customers;

      if (phone) {
        filtered = filtered.filter((c) =>
          normalizePhone(c.phone).includes(qPhoneOnly)
        );
      }

      if (name) {
        filtered = filtered.filter((c) =>
          c.name.toLowerCase().includes(qName)
        );
      }

      if (city) {
        filtered = filtered.filter((c) =>
          c.city.toLowerCase().includes(qCity)
        );
      }

      if (query) {
        filtered = filtered.filter((c) => {
          const matchesName = c.name.toLowerCase().includes(q);
          const matchesPhone = normalizePhone(c.phone).includes(qPhone);
          const matchesAddress = `${c.street} ${c.number}`
            .toLowerCase()
            .includes(q);
          return matchesName || matchesPhone || matchesAddress;
        });
      }

      // Orden: último pedido más reciente, luego mayor gasto total
      return filtered
        .slice()
        .sort((a, b) => {
          if (a.lastOrderAt && b.lastOrderAt) {
            return b.lastOrderAt - a.lastOrderAt;
          }
          if (a.lastOrderAt && !b.lastOrderAt) return -1;
          if (!a.lastOrderAt && b.lastOrderAt) return 1;
          return (b.totalSpent || 0) - (a.totalSpent || 0);
        })
        .slice(0, Math.max(0, limit));
    },
    [customers]
  );

  // Update customer statistics after an order
  const updateCustomerStats = useCallback(
    (phone: string, orderTotal: number) => {
      const normalizedPhone = normalizePhone(phone);

      setCustomers((prev) =>
        prev.map((c) => {
          if (normalizePhone(c.phone) === normalizedPhone) {
            const now = Date.now();
            return {
              ...c,
              totalOrders: (c.totalOrders || 0) + 1,
              totalSpent: (c.totalSpent || 0) + (Number(orderTotal) || 0),
              lastOrderAt: now,
              updatedAt: now,
            };
          }
          return c;
        })
      );
    },
    [setCustomers]
  );

  // Delete customer
  const deleteCustomer = useCallback(
    (phone: string) => {
      const normalizedPhone = normalizePhone(phone);
      setCustomers((prev) =>
        prev.filter((c) => normalizePhone(c.phone) !== normalizedPhone)
      );
    },
    [setCustomers]
  );

  // Get top customers by total spent
  const getTopCustomers = useCallback(
    (limit = 5): CustomerRecord[] => {
      return customers
        .filter((c) => (c.totalSpent || 0) > 0)
        .slice()
        .sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))
        .slice(0, Math.max(0, limit));
    },
    [customers]
  );

  // Índice por id (si lo necesitas en otros flows)
  useMemo(() => {
    // ejemplo de memo para futuras optimizaciones
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const byId = new Map(customers.map((c) => [c.id, c]));
    return byId;
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
