// src/components/cashier/PromotionDetailModal.tsx
import React, { useMemo, useState } from "react";
import {
  X, Plus, Minus, Utensils, Package, CheckCircle2, StickyNote,
  Droplet, Soup, Flame, FlaskRound, Citrus, Beer, GlassWater
} from "lucide-react";
import { KioskModal } from "@/components/ui/KioskModal";

export type ServiceType = "delivery" | "local";
export type Protein = "pollo" | "salmon" | "camaron" | "kanikama" | "loco" | "pulpo";

interface ChangeLine {
  from?: Protein;
  to?: Protein;
  fee: number;
}
interface SauceLine {
  qty: number;
  included?: number;
  extraFee?: number;
  feeTotal?: number;
}
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

/* ====== Precios de extras (ajústalos a tu realidad) ====== */
const CHANGE_FEE = 1000; // por cambio de proteína
const SOY_PRICE = 300;   // por unidad extra
const GINGER_PRICE = 300;
const WASABI_PRICE = 300;
const AGRIDULCE_PRICE = 1000;  // botellita
const ACEVICHADA_PRICE = 1200; // botellita

/* ====== Util ====== */
const formatCLP = (n: number) => new Intl.NumberFormat("es-CL").format(Math.round(n || 0));

/* ====== UI helpers ====== */
const Stepper: React.FC<{ value: number; min?: number; max?: number; onChange: (v: number) => void; }> = ({ value, min = 0, max = 99, onChange }) => (
  <div className="inline-flex items-center gap-1">
    <button type="button" className="px-2 py-1 border rounded-md hover:bg-gray-50" onClick={() => onChange(Math.max(min, value - 1))}><Minus size={14} /></button>
    <span className="w-8 text-center tabular-nums">{value}</span>
    <button type="button" className="px-2 py-1 border rounded-md hover:bg-gray-50" onClick={() => onChange(Math.min(max, value + 1))}><Plus size={14} /></button>
  </div>
);

type Drink = { key: string; name: string; price: number };
const DRINKS: Drink[] = [
  { key: "coca", name: "Coca-Cola 350ml", price: 1200 },
  { key: "sprite", name: "Sprite 350ml", price: 1200 },
  { key: "fanta", name: "Fanta 350ml", price: 1200 },
  { key: "agua", name: "Agua 500ml", price: 1000 },
];

/* =========================================================
   PromotionDetailModal
   ========================================================= */
type Props = {
  open: boolean;
  onClose: () => void;

  promotionId: number;
  title: string;
  basePrice: number;

  /** Se pasa desde afuera (no se pregunta aquí). */
  service?: ServiceType;

  /** Valores por defecto opcionales */
  defaultChopsticks?: number;
  defaultIncludedSoy?: number;     // por si tu pack incluye salsas base
  defaultIncludedGinger?: number;
  defaultIncludedWasabi?: number;
};

