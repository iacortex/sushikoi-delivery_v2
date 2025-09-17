// src/components/cashier/PromotionDetailModal.tsx
import React, { useEffect, useMemo, useState } from "react";
import { KioskModal } from "../ui/KioskModal";
import { DELIVERY_ZONES } from "@/features/menu/catalog";
import DrinksCarousel from "./DrinksCarousel";
import {
  DRINKS_CATALOG,
  type DrinkItem,
  type DrinkCategory,
} from "@/features/menu/drinksCatalog";
import { Clock } from "lucide-react";

/* ============ Tipos ============ */
type ServiceType = "delivery" | "local";
type Protein = "pollo" | "salmon" | "camaron" | "kanikama" | "loco" | "pulpo";
interface ChangeLine { from?: Protein; to?: Protein; fee: number; }
interface SauceLine { qty: number; included?: number; extraFee?: number; feeTotal?: number; }

export interface AddToCartPayload {
  promotionId: number;
  chopsticks: number;
  service: ServiceType;
  deliveryZone?: string;
  deliveryFee?: number;
  changes: ChangeLine[];
  soy?: SauceLine;
  ginger?: SauceLine;
  wasabi?: SauceLine;
  agridulce?: SauceLine;
  acevichada?: SauceLine;
  note?: string;
  extrasTotal: number;
  estimatedTotal: number;
  drinks?: { name: string; price: number; quantity: number }[];
}

/* ============ Constantes/Utils ============ */
const CLP = (n: number) => new Intl.NumberFormat("es-CL").format(Math.max(0, Math.round(n)));
const FEES = {
  proteinChange: 1500,
  soyUnit: 300,
  gingerUnit: 300,
  wasabiUnit: 300,
  agridulceUnit: 500,
  acevichadaUnit: 1000,
};
const PROTEINS: Protein[] = ["pollo", "salmon", "camaron", "kanikama", "loco", "pulpo"];

/** Normaliza zonas a { [zona]: fee } */
const toZoneFeeMap = (zones: unknown): Record<string, number> => {
  if (!zones) return {};
  if (Array.isArray(zones)) {
    return (zones as unknown[]).reduce<Record<string, number>>((acc, raw) => {
      const z = raw as any;
      const key: unknown = z?.code ?? z?.id ?? z?.name ?? z?.zone ?? z?.label;
      const feeRaw: unknown = z?.fee ?? z?.price ?? z?.value ?? z?.cost ?? 0;
      if (typeof key === "string" && key.length) {
        const n = Number(feeRaw);
        acc[key] = Number.isFinite(n) ? n : 0;
      }
      return acc;
    }, {});
  }
  if (typeof zones === "object" && zones) {
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(zones as Record<string, unknown>)) {
      if (typeof v === "number") out[k] = v;
      else if (typeof v === "string") out[k] = Number(v) || 0;
      else if (v && typeof v === "object") {
        const n = Number((v as any).fee ?? (v as any).price ?? (v as any).value ?? (v as any).cost ?? 0);
        out[k] = Number.isFinite(n) ? n : 0;
      } else out[k] = 0;
    }
    return out;
  }
  return {};
};

/* ============ Componente ============ */
type Props = {
  open: boolean;
  onClose: () => void;
  promotionId: number;
  basePrice?: number;
  baseTime?: number;
  name?: string;
  isLargePromo?: boolean;
  onConfirm: (payload: AddToCartPayload) => void;
  onAfterConfirm?: () => void;
};

