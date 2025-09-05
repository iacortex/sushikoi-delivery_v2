// Formatting utilities

// Format Chilean peso currency
export const formatCLP = (value: number): string => {
  return new Intl.NumberFormat("es-CL").format(value);
};

// Format distance in kilometers
export const formatKm = (meters: number): string => {
  return `${(meters / 1000).toFixed(1)} km`;
};

// Format duration in human readable format
export const formatDur = (seconds: number): string => {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours} h ${remainingMinutes} min` : `${hours} h`;
};

// Pad number with leading zeros
export const pad = (n: number): string => String(n).padStart(2, "0");

// Format time remaining as MM:SS
export const formatTimeRemaining = (milliseconds: number): string => {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${pad(minutes)}:${pad(seconds)}`;
};

// Get short code from order ID (last 5 digits)
export const shortCode = (id: number): string => {
  return id.toString().slice(-5);
};

// Format address string
export const formatAddress = (street: string, number: string, sector?: string): string => {
  return `${street} ${number}${sector ? `, ${sector}` : ''}`;
};

// Normalize phone number for comparison
export const normalizePhone = (phone: string): string => {
  return phone.replace(/\s|-/g, "");
};

// Get percentage with bounds
export const clampPercentage = (value: number): number => {
  return Math.max(0, Math.min(100, Math.round(value)));
};