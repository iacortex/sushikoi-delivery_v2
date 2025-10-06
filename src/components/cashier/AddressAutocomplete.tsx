// src/components/cashier/AddressAutocomplete.tsx
import React from "react";
import { Loader2, MapPin, Search } from "lucide-react";
import type { Coords } from "@/lib/deliveryZones";

type Suggest = {
  label: string;
  coords: Coords;
};

async function searchPhoton(q: string, focus?: Coords): Promise<Suggest[]> {
  if (!q.trim()) return [];
  const base = "https://photon.komoot.io/api/";
  const params = new URLSearchParams({
    q,
    lang: "es",
    limit: "6",
  });
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

export const AddressAutocomplete: React.FC<{
  valueStreet: string;
  valueNumber: string;
  city?: string;
  onChangeStreet: (v: string) => void;
  onChangeNumber: (v: string) => void;
  onPickSuggestion: (s: { coords: Coords; label: string }) => void;
  focusNear?: Coords; // opcional para sesgar resultados
}> = ({ valueStreet, valueNumber, city = "Puerto Montt", onChangeStreet, onChangeNumber, onPickSuggestion, focusNear }) => {
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [items, setItems] = React.useState<Suggest[]>([]);
  const refWrap = React.useRef<HTMLDivElement | null>(null);

  const query = React.useMemo(() => {
    const parts = [
      `${valueStreet || ""} ${valueNumber || ""}`.trim(),
      city,
      "Chile",
    ].filter(Boolean);
    return parts.join(", ");
  }, [valueStreet, valueNumber, city]);

  React.useEffect(() => {
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
            <label className="form-label"><MapPin className="inline mr-1" size={14}/> Calle</label>
            <input className="input" value={valueStreet} onChange={e => onChangeStreet(e.target.value)} placeholder="Ej: Av. Capitán Ávalos"/>
          </div>
          <div>
            <label className="form-label">Número</label>
            <input className="input" value={valueNumber} onChange={e => onChangeNumber(e.target.value)} placeholder="Ej: 6130"/>
          </div>
        </div>
        <div className="self-end">
          <button type="button" onClick={doSearch} className="btn-secondary h-[42px]">
            {busy ? <Loader2 className="animate-spin" size={16}/> : <Search size={16}/>} Buscar
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
              <div className="text-xs text-gray-500">{s.coords.lat.toFixed(5)}, {s.coords.lng.toFixed(5)}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
