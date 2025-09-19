import type { Order } from "@/types";
import { isDelivered, isDeliveryOrder, hasPickupAndDelivered } from "@/types/guards";

/* Tiempo / fechas */
export function isToday(ts?: number | null): boolean {
  if (!ts) return false;
  const d = new Date(ts);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

export function isBetween(ts: number, start: Date, end: Date): boolean {
  return ts >= start.getTime() && ts <= end.getTime();
}

/* Filtros */
export function filterDeliveredToday(orders: Order[]): Order[] {
  return orders.filter((o) => isDelivered(o) && isToday(o.deliveredAt));
}
export function filterDeliveredInRange(orders: Order[], start: Date, end: Date): Order[] {
  return orders.filter((o) => isDelivered(o) && !!o.deliveredAt && isBetween(o.deliveredAt!, start, end));
}
export function filterDeliveryQueue(orders: Order[]): Order[] {
  return orders.filter((o) => isDeliveryOrder(o) && (o.status === "ready" || o.status === "on_route"));
}

/* Métricas */
export interface DeliveryMetrics {
  count: number;
  avgRouteTimeMs: number;
  totalKm: number;
  avgKm: number;
  withTime: number;
  withRoute: number;
}

export function computeDeliveryMetrics(orders: Order[]): DeliveryMetrics {
  const delivered = orders.filter(isDelivered);
  if (delivered.length === 0) {
    return { count: 0, avgRouteTimeMs: 0, totalKm: 0, avgKm: 0, withTime: 0, withRoute: 0 };
  }

  let sumTime = 0, sumKm = 0, withTime = 0, withRoute = 0;

  for (const o of delivered) {
    if (hasPickupAndDelivered(o)) {
      sumTime += o.deliveredAt - o.pickupAt;
      withTime++;
    }
    const d = o.routeMeta?.distance;
    if (typeof d === "number" && d >= 0) {
      sumKm += d;
      withRoute++;
    }
  }

  return {
    count: delivered.length,
    avgRouteTimeMs: withTime ? sumTime / withTime : 0,
    totalKm: sumKm / 1000,
    avgKm: withRoute ? (sumKm / withRoute) / 1000 : 0,
    withTime,
    withRoute,
  };
}

/* Búsqueda simple */
export function textMatch(o: Order, q: string): boolean {
  const QQ = q.toLowerCase();
  return (
    (o.publicCode ?? "").toLowerCase().includes(QQ) ||
    (o.name ?? "").toLowerCase().includes(QQ) ||
    (o.address ?? "").toLowerCase().includes(QQ) ||
    (o.driver?.name ?? "").toLowerCase().includes(QQ)
  );
}
