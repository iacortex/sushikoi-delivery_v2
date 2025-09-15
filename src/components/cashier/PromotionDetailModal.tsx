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
  extrasTotal: number;
  estimatedTotal: number;
}

const CLP = (n: number) => new Intl.NumberFormat("es-CL").format(Math.max(0, Math.round(n)));
const PROTEINS: Protein[] = ["pollo","salmon","camaron","kanikama","loco","pulpo"];

const FEES = {
  proteinChange: 1000,
  soyUnit: 300,
  gingerUnit: 300,
  wasabiUnit: 300,
  agridulceUnit: 500,
  acevichadaUnit: 1000,
};

/* ========= Normalizador de zonas (tolerante a cualquier forma) =========
   Acepta: array u objeto con cualquier naming de la tarifa (fee/price/value/cost),
   y cualquier naming de la clave (code/id/name/zone/label). Convierte TODO a:
   Record<string, number>
=========================================================================== */
const toZoneFeeMap = (zones: unknown): Record<string, number> => {
  if (!zones) return {};

  // Si es array (p.ej. [{code:'Mirasol', fee:1500}, ...] o [{name:'Centro', value:'2000'}, ...])
  if (Array.isArray(zones)) {
    return (zones as unknown[]).reduce<Record<string, number>>((acc, raw) => {
      const z = raw as any;
      if (!z || typeof z !== "object") return acc;
      const key: unknown = z.code ?? z.id ?? z.name ?? z.zone ?? z.label;
      const feeRaw: unknown = z.fee ?? z.price ?? z.value ?? z.cost ?? 0;
      if (typeof key === "string" && key.length) {
        const feeNum = Number(feeRaw);
        acc[key] = Number.isFinite(feeNum) ? feeNum : 0;
      }
      return acc;
    }, {});
  }

  // Si es objeto (p.ej. { Mirasol: 1500 } o { Mirasol: { fee: '1500' }, ... })
  if (typeof zones === "object") {
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(zones as Record<string, unknown>)) {
      if (typeof v === "number") {
        out[k] = v;
      } else if (typeof v === "string") {
        const n = Number(v);
        out[k] = Number.isFinite(n) ? n : 0;
      } else if (v && typeof v === "object") {
        const feeRaw: unknown = (v as any).fee ?? (v as any).price ?? (v as any).value ?? (v as any).cost ?? 0;
        const n = Number(feeRaw);
        out[k] = Number.isFinite(n) ? n : 0;
      } else {
        out[k] = 0;
      }
    }
    return out;
  }

  return {};
};
/* ========================================================================= */

type Props = {
  open: boolean;
  onClose: () => void;
  promotionId: number;
  basePrice?: number;
  baseTime?: number;
  name?: string;
  onConfirm: (payload: AddToCartPayload) => void;
};

