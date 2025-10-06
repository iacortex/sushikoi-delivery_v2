// src/components/cashier/CustomerForm.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  User, Phone, Home, MapPin, MessageSquare,
  AlertCircle, Package, Truck, Store, Edit3, CheckCircle, Save, Search, Loader2, Navigation, ExternalLink
} from "lucide-react";
import { CustomerSearch } from "./CustomerSearch";
import { useCustomers } from "@/features/customers/useCustomers";
import type { CustomerRecord } from "@/features/customers/types";
import { normalizePhone } from "@/lib/format";

/* ===================== Tipos ===================== */
interface CartItem {
  id: number;
  name: string;
  description: string;
  items: string[];
  originalPrice: number;
  discountPrice: number;
  discount: number;
  image: string;
  popular: boolean;
  cookingTime: number;
  quantity: number;
}

export type ServiceType = "delivery" | "local";
export type Protein = "pollo" | "salmon" | "camaron" | "kanikama" | "loco" | "pulpo";

interface ChangeLine { from?: Protein; to?: Protein; fee: number; }
interface SauceLine { qty: number; included?: number; extraFee?: number; feeTotal?: number; }

export interface OrderMeta {
  service: ServiceType;
  deliveryZone?: string;
  deliveryFee?: number;
  chopsticks?: number;
  changes?: ChangeLine[];
  soy?: SauceLine;
  ginger?: SauceLine;
  wasabi?: SauceLine;
  agridulce?: SauceLine;
  acevichada?: SauceLine;
  extrasTotal?: number;
}

/** ⬇️ lat/lng/fullAddress para el mapa */
export interface CustomerFormData {
  name: string;
  phone: string;
  street: string;
  number: string;
  sector: string;
  city: string;
  references: string;

  lat?: number | null;
  lng?: number | null;
  fullAddress?: string;

  paymentMethod: "efectivo" | "debito" | "credito" | "transferencia" | "mp";
  paymentStatus: string;
  dueMethod: string;
  mpChannel?: "delivery" | "local";
}

interface FormErrors { [key: string]: string; }

interface LegacyCustomer {
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
}

interface CustomerFormProps {
  customerData: CustomerFormData;
  onCustomerDataChange: (data: CustomerFormData) => void;
  errors: FormErrors;

  customers?: LegacyCustomer[];
  onSelectCustomer: (customer: LegacyCustomer) => void;

  cart: CartItem[];
  cartTotal: number;
  estimatedTime: number;

  onCreateOrder?: () => void;
  isCreatingOrder?: boolean;

  orderMeta?: OrderMeta;
  onRequestEditExtras?: () => void;
  onGoToCart: () => void;

  /** ✅ callback para aplicar delivery automático (500 x km redondeado) */
  onAutoDeliveryFee?: (fee: number, meta?: { km: number; roundedKm: number }) => void;
}

/* ===================== Constantes ===================== */
const CITIES = ["Puerto Montt", "Puerto Varas", "Osorno", "Castro"];
const formatCLP = (n: number) => new Intl.NumberFormat("es-CL").format(Math.round(n || 0));

/* ===================== Helpers ===================== */
type CustomerMode = "new" | "existing";
const clean = (s?: string) => (s ?? "").trim();
const isPhoneOk = (p?: string) => normalizePhone(clean(p)).length >= 9;

const validateCustomer = (c: CustomerFormData): FormErrors => {
  const e: FormErrors = {};
  if (!clean(c.name) || clean(c.name).length < 3) e.name = "Nombre mínimo 3 caracteres";
  if (!isPhoneOk(c.phone)) e.phone = "Teléfono inválido";
  if (!clean(c.street)) e.street = "Calle obligatoria";
  if (!clean(c.number)) e.number = "Número obligatorio";
  if (!clean(c.city)) e.city = "Ciudad obligatoria";
  return e;
};

/* ===================== Mapa & Geocoders ===================== */
const canUseDOM = () => typeof window !== "undefined" && typeof document !== "undefined";
type Coords = { lat: number; lng: number };

/** 📍 Tienda (origen del delivery) — COORDENADAS DEL LOCAL */
const STORE: Coords = { lat: -41.466302246051804, lng: -72.99807345692254 };
const DEFAULT_CENTER: Coords = STORE;

