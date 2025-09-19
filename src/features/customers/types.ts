// src/features/customers/customers.types.ts
// Archivo autocontenido: no depende de "@/types".

/** Coordenadas geográficas básicas */
export interface Coordinates {
  lat: number;
  lng: number;
}

/** Datos base del cliente (formulario) */
export interface Customer {
  name: string;
  phone: string;
  street: string;
  number: string;
  sector?: string;
  city: string;
  references?: string;
}

/** Registro persistido con métricas/fechas (lo que guardas en storage) */
export interface CustomerRecord extends Customer {
  /** Identificador único (recomendado: teléfono normalizado o UUID) */
  id: string;

  /** Fechas en timestamp ms */
  createdAt: number;
  updatedAt: number;

  /** Métricas acumuladas */
  totalOrders: number;  // cantidad de pedidos
  totalSpent: number;   // CLP gastado total

  /** Último pedido (ms). Opcional si nunca ha comprado. */
  lastOrderAt?: number;
}

/** Criterios de búsqueda de clientes */
export interface CustomerSearchCriteria {
  /** Búsqueda libre: nombre, teléfono, dirección */
  query?: string;

  /** Filtros específicos */
  phone?: string;
  name?: string;
  city?: string;

  /** Límite de resultados (default lo define el uso) */
  limit?: number;
}

/** Errores de validación del formulario de cliente */
export interface CustomerFormErrors {
  name?: string;
  phone?: string;
  street?: string;
  number?: string;
  city?: string;
}
