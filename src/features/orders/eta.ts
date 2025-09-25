// src/features/orders/eta.ts
export type Station = "fria" | "caliente";

export type CartLike = Array<{ id: number; name?: string; cookingTime?: number }>;

export function stationForItem(name: string | undefined): Station {
  const n = (name || "").toLowerCase();
  // muy vendidos => frío
  if (/koi\s*1|koi\s*2|koi\s*2\.0/.test(n)) return "fria";
  // heurística simple: tempura, frito, yakimeshi => caliente
  if (/tempura|frito|acevichado|yakimeshi|tenpura|salteado/.test(n))
    return "caliente";
  return "fria";
}

export function getShiftCapacity(d: Date = new Date()) {
  // L=1 ... D=0
  const day = d.getDay(); // 0..6
  // L–J: 2 fríos, 1 caliente (según tu comentario)
  if (day >= 1 && day <= 4) {
    return { fria: 2, caliente: 1 };
  }
  // resto (V–D) igual por defecto; ajústalo si cambian los turnos
  return { fria: 2, caliente: 1 };
}

export function sumLoadByStation(cart: CartLike) {
  return cart.reduce(
    (acc, it) => {
      const st = stationForItem(it.name);
      const t = Math.max(1, Math.round(it.cookingTime || 15));
      acc[st] += t;
      return acc;
    },
    { fria: 0, caliente: 0 } as Record<Station, number>
  );
}

/**
 * ETA simple por carga total / capacidad, en minutos.
 * queue: pedidos activos (no entregados) en cola, cada uno cart-like
 * newCart: carrito nuevo
 */
export function computeETA(
  queue: Array<CartLike>,
  newCart: CartLike,
  now: Date = new Date()
): number {
  const cap = getShiftCapacity(now); // {fria, caliente}

  const qLoad = queue.reduce(
    (acc, c) => {
      const l = sumLoadByStation(c as any);
      acc.fria += l.fria;
      acc.caliente += l.caliente;
      return acc;
    },
    { fria: 0, caliente: 0 }
  );

  const nLoad = sumLoadByStation(newCart as any);

  const minutesFria = Math.ceil((qLoad.fria + nLoad.fria) / Math.max(1, cap.fria));
  const minutesCal = Math.ceil(
    (qLoad.caliente + nLoad.caliente) / Math.max(1, cap.caliente)
  );

  // mínimo 15 min como pediste
  return Math.max(15, Math.max(minutesFria, minutesCal));
}
