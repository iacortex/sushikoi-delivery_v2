import type { Order, OrderStatus, ServiceType } from "@/types";

/** Servicio Delivery (si viene undefined, tratamos como 'delivery') */
export function isDeliveryOrder(o: Order): o is Order & { service: ServiceType } {
  return (o.service ?? "delivery") === "delivery";
}

/** Guards por estado */
export function isPending(o: Order): o is Order & { status: Extract<OrderStatus, "pending"> } {
  return o.status === "pending";
}
export function isCooking(o: Order): o is Order & { status: Extract<OrderStatus, "cooking"> } {
  return o.status === "cooking";
}
export function isReady(o: Order): o is Order & { status: Extract<OrderStatus, "ready"> } {
  return o.status === "ready";
}
export function isOnRoute(o: Order): o is Order & { status: Extract<OrderStatus, "on_route"> } {
  return o.status === "on_route";
}
export function isDelivered(o: Order): o is Order & { status: Extract<OrderStatus, "delivered"> } {
  return o.status === "delivered";
}

/** RouteMeta presente y válido */
export function hasRouteMeta(
  o: Order
): o is Order & { routeMeta: NonNullable<Order["routeMeta"]> } {
  return !!o.routeMeta && Number.isFinite(o.routeMeta.distance) && Number.isFinite(o.routeMeta.duration);
}

/** Timestamps pickup/delivered válidos */
export function hasPickupAndDelivered(
  o: Order
): o is Order & { pickupAt: number; deliveredAt: number } {
  return !!o.pickupAt && !!o.deliveredAt && o.deliveredAt >= o.pickupAt!;
}
