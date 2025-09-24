export function cleanRut(rut: string): string {
  return (rut || "").toUpperCase().replace(/[^0-9K]/g, "");
}

export function computeDV(num: number): string {
  let M = 0, S = 1;
  for (; num; num = Math.floor(num / 10)) {
    S = (S + (num % 10) * (9 - (M++ % 6))) % 11;
  }
  return S ? String(S - 1) : "K";
}

export function validateRut(rut?: string): boolean {
  if (!rut) return false;
  const raw = cleanRut(rut);
  if (raw.length < 2) return false;
  const body = raw.slice(0, -1);
  const dv = raw.slice(-1);
  if (!/^\d+$/.test(body)) return false;
  const calc = computeDV(parseInt(body, 10));
  return dv === calc;
}

export function formatRut(rut?: string): string {
  if (!rut) return "";
  const raw = cleanRut(rut);
  if (raw.length < 2) return raw;
  const body = raw.slice(0, -1);
  const dv = raw.slice(-1);
  // miles con puntos
  const withDots = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${withDots}-${dv}`;
}
