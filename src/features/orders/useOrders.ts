// src/features/orders/useOrders.ts
import { useCallback, useEffect, useRef, useState } from "react";
import type {
  Order,
  OrderStatus,
  CartItem,
  Coordinates,
  RouteMeta,
  CustomerFormData,
  OrderMeta,
} from "@/types";

/* =========================
   Tipos públicos del hook
   ========================= */
export interface CreateOrderParams {
  customerData: CustomerFormData;
  cart: CartItem[];
  coordinates: Coordinates;
  geocodePrecision: string;
  routeMeta?: RouteMeta | null;
  /** Extras de delivery / cambios / salsas (p. ej. deliveryFee, proteinChange, salsas, drinks) */
  meta?: OrderMeta;
}

export interface UseOrdersReturn {
  orders: Order[];
  customers: Array<{
    name: string;
    phone: string;
    street: string;
    number: string;
    sector?: string;
    city?: string;
    references?: string;
    address?: string;
    createdAt?: number;
  }>;

  // CRUD / Estado
  createOrder: (params: CreateOrderParams) => Promise<Order>;
  updateOrderStatus: (id: number, status: OrderStatus) => Promise<void>;

  // Helpers Delivery
  assignDriver: (id: number, name: string, phone?: string) => Promise<void>;
  startRoute: (id: number) => Promise<void>;      // status -> "on_route" + pickupAt
  markDelivered: (id: number) => Promise<void>;   // status -> "delivered" + deliveredAt
  setReady: (id: number) => Promise<void>;        // status -> "ready"

  // Data
  fetchOrders: () => Promise<Order[]>;
  fetchCustomers: () => Promise<void>;

  /** alias útiles para UIs que esperan estos nombres */
  refetch: () => Promise<Order[]>;
  refresh: () => Promise<Order[]>;
}

/* =========================
   Helpers locales
   ========================= */
const LS_ORDERS = "koi_orders_v3";
const LS_CUSTOMERS = "koi_customers_v1";

const shortCode = (n: number) => n.toString().slice(-6);

const formatAddress = (street?: string, number?: string, sector?: string) =>
  [street, number, sector].filter(Boolean).join(", ");

const gmapsDir = (lat: number, lng: number) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

