// src/components/cashier/PromotionDetailModal.tsx
import React, { useEffect, useMemo, useState } from "react";
import { KioskModal } from "../ui/KioskModal";
import { DELIVERY_ZONES } from "@/features/menu/catalog";
import { Clock } from "lucide-react";

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
}

const CLP = (n: number) => new Intl.NumberFormat("es-CL").format(Math.max(0, Math.round(n)));
const PROTEINS: Protein[] = ["pollo","salmon","camaron","kanikama"];

const FEES = {
  proteinChange: 1500,
  soyUnit: 300,
  gingerUnit: 300,
  wasabiUnit: 300,
  agridulceUnit: 500,
  acevichadaUnit: 1000,
};

// Normaliza zonas a { [zona]: fee }
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
  if (typeof zones === "object") {
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

type Props = {
  open: boolean;
  onClose: () => void;
  promotionId: number;
  basePrice?: number;
  baseTime?: number;
  name?: string;
  /** Opcional: forzar si es promo grande (si no, se detecta por el nombre) */
  isLargePromo?: boolean;
  onConfirm: (payload: AddToCartPayload) => void;
};

const PromotionDetailModal: React.FC<Props> = ({
  open,
  onClose,
  promotionId,
  basePrice = 0,
  baseTime = 15,
  name = `Producto #${promotionId}`,
  isLargePromo: isLargePromoProp,
  onConfirm,
}) => {
  const [service, setService] = useState<ServiceType>("local");
  const [chopsticks, setChopsticks] = useState<number>(0);

  const ZONE_FEES = useMemo(() => toZoneFeeMap(DELIVERY_ZONES as unknown), []);
  const [zone, setZone] = useState<string>("");

  const deliveryFee = useMemo(() => (service === "delivery" ? (ZONE_FEES[zone] ?? 0) : 0), [service, zone, ZONE_FEES]);

  const [fromProtein, setFromProtein] = useState<Protein | undefined>();
  const [toProtein, setToProtein] = useState<Protein | undefined>();
  const proteinChangeFee = useMemo(() => {
    if (!fromProtein || !toProtein || fromProtein === toProtein) return 0;
    return FEES.proteinChange;
  }, [fromProtein, toProtein]);

  // === Detecta si es "promo grande" por nombre si no viene prop ===
  const isLargePromo = useMemo(() => {
    if (typeof isLargePromoProp === "boolean") return isLargePromoProp;
    const m = name?.match(/(\d+)\s*(bocados|piezas|pcs)/i);
    if (m) {
      const n = parseInt(m[1], 10);
      if (!isNaN(n) && n >= 30) return true;
    }
    if (/koi\s*mix|familiar/i.test(name || "")) return true;
    return false;
  }, [name, isLargePromoProp]);

  // === Salsas (contadores parten en 0) ===
  const [soyQty, setSoyQty] = useState(0);
  const [gingerQty, setGingerQty] = useState(0);
  const [wasabiQty, setWasabiQty] = useState(0);

  // ✅ Inclusiones dinámicas:
  const includedSoy = isLargePromo ? 5 : 1;  // promos grandes: 5 soya, individuales: 1
  const includedGinger = 1;                  // 1 jengibre gratis
  const includedWasabi = 1;                  // 1 wasabi gratis

  const soyExtraFee = Math.max(0, soyQty - includedSoy) * FEES.soyUnit;
  const gingerExtraFee = Math.max(0, gingerQty - includedGinger) * FEES.gingerUnit;
  const wasabiExtraFee = Math.max(0, wasabiQty - includedWasabi) * FEES.wasabiUnit;

  const [agridulceQty, setAgridulceQty] = useState(0);
  const [acevichadaQty, setAcevichadaQty] = useState(0);
  const agridulceFeeTotal = agridulceQty * FEES.agridulceUnit;
  const acevichadaFeeTotal = acevichadaQty * FEES.acevichadaUnit;

  // Nota para cocina (a la derecha, arriba)
  const [note, setNote] = useState("");
  const NOTE_MAX = 140;

  const extrasTotal = useMemo(
    () =>
      (service === "delivery" ? deliveryFee : 0) +
      proteinChangeFee +
      soyExtraFee +
      gingerExtraFee +
      wasabiExtraFee +
      agridulceFeeTotal +
      acevichadaFeeTotal,
    [service, deliveryFee, proteinChangeFee, soyExtraFee, gingerExtraFee, wasabiExtraFee, agridulceFeeTotal, acevichadaFeeTotal]
  );

  const estimatedTotal = basePrice + extrasTotal;

  useEffect(() => {
    if (!open) return;
    setService("local");
    setChopsticks(0);
    setZone("");
    setFromProtein(undefined);
    setToProtein(undefined);
    // contadores en 0 aunque haya gratis
    setSoyQty(0);
    setGingerQty(0);
    setWasabiQty(0);
    setAgridulceQty(0);
    setAcevichadaQty(0);
    setNote("");
  }, [open]);

  const handleConfirm = () => {
    const changes: ChangeLine[] = [];
    if (fromProtein && toProtein && fromProtein !== toProtein) {
      changes.push({ from: fromProtein, to: toProtein, fee: proteinChangeFee });
    }
    const payload: AddToCartPayload = {
      promotionId,
      chopsticks,
      service,
      deliveryZone: service === "delivery" ? zone : undefined,
      deliveryFee: service === "delivery" ? deliveryFee : 0,
      changes,
      // pasamos "included" por salsa para el backend
      soy: { qty: soyQty, included: includedSoy, extraFee: soyExtraFee },
      ginger: { qty: gingerQty, included: includedGinger, extraFee: gingerExtraFee },
      wasabi: { qty: wasabiQty, included: includedWasabi, extraFee: wasabiExtraFee },
      agridulce: { qty: agridulceQty, feeTotal: agridulceFeeTotal },
      acevichada: { qty: acevichadaQty, feeTotal: acevichadaFeeTotal },
      note: note.trim() || undefined,
      extrasTotal,
      estimatedTotal,
    };
    onConfirm(payload);
    onClose();
  };

  return (
    <KioskModal
      open={open}
      onClose={onClose}
      title={`Personalizar: ${name}`}
      subtitle={`Precio base $${CLP(basePrice)} • `}
      designWidth={980}
      designHeight={680}
    >
      <div className="grid grid-cols-12 gap-4">
        {/* Izquierda (scrolleable para no cortar) */}
        <div className="col-span-12 md:col-span-7 space-y-3 md:max-h-[62vh] overflow-y-auto pr-1">
          {/* Servicio */}
          <div className="border rounded-lg p-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900">Servicio</h4>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Clock size={14} className="text-orange-500" />
                ETA base: {baseTime} min
              </span>
            </div>
            <div className="mt-2 flex gap-2">
              <button
                className={`px-3 py-2 rounded-lg border ${service === "local" ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-white border-gray-300 text-gray-700"}`}
                onClick={() => setService("local")}
              >
                Retiro / Local
              </button>
              <button
                className={`px-3 py-2 rounded-lg border ${service === "delivery" ? "bg-rose-50 border-rose-300 text-rose-700" : "bg-white border-gray-300 text-gray-700"}`}
                onClick={() => setService("delivery")}
              >
                Delivery
              </button>
            </div>

            {service === "delivery" && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-sm text-gray-700">Zona de reparto</label>
                  <select
                    className="mt-1 w-full border rounded-lg px-3 py-2"
                    value={zone}
                    onChange={(e) => setZone(e.target.value)}
                  >
                    <option value="">Selecciona zona…</option>
                    {Object.entries(ZONE_FEES).map(([z, fee]) => (
                      <option key={z} value={z}>
                        {z} — ${CLP(fee)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <div className="w-full bg-gray-50 border rounded-lg p-2 text-sm">
                    <div className="text-gray-600">Tarifa delivery</div>
                    <div className="font-semibold text-rose-600">${CLP(deliveryFee)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Palillos + Cambio proteína */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="border rounded-lg p-3">
              <h4 className="font-semibold text-gray-900">Palillos</h4>
              <div className="mt-2">
                <Counter
                  dense
                  value={chopsticks}
                  onChange={(n) => setChopsticks(Math.min(8, Math.max(0, n)))}
                  min={0}
                  max={8}
                  ariaLabelDecrement="Quitar palillos"
                  ariaLabelIncrement="Agregar palillos"
                />
              </div>
            </div>

            <div className="border rounded-lg p-3">
              <h4 className="font-semibold text-gray-900">Cambio de proteína (1)</h4>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <select
                  className="border rounded-lg px-2 py-2"
                  value={fromProtein ?? ""}
                  onChange={(e) => setFromProtein((e.target.value || undefined) as Protein)}
                >
                  <option value="">De…</option>
                  {PROTEINS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <select
                  className="border rounded-lg px-2 py-2"
                  value={toProtein ?? ""}
                  onChange={(e) => setToProtein((e.target.value || undefined) as Protein)}
                >
                  <option value="">A…</option>
                  {PROTEINS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Cargo: <b className="text-rose-600">${CLP(proteinChangeFee)}</b>
              </div>
            </div>
          </div>

          {/* Salsas compactas (incluye dinámico) */}
          <div className="border rounded-lg p-3">
            <h4 className="font-semibold text-gray-900">Salsas</h4>
            <p className="text-xs text-gray-500">
              Incluye: soya <b>{includedSoy}</b>, jengibre <b>{includedGinger}</b>, wasabi <b>{includedWasabi}</b>. 
              Los contadores parten en 0.
            </p>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <LabeledCounter label="Soya" value={soyQty} onChange={setSoyQty} dense />
              <LabeledCounter label="Jengibre" value={gingerQty} onChange={setGingerQty} dense />
              <LabeledCounter label="Wasabi" value={wasabiQty} onChange={setWasabiQty} dense />
            </div>
            <div className="mt-2 text-xs text-gray-800">
              Extra: soya ${CLP(soyExtraFee)} • jengibre ${CLP(gingerExtraFee)} • wasabi ${CLP(wasabiExtraFee)}
            </div>
          </div>

          {/* Agridulce / Acevichada */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="border rounded-lg p-3">
              <h4 className="font-semibold text-gray-900">Agridulce</h4>
              <div className="mt-2">
                <Counter dense value={agridulceQty} onChange={setAgridulceQty} />
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Cargo: <b className="text-rose-600">${CLP(agridulceFeeTotal)}</b>
              </div>
            </div>
            <div className="border rounded-lg p-3">
              <h4 className="font-semibold text-gray-900">Acevichada</h4>
              <div className="mt-2">
                <Counter dense value={acevichadaQty} onChange={setAcevichadaQty} />
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Cargo: <b className="text-rose-600">${CLP(acevichadaFeeTotal)}</b>
              </div>
            </div>
          </div>
        </div>

        {/* Derecha — primero NOTA, luego RESUMEN, luego botones */}
        <div className="col-span-12 md:col-span-5 space-y-3">
          {/* NOTA fija arriba para no perderla al alternar Delivery */}
          <div className="border rounded-lg p-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900">Nota para la cocina / pedido</h4>
              <span className="text-xs text-gray-500">{note.length}/{NOTE_MAX}</span>
            </div>
            <textarea
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-300"
              rows={3}
              maxLength={NOTE_MAX}
              placeholder="Ej.: sin cebolla en el frito, extra palta, dejar en conserjería, etc."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {/* RESUMEN */}
          <div className="border rounded-lg p-3">
            <h4 className="font-semibold text-gray-900 mb-2">Resumen</h4>
            <div className="text-sm text-gray-700 space-y-1">
              <div>Promo: <b>{name}</b></div>
              <div>Base: <b>${CLP(basePrice)}</b></div>
              <div className="text-gray-600">
                Extras: <b className="text-rose-600">${CLP(extrasTotal)}</b>
              </div>
              {note.trim() && (
                <div className="pt-2 border-t text-xs text-gray-600">
                  Nota: “{note.trim()}”
                </div>
              )}
              <div className="pt-2 border-t mt-2">
                <div className="text-xs text-gray-500">Total estimado</div>
                <div className="text-2xl font-bold text-rose-600">${CLP(estimatedTotal)}</div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button className="flex-1 border rounded-lg px-4 py-2 hover:bg-gray-50" onClick={onClose}>
              Cancelar
            </button>
            <button
              className="flex-1 bg-emerald-600 text-white rounded-lg px-4 py-2 hover:bg-emerald-700"
              onClick={handleConfirm}
            >
              Agregar al carrito
            </button>
          </div>
        </div>
      </div>
    </KioskModal>
  );
};

/* =============== UI compacta =============== */
const Counter: React.FC<{
  label?: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  dense?: boolean;
  ariaLabelDecrement?: string;
  ariaLabelIncrement?: string;
}> = ({
  label,
  value,
  onChange,
  min = 0,
  max = Number.POSITIVE_INFINITY,
  dense = false,
  ariaLabelDecrement = "Disminuir",
  ariaLabelIncrement = "Aumentar",
}) => {
  const size = dense ? "w-6 h-6 text-xs" : "w-8 h-8";
  const gap = dense ? "gap-0.5" : "gap-2";
  const pad = dense ? "px-2 py-1" : "px-2 py-2";

  return (
    <div className={`flex items-center justify-between bg-white border rounded-lg ${pad}`}>
      {label && <span className="text-sm text-gray-700">{label}</span>}
      <div className={`flex items-center ${gap}`}>
        <button
          type="button"
          aria-label={ariaLabelDecrement}
          className={`${size} rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center select-none`}
          onClick={() => onChange(Math.max(min, value - 1))}
        >
          −
        </button>
        <span className="w-6 md:w-8 text-center font-semibold">{value}</span>
        <button
          type="button"
          aria-label={ariaLabelIncrement}
          className={`${size} rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center select-none`}
          onClick={() => onChange(Math.min(max, value + 1))}
        >
          +
        </button>
      </div>
    </div>
  );
};

const LabeledCounter: React.FC<{
  label: string;
  value: number;
  onChange: (n: number) => void;
  dense?: boolean;
}> = ({ label, value, onChange, dense }) => (
  <Counter label={label} value={value} onChange={onChange} dense={dense} />
);

export default PromotionDetailModal;
