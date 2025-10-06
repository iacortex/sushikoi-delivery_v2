// src/components/cashier/AddressPickerMap.tsx
import React, { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L, { LatLngLiteral } from "leaflet";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({ iconUrl, shadowUrl: iconShadow, iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

export type AddressValue = {
  lat: number | null;
  lng: number | null;
  street?: string;
  number?: string;
  sector?: string;
  city?: string;
  references?: string;
  fullAddress?: string;
};

export default function AddressPickerMap({
  value,
  onChange,
  height = 300,
}: {
  value: AddressValue;
  onChange: (v: AddressValue) => void;
  height?: number;
}) {
  const center: LatLngLiteral = useMemo(() => {
    if (value.lat != null && value.lng != null) return { lat: value.lat, lng: value.lng };
    // Puerto Montt por defecto
    return { lat: -41.4689, lng: -72.9411 };
  }, [value.lat, value.lng]);

  // Recentrar mapa si cambian coords
  const Recenter: React.FC<{ c: LatLngLiteral }> = ({ c }) => {
    const map = useMap();
    useEffect(() => {
      map.setView(c, Math.max(map.getZoom(), 15), { animate: true });
    }, [c, map]);
    return null;
  };

  // Geocodificar cuando el usuario escribe la dirección
  const addressQuery = useMemo(() => {
    const parts = [value.street, value.number, value.sector, value.city || "Puerto Montt", "Chile"]
      .filter((s) => !!(s && String(s).trim())).join(", ");
    return parts;
  }, [value.street, value.number, value.sector, value.city]);

  useEffect(() => {
    if (!addressQuery || addressQuery.length < 4) return;
    const ctrl = new AbortController();
    (async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&q=${encodeURIComponent(addressQuery)}`;
        const res = await fetch(url, { headers: { "Accept-Language": "es-CL" }, signal: ctrl.signal });
        const data = await res.json();
        if (!Array.isArray(data) || !data[0]) return;
        const lat = parseFloat(data[0].lat), lng = parseFloat(data[0].lon);
        onChange({ ...value, lat, lng, fullAddress: data[0].display_name });
      } catch {}
    })();
    return () => ctrl.abort();
  }, [addressQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reverse geocoding al mover el marcador
  const reverse = async (lat: number, lng: number) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&lat=${lat}&lon=${lng}`;
      const res = await fetch(url, { headers: { "Accept-Language": "es-CL" } });
      const data = await res.json();
      const a = data?.address || {};
      onChange({
        ...value,
        lat, lng,
        street: value.street || a.road || a.pedestrian || "",
        number: value.number || a.house_number || "",
        sector: value.sector || a.suburb || a.neighbourhood || "",
        city: value.city || a.city || a.town || a.village || "Puerto Montt",
        fullAddress: data?.display_name,
      });
    } catch {}
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        onChange({ ...value, lat: latitude, lng: longitude });
        reverse(latitude, longitude);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-2 text-sm">
        <div className="text-gray-600">
          {value.fullAddress ? <>Dirección detectada: <b>{value.fullAddress}</b></> : "Escribe la dirección o mueve el pin."}
        </div>
        <button onClick={useMyLocation} type="button" className="px-2 py-1 border rounded-md hover:bg-gray-50">
          Usar mi ubicación
        </button>
      </div>

      <div className="rounded-xl overflow-hidden border" style={{ height }}>
        <MapContainer center={center} zoom={15} className="w-full h-full">
          <Recenter c={center} />
          <TileLayer
            attribution='&copy; OpenStreetMap colaboradores'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {value.lat != null && value.lng != null && (
            <Marker
              position={[value.lat, value.lng]}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  // @ts-ignore
                  const p = e?.target?.getLatLng?.();
                  if (p) reverse(p.lat, p.lng);
                },
              }}
            >
              <Popup>Arrástrame para ajustar</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
}