const PromotionDetailModal: React.FC<Props> = ({
  open, onClose, promotionId,
  basePrice = 0, baseTime = 15,
  name = `Producto #${promotionId}`,
  isLargePromo: isLargePromoProp,
  onConfirm, onAfterConfirm,
}) => {
  /* Servicio + Palillos */
  const [service, setService] = useState<ServiceType>("local");
  const [chopsticks, setChopsticks] = useState<number>(0);

  const ZONE_FEES = useMemo(() => toZoneFeeMap(DELIVERY_ZONES as unknown), []);
  const [zone, setZone] = useState<string>("");
  const deliveryFee = useMemo(() => (service === "delivery" ? ZONE_FEES[zone] ?? 0 : 0), [service, zone, ZONE_FEES]);

  /* Proteínas (cambio) */
  const [fromProtein, setFromProtein] = useState<Protein | undefined>();
  const [toProtein, setToProtein] = useState<Protein | undefined>();
  const proteinChangeFee = useMemo(() => (!fromProtein || !toProtein || fromProtein === toProtein ? 0 : FEES.proteinChange), [fromProtein, toProtein]);

  /* Detecta promos grandes */
  const isLargePromo = useMemo(() => {
    if (typeof isLargePromoProp === "boolean") return isLargePromoProp;
    const m = name?.match(/(\d+)\s*(bocados|piezas|pcs)/i);
    if (m) { const n = parseInt(m[1], 10); if (!isNaN(n) && n >= 30) return true; }
    if (/koi\s*mix|familiar/i.test(name || "")) return true;
    return false;
  }, [name, isLargePromoProp]);

  /* ===== Salsas ===== */
  const [soyQty, setSoyQty] = useState(0);
  const [gingerQty, setGingerQty] = useState(0);
  const [wasabiQty, setWasabiQty] = useState(0);
  const [agridulceQty, setAgridulceQty] = useState(0);
  const [acevichadaQty, setAcevichadaQty] = useState(0);

  const includedSoy = isLargePromo ? 5 : 1;
  const includedGinger = 1;
  const includedWasabi = 1;

  const soyExtraFee = Math.max(0, soyQty - includedSoy) * FEES.soyUnit;
  const gingerExtraFee = Math.max(0, gingerQty - includedGinger) * FEES.gingerUnit;
  const wasabiExtraFee = Math.max(0, wasabiQty - includedWasabi) * FEES.wasabiUnit;
  const agridulceFeeTotal = agridulceQty * FEES.agridulceUnit;
  const acevichadaFeeTotal = acevichadaQty * FEES.acevichadaUnit;

  /* Nota */
  const [note, setNote] = useState("");
  const NOTE_MAX = 140;

  /* ===== Bebidas (carrusel) ===== */
  const [drinkQty, setDrinkQty] = useState<Record<string, number>>({});
  const topDrinks: DrinkItem[] = useMemo(() => {
    const byName = (n: string) => {
      for (const c of DRINKS_CATALOG) { const f = c.items.find((i: DrinkItem) => i.name === n); if (f) return f; }
      return undefined;
    };
    const picked = [
      "Coca Cola 350ml",
      "Sprite 350ml",
      "Fanta 350ml",
      "Monster Regular",
      "Vital sin Gas",
      "Coca Cola 1.5L",
      "El Valle 400ml (Naranja/Durazno/Multi Frutilla)",
    ].map(byName).filter(Boolean) as DrinkItem[];
    if (picked.length < 10) {
      const seen = new Set(picked.map(p => p.id));
      for (const cat of DRINKS_CATALOG as DrinkCategory[]) {
        for (const it of cat.items as DrinkItem[]) {
          if (!seen.has(it.id)) { picked.push(it); seen.add(it.id); }
          if (picked.length >= 12) break;
        }
        if (picked.length >= 12) break;
      }
    }
    return picked;
  }, []);

  const drinkTotal = useMemo(() => {
    const all = DRINKS_CATALOG.flatMap((c: DrinkCategory) => c.items);
    let sum = 0;
    for (const [id, q] of Object.entries(drinkQty)) {
      const it = all.find((d: DrinkItem) => d.id === id);
      if (it && q > 0) sum += it.price * q;
    }
    return sum;
  }, [drinkQty]);

  /* Totales */
  const extrasTotal = useMemo(() =>
    (service === "delivery" ? deliveryFee : 0) +
    proteinChangeFee +
    soyExtraFee + gingerExtraFee + wasabiExtraFee +
    agridulceFeeTotal + acevichadaFeeTotal +
    drinkTotal,
  [service, deliveryFee, proteinChangeFee, soyExtraFee, gingerExtraFee, wasabiExtraFee, agridulceFeeTotal, acevichadaFeeTotal, drinkTotal]);

  const estimatedTotal = basePrice + extrasTotal;

  /* Reset al abrir */
  useEffect(() => {
    if (!open) return;
    setService("local"); setChopsticks(0); setZone("");
    setFromProtein(undefined); setToProtein(undefined);
    setSoyQty(0); setGingerQty(0); setWasabiQty(0);
    setAgridulceQty(0); setAcevichadaQty(0);
    setDrinkQty({}); setNote("");
  }, [open]);

  /* Confirmar */
  const handleConfirm = () => {
    const changes: ChangeLine[] = [];
    if (fromProtein && toProtein && fromProtein !== toProtein) {
      changes.push({ from: fromProtein, to: toProtein, fee: proteinChangeFee });
    }
    const drinks: { name: string; price: number; quantity: number }[] = [];
    const all = DRINKS_CATALOG.flatMap((c: DrinkCategory) => c.items);
    for (const [id, q] of Object.entries(drinkQty)) {
      const it = all.find((d: DrinkItem) => d.id === id);
      if (it && q > 0) drinks.push({ name: it.name, price: it.price, quantity: q });
    }
    const payload: AddToCartPayload = {
      promotionId, chopsticks, service,
      deliveryZone: service === "delivery" ? zone : undefined,
      deliveryFee: service === "delivery" ? deliveryFee : 0,
      changes,
      soy: { qty: soyQty, included: includedSoy, extraFee: soyExtraFee },
      ginger: { qty: gingerQty, included: includedGinger, extraFee: gingerExtraFee },
      wasabi: { qty: wasabiQty, included: includedWasabi, extraFee: wasabiExtraFee },
      agridulce: { qty: agridulceQty, feeTotal: agridulceFeeTotal },
      acevichada: { qty: acevichadaQty, feeTotal: acevichadaFeeTotal },
      note: note.trim() || undefined,
      extrasTotal, estimatedTotal,
      drinks,
    };
    onConfirm(payload);
    onClose();
    if (onAfterConfirm) setTimeout(onAfterConfirm, 0);
  };

  /* ============ UI ============ */
  return (
    <KioskModal
      open={open}
      onClose={onClose}
      title={`Personalizar: ${name}`}
      subtitle={`Precio base $${CLP(basePrice)} • `}
      designWidth={1080}
      designHeight={720}
    >
      <div className="text-[12.5px] md:text-[13px] leading-tight">
        <div className="grid md:grid-cols-12 gap-2">
          {/* IZQUIERDA */}
          <div className="md:col-span-7 space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
            {/* Servicio (selector pegado a Delivery + cargo) */}
            <div className="border rounded-lg p-2.5">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-semibold text-gray-900 text-[14px]">Servicio</h4>
                <span className="hidden sm:flex text-[11px] text-gray-500 items-center gap-1">
                  <Clock size={12} className="text-orange-500" /> ETA base: {baseTime} min
                </span>
              </div>

              <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-[auto_minmax(220px,1fr)_auto] items-center gap-1">
                {/* Botones */}
                <div className="flex gap-1.5">
                  <button
                    className={`h-8 px-2 rounded-md border text-xs ${
                      service === "local" ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                                          : "bg-white border-gray-300 text-gray-700"}`}
                    onClick={() => setService("local")}
                  >
                    Retiro / Local
                  </button>
                  <button
                    className={`h-8 px-2 rounded-md border text-xs ${
                      service === "delivery" ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                                              : "bg-white border-gray-300 text-gray-700"}`}
                    onClick={() => setService("delivery")}
                  >
                    Delivery
                  </button>
                </div>

                {/* Zona + Cargo (pegados) */}
                {service === "delivery" ? (
                  <div className="flex items-center gap-1 whitespace-nowrap">
                    <select
                      className="h-8 flex-1 min-w-[160px] border rounded-md px-2 text-xs"
                      value={zone}
                      onChange={(e) => setZone(e.target.value)}
                    >
                      <option value="">Zona…</option>
                      {Object.keys(ZONE_FEES).map((z) => (
                        <option key={z} value={z}>
                          {z} — ${CLP(ZONE_FEES[z])}
                        </option>
                      ))}
                    </select>
                    <span className="text-[11px] text-gray-600 shrink-0">
                      Cargo: <b className="text-rose-600">${CLP(deliveryFee)}</b>
                    </span>
                  </div>
                ) : (
                  <div />
                )}

                {/* Palillos XS */}
                <div className="justify-self-end min-w-[128px]">
                  <LabeledCounter label="Palillos" value={chopsticks} onChange={setChopsticks} tiny />
                </div>
              </div>

              {/* Cargo en móvil */}
              {service === "delivery" && (
                <div className="sm:hidden text-[12px] text-gray-600 mt-1">
                  Cargo delivery: <b className="text-rose-600">${CLP(deliveryFee)}</b>
                </div>
              )}
            </div>

            {/* Cambio de proteína */}
            <div className="border rounded-lg p-3">
              <h4 className="font-semibold text-gray-900 text-[15px]">Cambio de proteína (1)</h4>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select className="border rounded-lg px-2 py-1.5" value={fromProtein ?? ""} onChange={(e)=>setFromProtein((e.target.value||undefined) as Protein)}>
                  <option value="">De…</option>{PROTEINS.map(p=><option key={p} value={p}>{p}</option>)}
                </select>
                <select className="border rounded-lg px-2 py-1.5" value={toProtein ?? ""} onChange={(e)=>setToProtein((e.target.value||undefined) as Protein)}>
                  <option value="">A…</option>{PROTEINS.map(p=><option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="mt-2 text-sm text-gray-600">Cargo: <b className="text-rose-600">${CLP(proteinChangeFee)}</b></div>
            </div>

            {/* Salsas (todas juntas) */}
            <div className="border rounded-lg p-3">
              <h4 className="font-semibold text-gray-900 text-[15px]">Salsas</h4>
              <div className="text-xs text-gray-500">
                Incluye: soya {includedSoy}, jengibre {includedGinger}, wasabi {includedWasabi}. Contadores parten en 0. Extra c/u $300.
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <Counter label="Soya" value={soyQty} onChange={setSoyQty} dense />
                <Counter label="Jengibre" value={gingerQty} onChange={setGingerQty} dense />
                <Counter label="Wasabi" value={wasabiQty} onChange={setWasabiQty} dense />
              </div>
              <div className="mt-1 text-xs text-gray-600">
                Extra: soya ${CLP(soyExtraFee)}, jengibre ${CLP(gingerExtraFee)}, wasabi ${CLP(wasabiExtraFee)}
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="bg-gray-50 rounded-lg p-2.5 border">
                  <div className="font-medium">Agridulce</div>
                  <div className="mt-1"><Counter dense value={agridulceQty} onChange={setAgridulceQty} label="Unidades" /></div>
                  <div className="mt-1 text-sm text-gray-600">Cargo: <b className="text-rose-600">${CLP(agridulceFeeTotal)}</b></div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 border">
                  <div className="font-medium">Acevichada</div>
                  <div className="mt-1"><Counter dense value={acevichadaQty} onChange={setAcevichadaQty} label="Unidades" /></div>
                  <div className="mt-1 text-sm text-gray-600">Cargo: <b className="text-rose-600">${CLP(acevichadaFeeTotal)}</b></div>
                </div>
              </div>
            </div>
          </div>

          {/* DERECHA */}
          <div className="md:col-span-5 space-y-2.5 md:sticky md:top-0 md:self-start">
            <div className="border rounded-lg p-3">
              <h4 className="font-semibold text-gray-900 text-[15px]">Nota para la cocina / pedido</h4>
              <textarea
                className="mt-2 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-300"
                rows={3} maxLength={NOTE_MAX}
                placeholder="Ej.: sin cebolla en el frito, extra palta, dejar en conserjería, etc."
                value={note} onChange={(e)=>setNote(e.target.value)}
              />
            </div>

            <div className="border rounded-lg p-3">
              <h4 className="font-semibold text-gray-900 text-[15px] mb-2">Resumen</h4>
              <div className="text-sm text-gray-700 space-y-1">
                <div>Promo: <b>{name}</b></div>
                <div>Base: <b>${CLP(basePrice)}</b></div>
                <div className="text-gray-600">Extras: <b className="text-rose-600">${CLP(extrasTotal)}</b></div>
                {note.trim() && <div className="pt-2 border-t text-xs text-gray-600">Nota: “{note.trim()}”</div>}
                <div className="pt-2 border-t mt-2">
                  <div className="text-xs text-gray-500">Total estimado</div>
                  <div className="text-2xl font-bold text-rose-600">${CLP(estimatedTotal)}</div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 border rounded-lg px-4 py-2 hover:bg-gray-50" onClick={onClose}>Cancelar</button>
              <button className="flex-1 bg-emerald-600 text-white rounded-lg px-4 py-2 hover:bg-emerald-700" onClick={handleConfirm}>Agregar al carrito</button>
            </div>
          </div>

          {/* CARRUSEL */}
          <div className="md:col-span-12 mt-1 border-t bg-gray-50 rounded-b-lg">
            <div className="px-2 sm:px-4 py-3">
              <DrinksCarousel items={topDrinks} value={drinkQty} onChange={setDrinkQty} title="Bebidas recomendadas" />
            </div>
          </div>
        </div>
      </div>
    </KioskModal>
  );
};

/* ================== UI compacta ================== */
const Counter: React.FC<{
  label?: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  dense?: boolean;
  tiny?: boolean;
  ariaLabelDecrement?: string;
  ariaLabelIncrement?: string;
}> = ({
  label, value, onChange,
  min = 0, max = Number.POSITIVE_INFINITY,
  dense = false, tiny = false,
  ariaLabelDecrement = "Disminuir", ariaLabelIncrement = "Aumentar",
}) => {
  const size = tiny ? "w-6 h-6 text-[11px]" : dense ? "w-7 h-7 text-xs" : "w-8 h-8";
  const gap  = tiny ? "gap-1" : dense ? "gap-1" : "gap-2";
  const pad  = tiny ? "px-1.5 py-1" : dense ? "px-2 py-1.5" : "px-2 py-2";
  const labelCls = tiny ? "text-xs" : "text-sm";

  return (
    <div className={`flex items-center justify-between bg-white border rounded-lg ${pad}`}>
      {label && <span className={`${labelCls} text-gray-700`}>{label}</span>}
      <div className={`flex items-center ${gap}`}>
        <button aria-label={ariaLabelDecrement} className={`${size} rounded-full border hover:bg-gray-50`} onClick={()=>onChange(Math.max(min, value-1))}>−</button>
        <div className="w-8 text-center select-none">{value}</div>
        <button aria-label={ariaLabelIncrement} className={`${size} rounded-full border hover:bg-gray-50`} onClick={()=>onChange(Math.min(max, value+1))}>＋</button>
      </div>
    </div>
  );
};

const LabeledCounter: React.FC<{ label: string; value: number; onChange: (n: number) => void; dense?: boolean; tiny?: boolean; }>
= ({ label, value, onChange, dense, tiny }) => (<Counter label={label} value={value} onChange={onChange} dense={dense} tiny={tiny} />);

export default PromotionDetailModal;