const PromotionDetailModal: React.FC<Props> = ({
  open,
  onClose,
  promotionId,
  title,
  basePrice,
  service = "delivery",
  defaultChopsticks = 0,
  defaultIncludedSoy = 0,
  defaultIncludedGinger = 0,
  defaultIncludedWasabi = 0,
}) => {
  // Cambios de proteína (permitimos 0..n, tu guardia está en CashierPanel.enforceOneProteinChange)
  const [changes, setChanges] = useState<ChangeLine[]>([]);
  // Salsas
  const [soyQty, setSoyQty] = useState<number>(defaultIncludedSoy);
  const [gingerQty, setGingerQty] = useState<number>(defaultIncludedGinger);
  const [wasabiQty, setWasabiQty] = useState<number>(defaultIncludedWasabi);
  // Botellitas
  const [agridulceQty, setAgridulceQty] = useState<number>(0);
  const [acevichadaQty, setAcevichadaQty] = useState<number>(0);
  // Palitos
  const [chopsticks, setChopsticks] = useState<number>(defaultChopsticks);
  // Nota
  const [note, setNote] = useState<string>("");

  // Bebidas
  const [drinkCounts, setDrinkCounts] = useState<Record<string, number>>({});

  // Helpers cambios (simple)
  const addChange = () => {
    setChanges((p) => [...p, { from: undefined, to: undefined, fee: CHANGE_FEE }]);
  };
  const removeChange = (idx: number) => {
    setChanges((p) => p.filter((_, i) => i !== idx));
  };
  const setChange = (idx: number, patch: Partial<ChangeLine>) => {
    setChanges((p) => p.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  };

  // Cálculos
  const soyExtra = Math.max(0, soyQty - defaultIncludedSoy);
  const gingerExtra = Math.max(0, gingerQty - defaultIncludedGinger);
  const wasabiExtra = Math.max(0, wasabiQty - defaultIncludedWasabi);

  const soyFee = soyExtra * SOY_PRICE;
  const gingerFee = gingerExtra * GINGER_PRICE;
  const wasabiFee = wasabiExtra * WASABI_PRICE;
  const agridulceFee = agridulceQty * AGRIDULCE_PRICE;
  const acevichadaFee = acevichadaQty * ACEVICHADA_PRICE;

  const changesFee = changes.reduce((s, c) => s + (c?.fee || 0), 0);

  const drinksLines = useMemo(() => {
    const list: { name: string; price: number; quantity: number }[] = [];
    for (const d of DRINKS) {
      const q = drinkCounts[d.key] || 0;
      if (q > 0) list.push({ name: d.name, price: d.price, quantity: q });
    }
    return list;
  }, [drinkCounts]);

  const drinksTotal = drinksLines.reduce((s, d) => s + d.price * d.quantity, 0);

  const extrasTotal =
    changesFee + soyFee + gingerFee + wasabiFee + agridulceFee + acevichadaFee;

  const estimatedTotal = basePrice + extrasTotal + drinksTotal;

  // build payload para CashierPanel.addToCartDetailed
  const buildPayload = (): AddToCartPayload => {
    const payload: AddToCartPayload = {
      promotionId,
      chopsticks,
      service, // se pasa tal cual (no se elige aquí)
      deliveryZone: undefined,
      deliveryFee: undefined,
      changes,
      soy: { qty: soyQty, included: defaultIncludedSoy, extraFee: soyFee },
      ginger: { qty: gingerQty, included: defaultIncludedGinger, extraFee: gingerFee },
      wasabi: { qty: wasabiQty, included: defaultIncludedWasabi, extraFee: wasabiFee },
      agridulce: { qty: agridulceQty, feeTotal: agridulceFee },
      acevichada: { qty: acevichadaQty, feeTotal: acevichadaFee },
      note: note.trim() || undefined,
      extrasTotal,
      estimatedTotal: basePrice + extrasTotal, // solo ítem; bebidas van aparte como líneas
      drinks: drinksLines.length ? drinksLines : undefined,
    };
    return payload;
  };

  const onConfirm = () => {
    // Dejamos que el padre (PromotionsGrid → CashierPanel) consuma el payload
    const payload = buildPayload();
    (window as any).__KOI_LAST_PROMO_DETAIL__ = payload; // útil para debug rápido
    // Para compatibilidad con tu PromotionsGrid, emitimos un CustomEvent
    window.dispatchEvent(new CustomEvent("KOI_PROMO_DETAIL_CONFIRM", { detail: payload }));
    onClose?.();
  };

  return (
    <KioskModal
      open={open}
      onClose={onClose}
      title={title}
      subtitle={`Base: $${formatCLP(basePrice)}`}
      designWidth={420}
      designHeight={820}
    >
      <div className="space-y-4">
        {/* Cambios de proteína */}
        <section className="p-3 rounded-lg border bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-gray-800">
              <Utensils size={16} className="text-rose-600" />
              <b>Cambio de proteína</b>
            </div>
            <button onClick={addChange} className="text-xs px-2 py-1 border rounded hover:bg-white">
              <Plus size={12} /> agregar
            </button>
          </div>

          {changes.length === 0 ? (
            <p className="text-xs text-gray-500">Sin cambios aplicados.</p>
          ) : (
            <div className="space-y-2">
              {changes.map((c, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 items-center">
                  <select
                    className="border rounded px-2 py-1 text-sm"
                    value={c.from || ""}
                    onChange={(e) => setChange(idx, { from: (e.target.value || undefined) as Protein })}
                  >
                    <option value="">De…</option>
                    <option value="pollo">Pollo</option>
                    <option value="salmon">Salmón</option>
                    <option value="camaron">Camarón</option>
                    <option value="kanikama">Kanikama</option>
                    <option value="loco">Loco</option>
                    <option value="pulpo">Pulpo</option>
                  </select>
                  <select
                    className="border rounded px-2 py-1 text-sm"
                    value={c.to || ""}
                    onChange={(e) => setChange(idx, { to: (e.target.value || undefined) as Protein })}
                  >
                    <option value="">A…</option>
                    <option value="pollo">Pollo</option>
                    <option value="salmon">Salmón</option>
                    <option value="camaron">Camarón</option>
                    <option value="kanikama">Kanikama</option>
                    <option value="loco">Loco</option>
                    <option value="pulpo">Pulpo</option>
                  </select>
                  <div className="text-xs text-gray-700 tabular-nums">${formatCLP(c.fee || 0)}</div>
                  <button className="px-2 py-1 border rounded text-xs hover:bg-white" onClick={() => removeChange(idx)}>
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="mt-2 text-xs text-gray-500">Tarifa por cambio: ${formatCLP(CHANGE_FEE)} c/u</div>
        </section>

        {/* Salsas individuales */}
        <section className="p-3 rounded-lg border bg-gray-50">
          <div className="flex items-center gap-2 text-gray-800 mb-2">
            <Droplet size={16} className="text-rose-600" />
            <b>Salsas</b>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm flex items-center gap-2"><Soup size={14} /> Soya</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">incl. {defaultIncludedSoy}</span>
                <Stepper value={soyQty} onChange={setSoyQty} />
                <span className="w-16 text-right text-sm tabular-nums">${formatCLP(soyFee)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm flex items-center gap-2"><Flame size={14} /> Jengibre</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">incl. {defaultIncludedGinger}</span>
                <Stepper value={gingerQty} onChange={setGingerQty} />
                <span className="w-16 text-right text-sm tabular-nums">${formatCLP(gingerFee)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm flex items-center gap-2"><FlaskRound size={14} /> Wasabi</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">incl. {defaultIncludedWasabi}</span>
                <Stepper value={wasabiQty} onChange={setWasabiQty} />
                <span className="w-16 text-right text-sm tabular-nums">${formatCLP(wasabiFee)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Botellitas (agridulce / acevichada) */}
        <section className="p-3 rounded-lg border bg-gray-50">
          <div className="flex items-center gap-2 text-gray-800 mb-2">
            <Citrus size={16} className="text-rose-600" />
            <b>Botellitas</b>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Agridulce</span>
              <div className="flex items-center gap-2">
                <Stepper value={agridulceQty} onChange={setAgridulceQty} />
                <span className="w-16 text-right text-sm tabular-nums">${formatCLP(agridulceFee)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Acevichada</span>
              <div className="flex items-center gap-2">
                <Stepper value={acevichadaQty} onChange={setAcevichadaQty} />
                <span className="w-16 text-right text-sm tabular-nums">${formatCLP(acevichadaFee)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Palitos */}
        <section className="p-3 rounded-lg border bg-gray-50">
          <div className="flex items-center gap-2 text-gray-800 mb-2">
            <Package size={16} className="text-rose-600" />
            <b>Palitos</b>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Cantidad</span>
            <Stepper value={chopsticks} onChange={setChopsticks} />
          </div>
        </section>

        {/* Bebidas */}
        <section className="p-3 rounded-lg border bg-gray-50">
          <div className="flex items-center gap-2 text-gray-800 mb-2">
            <Beer size={16} className="text-rose-600" />
            <b>Bebidas (opcional)</b>
          </div>
          <div className="space-y-2">
            {DRINKS.map((d) => (
              <div key={d.key} className="flex items-center justify-between">
                <div className="text-sm flex items-center gap-2">
                  <GlassWater size={14} /> {d.name}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">${formatCLP(d.price)}</span>
                  <Stepper
                    value={drinkCounts[d.key] || 0}
                    onChange={(v) => setDrinkCounts((p) => ({ ...p, [d.key]: v }))}
                  />
                </div>
              </div>
            ))}
          </div>
          {drinksLines.length > 0 && (
            <div className="mt-2 text-right text-sm">
              <span className="text-gray-600">Bebidas: </span>
              <b>${formatCLP(drinksTotal)}</b>
            </div>
          )}
        </section>

        {/* Nota */}
        <section className="p-3 rounded-lg border bg-gray-50">
          <div className="flex items-center gap-2 text-gray-800 mb-2">
            <StickyNote size={16} className="text-rose-600" />
            <b>Nota (opcional)</b>
          </div>
          <textarea
            className="w-full border rounded-lg px-3 py-2 text-sm"
            rows={2}
            placeholder="Ej: sin cebollín, separar jengibre / wasabi…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </section>

        {/* Totales */}
        <div className="p-3 rounded-lg border bg-gray-50">
          <div className="flex items-center justify-between text-sm">
            <span>Subtotal promo</span>
            <b>${formatCLP(basePrice)}</b>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Extras</span>
            <b>${formatCLP(extrasTotal)}</b>
          </div>
          {drinksTotal > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span>Bebidas</span>
              <b>${formatCLP(drinksTotal)}</b>
            </div>
          )}
          <div className="mt-2 flex items-center justify-between text-base">
            <span className="text-gray-700">Estimado</span>
            <span className="text-rose-600 font-extrabold">${formatCLP(estimatedTotal)}</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            El cargo de delivery (si aplica) se calculará más adelante según distancia.
          </p>
        </div>

        {/* Acciones */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-3 py-2 text-sm bg-rose-600 text-white rounded-lg hover:bg-rose-700 inline-flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={16} /> Agregar al carrito
          </button>
        </div>
      </div>
    </KioskModal>
  );
};

export default PromotionDetailModal;