/** Autocompletar con Photon */
type Suggest = { label: string; coords: Coords };
async function searchPhoton(q: string, focus?: Coords): Promise<Suggest[]> {
  if (!q.trim()) return [];
  const base = "https://photon.komoot.io/api/";
  const params = new URLSearchParams({ q, lang: "es", limit: "6" });
  if (focus) {
    params.set("lat", String(focus.lat));
    params.set("lon", String(focus.lng));
  }
  const r = await fetch(`${base}?${params.toString()}`);
  const data = await r.json();
  const feats = Array.isArray(data?.features) ? data.features : [];
  return feats.map((f: any) => ({
    label: f?.properties?.name
      ? [f.properties.name, f.properties.city, f.properties.state].filter(Boolean).join(", ")
      : f?.properties?.label || f?.properties?.street || "Dirección",
    coords: { lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] },
  }));
}

/** Nominatim (geocode) */
async function geocodeAddress(q: string): Promise<{ coords: Coords; display_name: string } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=cl&q=${encodeURIComponent(q)}`;
  const r = await fetch(url, { headers: { "Accept-Language": "es" } });
  const data = await r.json();
  if (Array.isArray(data) && data.length) {
    const f = data[0];
    return { coords: { lat: parseFloat(f.lat), lng: parseFloat(f.lon) }, display_name: f.display_name };
  }
  return null;
}

/** Nominatim (reverse) — devuelve detalles para autocompletar campos */
type ReverseAddr = {
  label: string;
  addr?: {
    road?: string;
    house_number?: string;
    suburb?: string;
    neighbourhood?: string;
    city?: string;
    town?: string;
    village?: string;
  };
};
async function reverseGeocodeRich({ lat, lng }: Coords): Promise<ReverseAddr> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
  const r = await fetch(url, { headers: { "Accept-Language": "es" } });
  const data = await r.json();
  const a = data?.address || {};
  return {
    label: data?.display_name || "",
    addr: {
      road: a.road,
      house_number: a.house_number,
      suburb: a.suburb || a.quarter,
      neighbourhood: a.neighbourhood,
      city: a.city || a.town || a.village || a.state_district,
      town: a.town,
      village: a.village,
    },
  };
}

/** Distancia Haversine (fallback local) */
function haversineKm(a: Coords, b: Coords): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Delivery: $500 por km (ceil) desde la tienda */
const FEE_PER_KM = 500;
function feeForKm(km: number) {
  const roundedKm = Math.max(1, Math.ceil(km));
  return { fee: roundedKm * FEE_PER_KM, roundedKm };
}
function deliveryFeeFromStore(to?: Coords | null) {
  if (!to) return { fee: 0, km: 0, roundedKm: 0 };
  const km = haversineKm(STORE, to);
  const { fee, roundedKm } = feeForKm(km);
  return { fee, km, roundedKm };
}

/* ===================== Autocomplete inline ===================== */
const AddressAutocomplete: React.FC<{
  valueStreet: string;
  valueNumber: string;
  city?: string;
  onChangeStreet: (v: string) => void;
  onChangeNumber: (v: string) => void;
  onPickSuggestion: (s: { coords: Coords; label: string }) => void;
  focusNear?: Coords;
}> = ({ valueStreet, valueNumber, city = "Puerto Montt", onChangeStreet, onChangeNumber, onPickSuggestion, focusNear }) => {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<Suggest[]>([]);
  const refWrap = React.useRef<HTMLDivElement | null>(null);

  const query = useMemo(() => {
    const parts = [`${valueStreet || ""} ${valueNumber || ""}`.trim(), city, "Chile"].filter(Boolean);
    return parts.join(", ");
  }, [valueStreet, valueNumber, city]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (!refWrap.current) return;
      if (!refWrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const doSearch = async () => {
    if (!query.trim()) return;
    setBusy(true);
    try {
      const res = await searchPhoton(query, focusNear);
      setItems(res);
      setOpen(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative" ref={refWrap}>
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MapPin className="inline mr-1" size={14} /> Calle
            </label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              value={valueStreet}
              onChange={(e) => onChangeStreet(e.target.value)}
              placeholder="Ej: Av. Capitán Ávalos"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              value={valueNumber}
              onChange={(e) => onChangeNumber(e.target.value)}
              placeholder="Ej: 6130"
            />
          </div>
        </div>
        <div className="self-end">
          <button type="button" onClick={doSearch} className="btn-secondary h-[42px] px-3 border rounded-lg">
            {busy ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />} Buscar
          </button>
        </div>
      </div>

      {open && items.length > 0 && (
        <div className="absolute z-20 mt-2 w-full bg-white border rounded-lg shadow-lg max-h-64 overflow-auto">
          {items.map((s, idx) => (
            <button
              key={idx}
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-gray-50"
              onClick={() => {
                setOpen(false);
                onPickSuggestion({ coords: s.coords, label: s.label });
              }}
            >
              <div className="text-sm text-gray-900">{s.label}</div>
              <div className="text-xs text-gray-500">
                {s.coords.lat.toFixed(5)}, {s.coords.lng.toFixed(5)}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ===================== Mapa (Leaflet + OSRM) ===================== */
const MapPicker: React.FC<{
  coords: Coords | null;
  onChange: (payload: { coords: Coords; addressLabel?: string; addressParts?: ReverseAddr["addr"] }) => void;
  composedQuery: string;
  /** 🔵 devuelve los km reales por ruta cuando están disponibles */
  onRouteComputed?: (km: number) => void;
}> = ({ coords, onChange, composedQuery, onRouteComputed }) => {
  const [busy, setBusy] = useState(false);
  const [center, setCenter] = useState<Coords>(coords || DEFAULT_CENTER);
  const [RL, setRL] = useState<any>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  // Ruta por carretera (OSRM)
  const [routePts, setRoutePts] = useState<[number, number][]>([]);
  const [routeKm, setRouteKm] = useState<number | null>(null);

  // Preferencia de zoom/encuadre
  const [autoFit, setAutoFit] = useState<boolean>(false); // manual por defecto
  const [lastUserAction, setLastUserAction] = useState<"fitRoute" | "centerClient" | "centerStore" | null>(null);

  useEffect(() => {
    if (!canUseDOM()) return;
    (async () => {
      try {
        const [{ MapContainer, TileLayer, Marker, Polyline, useMap }, L] = await Promise.all([
          import("react-leaflet"),
          import("leaflet"),
        ]);
        const icon = new L.Icon({
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
        });
        L.Marker.prototype.options.icon = icon;
        setRL({ MapContainer, TileLayer, Marker, Polyline, useMap, L });
        setLoadErr(null);
      } catch (e) {
        console.error("Leaflet load error", e);
        setLoadErr("No se pudo cargar el mapa. Verifica dependencias y el CSS de Leaflet.");
      }
    })();
  }, []);

  useEffect(() => {
    if (coords) {
      setCenter(coords);
      computeRoute(STORE, coords, { doFit: autoFit });
    } else {
      setRoutePts([]);
      setRouteKm(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords?.lat, coords?.lng, autoFit]);

  if (!canUseDOM()) return null;
  if (!RL) {
    return (
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b">
          <div className="text-sm text-gray-700 flex items-center gap-2">
            <MapPin size={16} /> Ubicación del cliente
          </div>
          <div className="inline-flex items-center gap-2 text-xs text-gray-500">
            <Loader2 size={14} className="animate-spin" /> Cargando mapa…
          </div>
        </div>
        <div className="h-[360px] bg-gray-100 flex items-center justify-center text-xs text-gray-500 px-3">
          {loadErr ?? "Si tarda, revisa conexión a tile.openstreetmap.org"}
        </div>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Polyline, useMap, L } = RL;

  const Controls: React.FC<{ points: [number, number][], center: Coords, onUserAction: (k: "fitRoute" | "centerClient" | "centerStore") => void }> =
  ({ points, center, onUserAction }) => {
    const map = useMap();

    useEffect(() => {
      const onZoom = () => setLastUserAction(null);
      const onMove = () => setLastUserAction(null);
      map.on("zoomstart", onZoom);
      map.on("movestart", onMove);
      return () => {
        map.off("zoomstart", onZoom);
        map.off("movestart", onMove);
      };
    }, [map]);

    useEffect(() => {
      if (autoFit && points.length > 1) {
        const bounds = L.latLngBounds(points.map(p => L.latLng(p[0], p[1])));
        map.fitBounds(bounds, { padding: [16, 16] });
      }
    }, [points, map]);

    return (
      <div className="absolute z-[400] right-2 top-2 bg-white/90 backdrop-blur rounded-lg shadow border p-2 flex flex-col gap-2">
        <label className="text-xs text-gray-700 flex items-center gap-1">
          <input type="checkbox" checked={autoFit} onChange={(e) => setAutoFit(e.target.checked)} />
          Auto-zoom ruta
        </label>
        <button
          className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
          onClick={() => {
            if (points.length > 1) {
              const bounds = L.latLngBounds(points.map(p => L.latLng(p[0], p[1])));
              map.fitBounds(bounds, { padding: [16, 16] });
              onUserAction("fitRoute");
            }
          }}
        >
          Ruta completa
        </button>
        <button
          className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
          onClick={() => {
            map.setView([center.lat, center.lng], Math.max(map.getZoom(), 18), { animate: true });
            onUserAction("centerClient");
          }}
        >
          Centrar en cliente
        </button>
        <button
          className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
          onClick={() => {
            map.setView([STORE.lat, STORE.lng], Math.max(map.getZoom(), 17), { animate: true });
            onUserAction("centerStore");
          }}
        >
          Centrar en tienda
        </button>
      </div>
    );
  };

  async function computeRoute(from: Coords, to: Coords, _opts?: { doFit?: boolean }) {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
      const r = await fetch(url);
      const data = await r.json();
      const route = data?.routes?.[0];
      if (route?.geometry?.coordinates?.length) {
        const coordsLL = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]] as [number, number]);
        setRoutePts(coordsLL);
        const km = (route.distance || 0) / 1000;
        setRouteKm(km);
        onRouteComputed?.(km);
      } else {
        setRoutePts([]);
        setRouteKm(null);
      }
    } catch {
      setRoutePts([]);
      setRouteKm(null);
    }
  }

  const searchNow = async () => {
    if (!composedQuery.trim()) return;
    setBusy(true);
    try {
      const hit = await geocodeAddress(composedQuery);
      if (hit) {
        setCenter(hit.coords);
        onChange({ coords: hit.coords, addressLabel: hit.display_name });
        await computeRoute(STORE, hit.coords, { doFit: autoFit });
      }
    } finally { setBusy(false); }
  };

  const onDragEnd = async (e: any) => {
    const lat = e.target.getLatLng().lat;
    const lng = e.target.getLatLng().lng;
    const c = { lat, lng };
    setCenter(c);
    setBusy(true);
    try {
      const rev = await reverseGeocodeRich(c);
      onChange({ coords: c, addressLabel: rev.label, addressParts: rev.addr });
      await computeRoute(STORE, c, { doFit: autoFit });
    } finally { setBusy(false); }
  };

  const useMyLocation = async () => {
    if (!navigator.geolocation) return alert("Geolocalización no soportada");
    setBusy(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setCenter(c);
      const rev = await reverseGeocodeRich(c);
      onChange({ coords: c, addressLabel: rev.label, addressParts: rev.addr });
      await computeRoute(STORE, c, { doFit: autoFit });
      setBusy(false);
    }, (err) => {
      console.error(err); alert("No se pudo obtener tu ubicación");
      setBusy(false);
    }, { enableHighAccuracy: true, timeout: 10000 });
  };

  const viewInGMaps = () => {
    const href = `https://www.google.com/maps/search/?api=1&query=${center.lat},${center.lng}`;
    window.open(href, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden relative">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b">
        <div className="text-sm text-gray-700 flex items-center gap-2">
          <MapPin size={16} /> Ubicación del cliente
        </div>
        <div className="flex items-center gap-2">
          <button onClick={useMyLocation} className="btn-secondary h-8 px-3 border rounded-md" title="Usar mi ubicación">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />} Ubicación
          </button>
          <button onClick={searchNow} className="btn-secondary h-8 px-3 border rounded-md" title="Geocodificar dirección escrita">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} Buscar
          </button>
          <button onClick={viewInGMaps} className="btn-secondary h-8 px-3 border rounded-md" title="Ver en Google Maps">
            <ExternalLink size={14} /> Ver en Maps
          </button>
        </div>
      </div>

      <div className="h-[380px]">
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={18}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {/* marcador del cliente (ajustable) */}
          <Marker position={[center.lat, center.lng]} draggable eventHandlers={{ dragend: onDragEnd }} />
          {/* marcador de la tienda */}
          <Marker position={[STORE.lat, STORE.lng]} />
          {/* polilínea de la ruta */}
          {routePts.length > 1 && <Polyline positions={routePts} />}
          {/* Controles propios */}
          <Controls points={routePts} center={center} onUserAction={(k) => setLastUserAction(k)} />
        </MapContainer>
      </div>

      <div className="px-3 py-2 text-xs text-gray-600 bg-gray-50 border-t">
        • Haz zoom con la rueda o botones +/– y arrastra el mapa libremente. • Arrastra el pin para ajustar.
        {routeKm != null && <span className="ml-2"><b>Ruta:</b> {routeKm.toFixed(2)} km</span>}
      </div>
    </div>
  );
};

