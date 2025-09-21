// src/dev/seedCustomers.ts
export type CustomerRecord = {
  id: string;
  name: string;
  phone: string;
  street: string;
  number: string;
  sector?: string;
  city?: string;
  references?: string;
  totalOrders?: number;
  totalSpent?: number;
  lastOrderAt?: number;
  createdAt?: number;
  updatedAt?: number;
};

// Usa la MISMA llave que tu useCustomers (ajústala si difiere)
const STORAGE_KEY = 'CUSTOMERS';

const rand = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

const FIRST = [
  'Juan','María','Camila','Javier','Daniela','Felipe','Carla','Diego','Ana','Luis',
  'Josefina','Matías','Constanza','Pedro','Francisca','Tomás','Ignacio','Valentina','Paula','Andrés'
];
const LAST  = [
  'Pérez','García','Soto','Fuentes','Rojas','Castro','Muñoz','Díaz','López','Navarro',
  'Torres','Hernández','Vargas','Reyes','Vera','Figueroa','Silva','Carrasco','González','Molina'
];
const STREETS = [
  'Av. Capitán Ávalos','Los Aromos','Av. Angelmó','Volcán Osorno','Vicuña Mackenna',
  'Diego Portales','Av. Presidente Ibáñez','Av. Cardonal','Egaña','Antonio Varas'
];
const SECTORS = ['Mirasol','Cardonal','Centro','Alerce','Chinquihue','Lenca','Pelluco','Ruta 7'];
const CITIES  = ['Puerto Montt','Puerto Varas','Osorno','Castro','Frutillar','Llanquihue'];

const mkPhone = (i: number) => {
  // +56 9 9xxx xxxx (formato “realista” para Chile, pseudo-único)
  const p1 = 9000 + (i % 9000);
  const p2 = 1000 + ((i * 7) % 9000);
  return `+56 9 9${String(p1).padStart(4,'0')} ${String(p2).padStart(4,'0')}`;
};

const mkCustomer = (i: number): CustomerRecord => {
  const name = `${pick(FIRST)} ${pick(LAST)}`;
  const now = Date.now() - rand(0, 21) * 24 * 60 * 60 * 1000; // últimos 21 días
  const orders = rand(0, 10);
  const spent  = orders === 0 ? 0 : rand(12000, 220000);
  return {
    id: `demo-${i}`,
    name,
    phone: mkPhone(i),
    street: pick(STREETS),
    number: String(rand(10, 9999)),
    sector: Math.random() < 0.7 ? pick(SECTORS) : '',
    city: pick(CITIES),
    references: Math.random() < 0.2 ? 'Casa amarilla, reja negra' : '',
    totalOrders: orders,
    totalSpent: spent,
    lastOrderAt: orders > 0 ? now : undefined,
    createdAt: now,
    updatedAt: now,
  };
};

export function seedCustomers(amount = 200, { overwrite = false } = {}) {
  const existingRaw = localStorage.getItem(STORAGE_KEY);
  if (!overwrite && existingRaw) {
    const arr = JSON.parse(existingRaw) as CustomerRecord[];
    if (arr.length > 0) {
      return { skipped: true, count: arr.length };
    }
  }
  const data = Array.from({ length: amount }, (_, i) => mkCustomer(i + 1));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return { skipped: false, count: data.length };
}

export function clearCustomers() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getCustomersCount() {
  try {
    return (JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as CustomerRecord[]).length;
  } catch { return 0; }
}

export function getSomeCustomers(n = 5) {
  try {
    const arr = (JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as CustomerRecord[]);
    return arr.slice(0, n);
  } catch { return []; }
}
