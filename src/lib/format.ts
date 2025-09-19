// src/lib/format.ts

/* =========================
   Moneda y números
   ========================= */

export const formatCLP = (value: number): string => {
  try {
    return new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 }).format(
      Math.round(value || 0)
    );
  } catch {
    return String(Math.round(value || 0));
  }
};

/** Distancia en km — tolerante a undefined/null */
export const formatKm = (meters?: number | null): string => {
  if (!Number.isFinite(meters as number)) return "—";
  return `${((meters as number) / 1000).toFixed(1)} km`;
};

/** Duración humana — tolerante a undefined/null */
export const formatDur = (seconds?: number | null): string => {
  if (!Number.isFinite(seconds as number)) return "—";
  const minutes = Math.round((seconds as number) / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours} h ${remainingMinutes} min` : `${hours} h`;
};

/** Zero-pad 2 dígitos */
export const pad = (n: number): string => String(n).padStart(2, "0");

/** MM:SS, evitando negativos */
export const formatTimeRemaining = (milliseconds: number): string => {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${pad(minutes)}:${pad(seconds)}`;
};

/** Últimos 5 dígitos del ID */
export const shortCode = (id: number): string => id.toString().slice(-5);

/** Dirección compacta (calle + número + sector opcional) */
export const formatAddress = (
  street: string,
  number: string,
  sector?: string
): string => `${street} ${number}${sector ? `, ${sector}` : ""}`;

/** Normaliza teléfonos para comparar */
export const normalizePhone = (phone: string): string =>
  phone.replace(/\s|-/g, "");

/** Limita porcentaje a [0..100] */
export const clampPercentage = (value: number): number =>
  Math.max(0, Math.min(100, Math.round(value)));
