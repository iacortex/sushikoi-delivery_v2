// src/features/orders/useOrders.ts
import { useCallback, useRef, useState } from "react";
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
  /** Extras de delivery / cambios / salsas */
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
  createOrder: (params: CreateOrderParams) => Promise<Order>;
  updateOrderStatus: (id: number, status: OrderStatus) => Promise<void>;
  fetchOrders: () => Promise<Order[]>;
  fetchCustomers: () => Promise<void>;
  /** alias útiles para UIs que esperan estos nombres */
  refetch: () => Promise<Order[]>;
  refresh: () => Promise<Order[]>;
}

/* =========================
   Helpers locales
   ========================= */
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
    .reduce((total, item) => total + item.discountPrice * item.quantity, 0);

  const extras = meta?.extrasTotal ?? 0;
  return itemsSubtotal + extras;
};

/** Si más adelante quieres ruta real (OSRM/Mapbox), cámbialo aquí */
const tryBuildRoute = async (
  _lat: number,
  _lng: number
): Promise<RouteMeta | null> => {
  return null;
};

/* =========================
   Hook principal
   ========================= */
export function useOrders(): UseOrdersReturn {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] =
    useState<UseOrdersReturn["customers"]>([]);
  const initRef = useRef(false);

  // (demo) init vacío
  if (!initRef.current) {
    initRef.current = true;
    setCustomers([]);
  }

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
      const addr = formatAddress(
        customerData.street,
        customerData.number,
        customerData.sector
      );

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
        estimatedTime: getEstimatedCookingTime(cart),
        routeMeta: finalRoute,
        createdBy: "Cajero",
        geocodePrecision: geocodePrecision as any,
        paymentMethod: customerData.paymentMethod,
        paymentStatus: customerData.paymentStatus,
        dueMethod: customerData.dueMethod,
        packUntil: null,
        packed: false,
        meta, // ⬅️ guardamos extras
      };

      setOrders((prev) => [newOrder, ...prev]);

      // (opcional) mantener una libreta de clientes locales
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
        prev.map((o) =>
            o.id === id
              ? {
                  ...o,
                  status,
                  cookingAt:
                    status === "cooking" && !o.cookingAt
                      ? Date.now()
                      : o.cookingAt,
                }
              : o
        )
      );
    },
    []
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
    fetchOrders,
    fetchCustomers,
    refetch,
    refresh,
  };
}