const wazeUrl = (lat: number, lng: number) =>
  `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;

/** ETA = máx(cookingTime) de los ítems reales (id >= 0) */
const getEstimatedCookingTime = (arr: CartItem[]) =>
  arr
    .filter((i) => (i?.id ?? 0) >= 0)
    .reduce((max, item) => Math.max(max, item.cookingTime || 0), 0) || 15;

/**
 * Total robusto:
 *  - Subtotal de ítems "reales" (ignorando líneas sintéticas con id < 0, como "Extras")
 *  + meta.extrasTotal (si existe)
 */
const calcOrderTotal = (arr: CartItem[], meta?: OrderMeta) => {
  const itemsSubtotal = arr
    .filter((i) => (i?.id ?? 0) >= 0)
    .reduce((total, item) => {
      const unit = item.discountPrice ?? item.originalPrice ?? 0; // ⬅️ FIX
      const qty = item.quantity ?? 1;
      return total + unit * qty;
    }, 0);

  const extras = meta?.extrasTotal ?? 0;
  return itemsSubtotal + extras;
};

/** Si más adelante quieres ruta real (OSRM/Mapbox), cámbialo aquí */
const tryBuildRoute = async (_lat: number, _lng: number): Promise<RouteMeta | null> => {
  return null;
};

/* =========================
   Hook principal
   ========================= */
export function useOrders(): UseOrdersReturn {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<UseOrdersReturn["customers"]>([]);
  const initRef = useRef(false);

  // Hydrate desde localStorage una única vez
  if (!initRef.current) {
    initRef.current = true;
    try {
      const rawO = localStorage.getItem(LS_ORDERS);
      const rawC = localStorage.getItem(LS_CUSTOMERS);
      if (rawO) setOrders(JSON.parse(rawO));
      if (rawC) setCustomers(JSON.parse(rawC));
    } catch {
      // si algo falla, seguimos con estados vacíos
    }
  }

  // Persistencia
  useEffect(() => {
    try { localStorage.setItem(LS_ORDERS, JSON.stringify(orders)); } catch {}
  }, [orders]);
  useEffect(() => {
    try { localStorage.setItem(LS_CUSTOMERS, JSON.stringify(customers)); } catch {}
  }, [customers]);

  const createOrder = useCallback(
    async (params: CreateOrderParams): Promise<Order> => {
      const {
        customerData,
        cart,
        coordinates,
        geocodePrecision,
        routeMeta,
        meta,
      } = params;

      const id = Date.now();
      const addr = formatAddress(customerData.street, customerData.number, customerData.sector);

      const finalRoute =
        routeMeta ?? (await tryBuildRoute(coordinates.lat, coordinates.lng));

      const newOrder: Order = {
        id,
        publicCode: shortCode(id),
        name: customerData.name,
        phone: customerData.phone,
        address: addr,
        city: customerData.city,
        references: customerData.references,
        cart: [...cart],
        total: calcOrderTotal(cart, meta), // ⬅️ ítems reales + extrasTotal
        coordinates,
        mapsUrl: gmapsDir(coordinates.lat, coordinates.lng),
        wazeUrl: wazeUrl(coordinates.lat, coordinates.lng),
        status: "pending",
        timestamp: new Date().toLocaleString("es-CL"),
        createdAt: Date.now(),
        cookingAt: null,
        /** tiempo estimado (min) en base a los items reales */
        estimatedTime: getEstimatedCookingTime(cart),
        routeMeta: finalRoute ?? undefined,
        createdBy: "Cajero",
        geocodePrecision: geocodePrecision as any,
        paymentMethod: customerData.paymentMethod,
        paymentStatus: customerData.paymentStatus,
        dueMethod: customerData.dueMethod,
        packUntil: null,
        packed: false,
        // Campos útiles para Delivery (si tu tipo Order ya los define, quedarán poblados al usarlos)
        // readyAt: undefined,
        // pickupAt: undefined,
        // deliveredAt: undefined,
        // driver: undefined,
        meta, // ⬅️ guardamos extras completos para boleta y auditoría
      };

      setOrders((prev) => [newOrder, ...prev]);

      // (opcional) mantener libreta local de clientes (evita duplicados por teléfono)
      const addressFull =
        [customerData.street, customerData.number, customerData.sector, customerData.city]
          .filter(Boolean)
          .join(", ") || addr;

      setCustomers((prev) => {
        const exists = prev.some((c) => c.phone === customerData.phone);
        if (exists) return prev;
        return [
          {
            name: customerData.name,
            phone: customerData.phone,
            street: customerData.street,
            number: customerData.number,
            sector: customerData.sector,
            city: customerData.city,
            references: customerData.references,
            address: addressFull,
            createdAt: Date.now(),
          },
          ...prev,
        ];
      });

      return newOrder;
    },
    []
  );

  const updateOrderStatus = useCallback(
    async (id: number, status: OrderStatus) => {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== id) return o;

          // timestamps inteligentes según estado
          const patch: Partial<Order> = { status };

          if (status === "cooking" && !o.cookingAt) {
            (patch as any).cookingAt = Date.now();
          }
          if (status === "ready") {
            (patch as any).readyAt = Date.now();
          }
          if (status === "on_route") {
            (patch as any).pickupAt = Date.now();
          }
          if (status === "delivered") {
            (patch as any).deliveredAt = Date.now();
          }

          return { ...o, ...patch };
        })
      );
    },
    []
  );

  /* ======== Helpers Delivery ======== */
  const assignDriver = useCallback(async (id: number, name: string, phone?: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id ? ({ ...o, driver: { name, phone: phone || undefined } } as Order) : o
      )
    );
  }, []);

  const startRoute = useCallback(
    async (id: number) => {
      await updateOrderStatus(id, "on_route" as OrderStatus);
    },
    [updateOrderStatus]
  );

  const markDelivered = useCallback(
    async (id: number) => {
      await updateOrderStatus(id, "delivered" as OrderStatus);
    },
    [updateOrderStatus]
  );

  const setReady = useCallback(
    async (id: number) => {
      await updateOrderStatus(id, "ready" as OrderStatus);
    },
    [updateOrderStatus]
  );

  /** Si tienes backend, reemplaza por fetch real y setOrders(...) */
  const fetchOrders = useCallback(async (): Promise<Order[]> => {
    return orders;
  }, [orders]);

  /** Si tienes backend de clientes, reemplázalo por fetch real y setCustomers(...) */
  const fetchCustomers = useCallback(async () => {
    return;
  }, []);

  /** Aliases esperados por la UI */
  const refetch = fetchOrders;
  const refresh = fetchOrders;

  return {
    orders,
    customers,
    createOrder,
    updateOrderStatus,
    // Delivery helpers
    assignDriver,
    startRoute,
    markDelivered,
    setReady,
    // Data
    fetchOrders,
    fetchCustomers,
    refetch,
    refresh,
  };
}