const PromotionDetailModal: React.FC<Props> = ({
  open,
  onClose,
  promotionId,
  basePrice = 0,
  baseTime = 15,
  name = `Producto #${promotionId}`,
  onConfirm,
}) => {
  const [service, setService] = useState<ServiceType>("local");
  const [chopsticks, setChopsticks] = useState<number>(0);

  // ✅ Normalizamos DELIVERY_ZONES sin forzar tipos incompatibles
  const ZONE_FEES = useMemo(() => toZoneFeeMap(DELIVERY_ZONES as unknown), []);

  const [zone, setZone] = useState<string>("");
  const deliveryFee = useMemo(() => {
    if (service !== "delivery") return 0;
    return ZONE_FEES[zone] ?? 0;
  }, [service, zone, ZONE_FEES]);

  const [fromProtein, setFromProtein] = useState<Protein | undefined>(undefined);
  const [toProtein, setToProtein] = useState<Protein | undefined>(undefined);
  const proteinChangeFee = useMemo(() => {
    if (!fromProtein || !toProtein || fromProtein === toProtein) return 0;
    return FEES.proteinChange;
  }, [fromProtein, toProtein]);

  const [soyQty, setSoyQty] = useState(0);
  const [gingerQty, setGingerQty] = useState(0);
  const [wasabiQty, setWasabiQty] = useState(0);
  const included = 2;
  const soyExtraFee = Math.max(0, soyQty - included) * FEES.soyUnit;
  const gingerExtraFee = Math.max(0, gingerQty - included) * FEES.gingerUnit;
  const wasabiExtraFee = Math.max(0, wasabiQty - included) * FEES.wasabiUnit;

  const [agridulceQty, setAgridulceQty] = useState(0);
  const [acevichadaQty, setAcevichadaQty] = useState(0);
  const agridulceFeeTotal = agridulceQty * FEES.agridulceUnit;
  const acevichadaFeeTotal = acevichadaQty * FEES.acevichadaUnit;

  const extrasTotal = useMemo(() => {
    return (
      (service === "delivery" ? deliveryFee : 0) +
      proteinChangeFee +
      soyExtraFee +
      gingerExtraFee +
      wasabiExtraFee +
      agridulceFeeTotal +
      acevichadaFeeTotal
    );
  }, [service, deliveryFee, proteinChangeFee, soyExtraFee, gingerExtraFee, wasabiExtraFee, agridulceFeeTotal, acevichadaFeeTotal]);

  const estimatedTotal = basePrice + extrasTotal;

  useEffect(() => {
    if (!open) return;
    setService("local");
    setChopsticks(0);
    setZone("");
    setFromProtein(undefined);
    setToProtein(undefined);
    setSoyQty(0);
    setGingerQty(0);
    setWasabiQty(0);
    setAgridulceQty(0);
    setAcevichadaQty(0);
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
      soy: { qty: soyQty, included, extraFee: soyExtraFee },
      ginger: { qty: gingerQty, included, extraFee: gingerExtraFee },
      wasabi: { qty: wasabiQty, included, extraFee: wasabiExtraFee },
      agridulce: { qty: agridulceQty, feeTotal: agridulceFeeTotal },
      acevichada: { qty: acevichadaQty, feeTotal: acevichadaFeeTotal },
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
      designHeight={620}
    >
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 md:col-span-7 space-y-4">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="border rounded-lg p-3">
              <h4 className="font-semibold text-gray-900">Palillos</h4>
              <div className="mt-2 flex items-center gap-2">
                <button
                  className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300"
                  onClick={() => setChopsticks((n) => Math.max(0, n - 1))}
                >
                  −
                </button>
                <span className="w-10 text-center font-semibold">{chopsticks}</span>
                <button
                  className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300"
                  onClick={() => setChopsticks((n) => Math.min(8, n + 1))}
                >
                  +
                </button>
              </div>
            </div>

            <div className="border rounded-lg p-3">
              <h4 className="font-semibold text-gray-900">Cambio de proteína (1)</h4>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <select className="border rounded-lg px-2 py-2" value={fromProtein ?? ""} onChange={(e) => setFromProtein((e.target.value || undefined) as Protein)}>
                  <option value="">De…</option>
                  {PROTEINS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <select className="border rounded-lg px-2 py-2" value={toProtein ?? ""} onChange={(e) => setToProtein((e.target.value || undefined) as Protein)}>
                  <option value="">A…</option>
                  {PROTEINS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Cargo: <b className="text-rose-600">${CLP(proteinChangeFee)}</b>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-3">
            <h4 className="font-semibold text-gray-900">Salsas</h4>
            <p className="text-xs text-gray-500">Incluye 2 por item. Extra c/u: soya/ginger/wasabi ${CLP(FEES.soyUnit)}.</p>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Counter label="Soya" value={soyQty} onChange={setSoyQty} />
              <Counter label="Jengibre" value={gingerQty} onChange={setGingerQty} />
              <Counter label="Wasabi" value={wasabiQty} onChange={setWasabiQty} />
            </div>
            <div className="mt-2 text-xs text-gray-600">
              Extra: soya ${CLP(soyExtraFee)} • jengibre ${CLP(gingerExtraFee)} • wasabi ${CLP(wasabiExtraFee)}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="border rounded-lg p-3">
              <h4 className="font-semibold text-gray-900">Agridulce</h4>
              <Counter value={agridulceQty} onChange={setAgridulceQty} />
              <div className="mt-2 text-sm text-gray-600">Cargo: <b className="text-rose-600">${CLP(agridulceFeeTotal)}</b></div>
            </div>
            <div className="border rounded-lg p-3">
              <h4 className="font-semibold text-gray-900">Acevichada</h4>
              <Counter value={acevichadaQty} onChange={setAcevichadaQty} />
              <div className="mt-2 text-sm text-gray-600">Cargo: <b className="text-rose-600">${CLP(acevichadaFeeTotal)}</b></div>
            </div>
          </div>
        </div>

        <div className="col-span-12 md:col-span-5 space-y-3">
          <div className="border rounded-lg p-3">
            <h4 className="font-semibold text-gray-900 mb-2">Resumen</h4>
            <div className="text-sm text-gray-700 space-y-1">
              <div>Promo: <b>{name}</b></div>
              <div>Base: <b>${CLP(basePrice)}</b></div>
              <div className="text-gray-600">
                Extras: <b className="text-rose-600">${CLP(extrasTotal)}</b>
              </div>
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
            <button className="flex-1 bg-emerald-600 text-white rounded-lg px-4 py-2 hover:bg-emerald-700" onClick={handleConfirm}>
              Agregar al carrito
            </button>
          </div>
        </div>
      </div>
    </KioskModal>
  );
};

const Counter: React.FC<{
  label?: string;
  value: number;
  onChange: (n: number) => void;
}> = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between bg-white border rounded-lg px-2 py-2">
    <span className="text-sm text-gray-700">{label}</span>
    <div className="flex items-center gap-2">
      <button className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300" onClick={() => onChange(Math.max(0, value - 1))}>−</button>
      <span className="w-8 text-center font-semibold">{value}</span>
      <button className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300" onClick={() => onChange(value + 1)}>+</button>
    </div>
  </div>
);

export default PromotionDetailModal;