/* ===================== Componente principal ===================== */
function CustomerForm({
  customerData,
  onCustomerDataChange,
  errors,
  customers,
  onSelectCustomer,
  cart,
  cartTotal,
  estimatedTime,
  onCreateOrder: _onCreateOrder,
  isCreatingOrder: _isCreatingOrder,
  orderMeta,
  onRequestEditExtras,
  onGoToCart,
  onAutoDeliveryFee,
}: CustomerFormProps) {
  const { addOrUpdateCustomer, customers: allCustomers } = useCustomers();

  const [customerMode, setCustomerMode] = useState<CustomerMode>("new");
  const [allowEditExisting, setAllowEditExisting] = useState(false);

  const hasCartItems = cart.length > 0;
  const canGoToCart = hasCartItems;

  const searchSource: LegacyCustomer[] =
    (allCustomers?.length ? allCustomers : (customers ?? [])) as any;

  const requiresMpChannel = customerData.paymentMethod === "mp";
  useEffect(() => {
    if (!requiresMpChannel) return;
    if (!orderMeta?.service) return;
    if (!customerData.mpChannel) {
      onCustomerDataChange({ ...customerData, mpChannel: orderMeta.service });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requiresMpChannel, orderMeta?.service]);

  /* ======= Extras y totales (solo visual; no tocamos orderMeta) ======= */
  const feeOf = (s?: { extraFee?: number; feeTotal?: number }) => s?.extraFee ?? s?.feeTotal ?? 0;
  const saucesFee = useMemo(() => feeOf(orderMeta?.soy) + feeOf(orderMeta?.ginger) + feeOf(orderMeta?.wasabi) + feeOf(orderMeta?.agridulce) + feeOf(orderMeta?.acevichada), [orderMeta]);
  const changesFee = useMemo(() => (orderMeta?.changes ?? []).reduce((s, c) => s + (c?.fee ?? 0), 0), [orderMeta]);
  const deliveryFee = orderMeta?.deliveryFee ?? 0;
  const extrasTotal = useMemo(() => (typeof orderMeta?.extrasTotal === "number" ? orderMeta.extrasTotal : changesFee + saucesFee + deliveryFee), [orderMeta?.extrasTotal, changesFee, saucesFee, deliveryFee]);
  const grandTotal = cartTotal + extrasTotal;

  const existingSelected =
    customerMode === "existing" &&
    !!customerData.name && !!customerData.phone && !!customerData.street && !!customerData.number &&
    !allowEditExisting;

  const setField = (field: keyof CustomerFormData, value: string | undefined) =>
    onCustomerDataChange({ ...customerData, [field]: value } as CustomerFormData);

  /* Dirección compuesta y coords actuales */
  const composedQuery = useMemo(() => {
    const parts = [
      `${customerData.street || ""} ${customerData.number || ""}`.trim(),
      customerData.sector || "",
      customerData.city || "Puerto Montt",
      "Chile",
    ].filter(Boolean);
    return parts.join(", ");
  }, [customerData.street, customerData.number, customerData.sector, customerData.city]);

  const coords: Coords | null =
    typeof customerData.lat === "number" && typeof customerData.lng === "number"
      ? { lat: customerData.lat!, lng: customerData.lng! }
      : null;

  /* ➕ Aplica delivery automático (usar km de RUTA si está disponible) */
  const applyAutoDeliveryKm = (km: number | null) => {
    if (!onAutoDeliveryFee) return;
    if (orderMeta?.service !== "delivery") {
      onAutoDeliveryFee(0, { km: 0, roundedKm: 0 });
      return;
    }
    if (km != null && isFinite(km) && km > 0) {
      const { fee, roundedKm } = feeForKm(km);
      onAutoDeliveryFee(fee, { km, roundedKm });
    } else {
      const { fee, km: hvKm, roundedKm } = deliveryFeeFromStore(coords);
      onAutoDeliveryFee(fee, { km: hvKm, roundedKm });
    }
  };

  // si cambian coords sin ruta aún, aplica haversine (solo delivery)
  useEffect(() => {
    if (!onAutoDeliveryFee) return;
    if (orderMeta?.service === "delivery") {
      const { fee, km, roundedKm } = deliveryFeeFromStore(coords);
      onAutoDeliveryFee(fee, { km, roundedKm });
    } else {
      onAutoDeliveryFee(0, { km: 0, roundedKm: 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerData.lat, customerData.lng, orderMeta?.service]);

  // helper: aplica los AddressParts recibidos del reverse geocode
  const fillFieldsFromAddressParts = (parts?: ReverseAddr["addr"], label?: string) => {
    if (!parts) return;
    const next = { ...customerData };
    if (!next.street && parts.road) next.street = parts.road;
    if (!next.number && parts.house_number) next.number = parts.house_number;
    if (!next.sector && (parts.suburb || parts.neighbourhood)) next.sector = parts.suburb || parts.neighbourhood || "";
    if (!next.city && (parts.city || parts.town || parts.village)) next.city = parts.city || parts.town || parts.village || next.city;
    if (label && !next.fullAddress) next.fullAddress = label;
    onCustomerDataChange(next);
  };

  const persistCustomer = (): CustomerRecord | null => {
    const localErrors = validateCustomer(customerData);
    if (Object.keys(localErrors).length) {
      alert("Faltan datos del cliente. Revisa los campos marcados.");
      return null;
    }

    const saved = addOrUpdateCustomer({
      name: clean(customerData.name),
      phone: normalizePhone(customerData.phone),
      street: clean(customerData.street),
      number: clean(customerData.number),
      sector: clean(customerData.sector),
      city: clean(customerData.city),
      references: clean(customerData.references),
      lat: typeof customerData.lat === "number" ? customerData.lat : undefined,
      lng: typeof customerData.lng === "number" ? customerData.lng : undefined,
      fullAddress: customerData.fullAddress,
    } as any);

    onSelectCustomer?.({
      name: saved.name,
      phone: saved.phone,
      street: saved.street,
      number: saved.number,
      sector: saved.sector,
      city: saved.city,
      references: saved.references,
    });

    return saved;
  };

  /* ===================== UI ===================== */
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header + Toggle */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
              <User className="text-rose-600" />
              Datos del Cliente
            </h2>

            <div className="bg-gray-100 rounded-lg p-1 flex">
              <button
                onClick={() => { setCustomerMode("new"); setAllowEditExisting(false); }}
                className={`px-4 py-2 text-sm rounded-md transition-colors ${customerMode === "new" ? "bg-rose-600 text-white shadow-md" : "text-gray-700 hover:bg-gray-200"}`}
                title="Registrar nuevo cliente"
              >
                Nuevo Cliente
              </button>
              <button
                onClick={() => { setCustomerMode("existing"); setAllowEditExisting(false); }}
                className={`px-4 py-2 text-sm rounded-md transition-colors ${customerMode === "existing" ? "bg-rose-600 text-white shadow-md" : "text-gray-700 hover:bg-gray-200"}`}
                title="Buscar cliente ya registrado"
              >
                Cliente Existente
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Buscador cuando es cliente existente */}
      {customerMode === "existing" && (
        <CustomerSearch
          customers={searchSource}
          onSelectCustomer={(c) => {
            onCustomerDataChange({
              ...customerData,
              name: c.name,
              phone: c.phone,
              street: c.street,
              number: c.number,
              sector: c.sector ?? "",
              city: c.city ?? CITIES[0],
              references: c.references ?? "",
              lat: (c as any)?.lat ?? customerData.lat ?? null,
              lng: (c as any)?.lng ?? customerData.lng ?? null,
              fullAddress: (c as any)?.fullAddress ?? customerData.fullAddress ?? "",
            });
            onSelectCustomer(c);
          }}
        />
      )}

      {/* EXISTENTE seleccionado -> resumen + acciones */}
      {existingSelected && (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle size={18} />
                  <span className="font-semibold">Cliente seleccionado</span>
                </div>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
                  <div><User size={14} className="inline mr-1" /> {customerData.name}</div>
                  <div><Phone size={14} className="inline mr-1" /> {customerData.phone}</div>
                  <div className="md:col-span-2">
                    <Home size={14} className="inline mr-1" />
                    {customerData.street} {customerData.number}
                    {customerData.sector ? `, ${customerData.sector}` : ""} — {customerData.city}
                  </div>
                  {customerData.references && (
                    <div className="md:col-span-2 text-gray-600">
                      <MessageSquare size={14} className="inline mr-1" /> {customerData.references}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="h-10 px-3 rounded-lg border hover:bg-gray-50 text-sm flex items-center gap-1"
                  onClick={() => setAllowEditExisting(true)}
                  title="Editar datos del cliente"
                >
                  <Edit3 size={16} /> Editar
                </button>
                <button
                  className="h-10 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm flex items-center gap-1"
                  onClick={() => persistCustomer()}
                  title="Guardar/actualizar en clientes"
                >
                  <Save size={16} /> Guardar
                </button>
              </div>
            </div>

            <OrderTotals
              cartTotal={cartTotal}
              extrasTotal={extrasTotal}
              grandTotal={grandTotal}
              service={orderMeta?.service}
              deliveryFee={orderMeta?.deliveryFee ?? 0}
              onRequestEditExtras={onRequestEditExtras}
              estimatedTime={estimatedTime}
            />

            <div className="mt-3 flex gap-3">
              <button
                onClick={onGoToCart}
                disabled={!canGoToCart}
                className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Enviar a carrito
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formulario completo (nuevo o editar existente) */}
      {!existingSelected && (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="Nombre completo"
                icon={<User size={16} />}
                value={customerData.name}
                onChange={(v) => setField("name", v)}
                placeholder="Ej: María Soto"
                error={errors.name}
              />
              <Field
                label="Teléfono"
                icon={<Phone size={16} />}
                value={customerData.phone}
                onChange={(v) => setField("phone", v)}
                placeholder="+56 9 1234 5678"
                error={errors.phone}
              />

              {/* Autocomplete Calle/Número */}
              <div className="md:col-span-2">
                <AddressAutocomplete
                  valueStreet={customerData.street}
                  valueNumber={customerData.number}
                  city={customerData.city}
                  onChangeStreet={(v) => setField("street", v)}
                  onChangeNumber={(v) => setField("number", v)}
                  focusNear={STORE}
                  onPickSuggestion={({ coords, label }) => {
                    onCustomerDataChange({
                      ...customerData,
                      lat: coords.lat,
                      lng: coords.lng,
                      fullAddress: label,
                    });
                  }}
                />
                {errors.street && <ErrorText text={errors.street} />}
                {errors.number && <ErrorText text={errors.number} />}
              </div>

              <Field
                label="Población / Sector (opcional)"
                icon={<MapPin size={16} />}
                value={customerData.sector}
                onChange={(v) => setField("sector", v)}
                placeholder="Ej: Mirasol, Puerto Sur"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin size={16} className="inline mr-1" /> Ciudad
                </label>
                <select
                  value={customerData.city}
                  onChange={(e) => setField("city", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                >
                  {CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {errors.city && <ErrorText text={errors.city} />}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MessageSquare size={16} className="inline mr-1" /> Referencias (opcional)
              </label>
              <textarea
                value={customerData.references}
                onChange={(e) => setField("references", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                rows={3}
                placeholder="Ej: Casa amarilla con reja negra, frente al semáforo…"
              />
            </div>

            {/* ======= Mapa + acciones ======= */}
            <MapPicker
              coords={coords}
              composedQuery={composedQuery}
              onChange={({ coords, addressLabel, addressParts }) => {
                onCustomerDataChange({
                  ...customerData,
                  lat: coords.lat,
                  lng: coords.lng,
                  fullAddress: addressLabel || customerData.fullAddress || composedQuery,
                });
                // intenta completar campos si vienen desglosados
                fillFieldsFromAddressParts(addressParts, addressLabel);
              }}
              onRouteComputed={(km) => applyAutoDeliveryKm(km)}
            />

            {/* Resumen ubicación */}
            <div className="mt-2 text-xs text-gray-600">
              Dirección: <b className="text-gray-800">{customerData.fullAddress || composedQuery}</b>
              {coords && (
                <> • <span className="text-gray-500">
                  ({coords.lat.toFixed(6)}, {coords.lng.toFixed(6)})
                </span>
                </>
              )}
            </div>

            {/* Totales + extras (visual) */}
            <OrderTotals
              cartTotal={cartTotal}
              extrasTotal={extrasTotal}
              grandTotal={grandTotal}
              service={orderMeta?.service}
              deliveryFee={orderMeta?.deliveryFee ?? 0}
              onRequestEditExtras={onRequestEditExtras}
              estimatedTime={estimatedTime}
            />

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={() => persistCustomer()}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white"
                title="Guardar cliente"
              >
                <Save size={16} /> Guardar cliente
              </button>
              <button
                onClick={() => { const saved = persistCustomer(); if (saved) onGoToCart(); }}
                disabled={!canGoToCart}
                className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Enviar a carrito
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ========== UI auxiliares ========== */
const Field: React.FC<{
  label: string;
  icon?: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
}> = ({ label, icon, value, onChange, placeholder, error }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {icon && <span className="inline-block mr-1 align-middle">{icon}</span>} {label}
    </label>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent ${
        error ? "border-rose-500" : "border-gray-300"
      }`}
    />
    {error && <ErrorText text={error} />}
  </div>
);

const ErrorText: React.FC<{ text: string }> = ({ text }) => (
  <p className="text-rose-600 text-xs mt-1 flex items-center gap-1">
    <AlertCircle size={12} /> {text}
  </p>
);

const OrderTotals: React.FC<{
  cartTotal: number;
  extrasTotal: number;
  grandTotal: number;
  service?: ServiceType;
  deliveryFee: number;
  onRequestEditExtras?: () => void;
  estimatedTime: number;
}> = ({ cartTotal, extrasTotal, grandTotal, service = "local", deliveryFee, onRequestEditExtras, estimatedTime }) => (
  <div className="mt-6 bg-gray-50 rounded-lg border p-3 text-sm text-gray-700">
    <div className="flex flex-wrap items-center gap-2">
      <Package size={16} className="text-rose-600" />
      <b>Total carrito:</b> ${formatCLP(cartTotal)}
      <span className="hidden sm:inline mx-2 text-gray-300">•</span>
      <b>Extras:</b> ${formatCLP(extrasTotal)}
      <span className="hidden sm:inline mx-2 text-gray-300">•</span>
      <b>Total:</b>{" "}
      <span className="text-rose-600 font-semibold">${formatCLP(grandTotal)}</span>
    </div>
    <div className="mt-1 text-xs text-gray-500">
      <Store size={12} className="inline mr-1" /> Servicio: {service}
      {service === "delivery" && (
        <>
          {" "}— <Truck size={12} className="inline mr-1" /> Delivery: ${formatCLP(deliveryFee)}
        </>
      )}
      {onRequestEditExtras && (
        <button onClick={onRequestEditExtras} className="ml-2 text-blue-600 hover:underline">
          editar extras
        </button>
      )}
    </div>
    <div className="text-xs text-gray-400 mt-1">⏱️ Tiempo estimado: {estimatedTime} min</div>
  </div>
);

/* Exports */
export { CustomerForm };
export default CustomerForm;
