export function clp(n: number | undefined | null): string {
  const v = Math.round(Number(n || 0));
  return `$${new Intl.NumberFormat("es-CL").format(v)}`;
}

export function toInt(x: string | number | undefined | null): number {
  if (typeof x === "number") return Math.round(x);
  return Number(String(x ?? "").replace(/[^\d-]/g, "")) || 0;
}
