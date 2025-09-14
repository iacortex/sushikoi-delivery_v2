import React, { useMemo, useState } from "react";
import { KioskModal } from "@/components/ui/KioskModal";
import { DELIVERY_ZONES } from "../../features/menu/catalog";

/* === Tipos locales compatibles con CashierPanel === */
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

/* === Reglas de costos por cambio (ejemplo) === */
function changeCost(from?: Protein, to?: Protein): number {
  if (!from || !to || from === to) return 0;
  const cheap: Protein[] = ["pollo", "kanikama"];
  const mid: Protein[] = ["salmon", "camaron"];
  const high: Protein[] = ["loco", "pulpo"];

  const bucket = (p: Protein) => (cheap.includes(p) ? 0 : mid.includes(p) ? 1 : 2);
  const delta = bucket(to) - bucket(from);
  if (delta <= 0) return 0;
  if (delta === 1) return 2500; // cheap→mid o mid→high
  return 4000;                  // cheap→high
}

/** Cambia este valor si cobras palitos extra */
const CHOPSTICK_UNIT_FEE = 0; // CLP por palito

interface Props {
  open: boolean;
  onClose: () => void;
  promotionId: number;
  title: string;
  subtitle?: string;
  basePrice: number;        // precio base de la promo
  onConfirm: (payload: AddToCartPayload) => void;
}

export const PromotionDetailModal: React.FC<Props> = ({
  open, onClose, promotionId, title, subtitle, basePrice, onConfirm
}) => {
  const [service, setService] = useState<ServiceType>("local");
  const [chopsticks, setChopsticks] = useState<number>(2);

  // Delivery
  const [deliveryZone, setDeliveryZone] = useState<string>("");
  const deliveryFee = useMemo(() => {
    if (service !== "delivery") return 0;
    const z = DELIVERY_ZONES.find(z => z.value === deliveryZone);
    return z?.fee ?? 0;
  }, [service, deliveryZone]);

  // Cambios (máx 2 visibles, pero restringimos a 1 por defecto)
  const [c1From, setC1From] = useState<Protein | undefined>();
  const [c1To,   setC1To]   = useState<Protein | undefined>();
  const [c2From, setC2From] = useState<Protein | undefined>();
  const [c2To,   setC2To]   = useState<Protein | undefined>();

  // Salsas
  const [soy, setSoy]               = useState<SauceLine>({ qty: 0, included: 4, extraFee: 0 });
  const [ginger, setGinger]         = useState<SauceLine>({ qty: 1, included: 1, extraFee: 0 });
  const [wasabi, setWasabi]         = useState<SauceLine>({ qty: 1, included: 1, extraFee: 0 });
  const [agridulce, setAgridulce]   = useState<SauceLine>({ qty: 0, included: 0, feeTotal: 0 });
  const [acevichada, setAcevichada] = useState<SauceLine>({ qty: 0, included: 0, feeTotal: 0 });

  const proteins: Protein[] = ["pollo", "kanikama", "salmon", "camaron", "loco", "pulpo"];

  // costos
  const c1Cost = useMemo(() => changeCost(c1From, c1To), [c1From, c1To]);
  const c2Cost = useMemo(() => changeCost(c2From, c2To), [c2From, c2To]);

  const soyExtra     = Math.max(0, (soy.qty ?? 0) - (soy.included ?? 0)) * 300;
  const gingExtra    = Math.max(0, (ginger.qty ?? 0) - (ginger.included ?? 0)) * 300;
  const wasabiExtra  = Math.max(0, (wasabi.qty ?? 0) - (wasabi.included ?? 0)) * 300;

  const saucesTotal  = soyExtra + gingExtra + wasabiExtra + (agridulce.feeTotal ?? 0) + (acevichada.feeTotal ?? 0);
  const changesTotal = c1Cost + c2Cost;
  const chopsticksFee = (chopsticks || 0) * CHOPSTICK_UNIT_FEE;

  // Ahora extras TOTAL también considera delivery y palitos
  const extrasTotal  = saucesTotal + changesTotal + deliveryFee + chopsticksFee;
  const estimatedTotal = basePrice + extrasTotal;

  const toCLP = (n: number) => new Intl.NumberFormat("es-CL").format(n);

  const handleConfirm = () => {
    // “Solo 1 cambio” por defecto
    let changes: ChangeLine[] = [];
    if (c1From && c1To) changes.push({ from: c1From, to: c1To, fee: c1Cost });
    if (c2From && c2To) {
      if (changes.length >= 1) {
        const ok = window.confirm("Ya tienes 1 cambio de proteína. ¿Quieres agregar otro cambio?");
        if (ok) changes.push({ from: c2From, to: c2To, fee: c2Cost });
      } else {
        changes.push({ from: c2From, to: c2To, fee: c2Cost });
      }
    }

    const payload: AddToCartPayload = {
      promotionId,
      chopsticks,
      service,
      deliveryZone: service === "delivery" ? deliveryZone : undefined,
      deliveryFee:  service === "delivery" ? deliveryFee   : 0,
      changes,
      soy: { ...soy, extraFee: soyExtra },
      ginger: { ...ginger, extraFee: gingExtra },
      wasabi: { ...wasabi, extraFee: wasabiExtra },
      agridulce: { ...agridulce, feeTotal: agridulce.feeTotal ?? 0 },
      acevichada: { ...acevichada, feeTotal: acevichada.feeTotal ?? 0 },
      extrasTotal,            // incluye salsas + cambios + delivery + palitos
      estimatedTotal,
    };
    onConfirm(payload);
    onClose();
  };

  return (
    <KioskModal
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      designWidth={1100}
      designHeight={720}
    >
      {/* === CONTENIDO DEL FORM SIN SCROLL === */}
      <div className="grid grid-cols-12 gap-4">
        {/* Cantidad / Servicio */}
        <div className="col-span-12 grid grid-cols-12 gap-3">
          <div className="col-span-4">
            <label className="block text-gray-700 mb-1">Cantidad de palitos</label>
            <input
              type="number"
              min={0}
              className="w-full border rounded-lg px-3 py-2"
              value={chopsticks}
              onChange={(e) => setChopsticks(Number(e.target.value || 0))}
            />
            {CHOPSTICK_UNIT_FEE > 0 && (
              <div className="mt-1 text-xs text-gray-500">
                {`$${toCLP(CHOPSTICK_UNIT_FEE)} c/u — Subtotal: $${toCLP(chopsticksFee)}`}
              </div>
            )}
          </div>
          <div className="col-span-8">
            <label className="block text-gray-700 mb-1">Servicio</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                className={`h-10 rounded-lg font-medium ${service === "local" ? "bg-emerald-600 text-white" : "border"}`}
                onClick={() => setService("local")}
              >
                Local
              </button>
              <button
                className={`h-10 rounded-lg font-medium ${service === "delivery" ? "bg-emerald-600 text-white" : "border"}`}
                onClick={() => setService("delivery")}
              >
                Delivery
              </button>
            </div>
          </div>
        </div>

        {/* Zona de delivery (si aplica) */}
        {service === "delivery" && (
          <div className="col-span-12 grid grid-cols-12 gap-3">
            <div className="col-span-6">
              <label className="block text-gray-700 mb-1">Zona de entrega</label>
              <select
                className="w-full border rounded-lg px-3 py-2"
                value={deliveryZone}
                onChange={(e) => setDeliveryZone(e.target.value)}
              >
                <option value="">Selecciona zona…</option>
                {DELIVERY_ZONES.map(z => (
                  <option key={z.value} value={z.value}>
                    {z.label} — ${toCLP(z.fee)}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-6 flex items-end">
              <div className="text-sm text-gray-700">
                <b>Delivery:</b> ${toCLP(deliveryFee)}
              </div>
            </div>
          </div>
        )}

        {/* Cambios de proteína */}
        <div className="col-span-12">
          <h4 className="font-semibold text-gray-900 mb-2">Cambios de proteína (máx. 2 visibles)</h4>
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-6 grid grid-cols-2 gap-2">
              <select className="border rounded-lg px-3 py-2" value={c1From ?? ""} onChange={(e)=>setC1From((e.target.value || "") as Protein || undefined)}>
                <option value="">—</option>
                {proteins.map(p => <option key={`c1f-${p}`} value={p}>{p}</option>)}
              </select>
              <select className="border rounded-lg px-3 py-2" value={c1To ?? ""} onChange={(e)=>setC1To((e.target.value || "") as Protein || undefined)}>
                <option value="">—</option>
                {proteins.map(p => <option key={`c1t-${p}`} value={p}>{p}</option>)}
              </select>
              <div className="col-span-2 text-sm text-gray-600">Costo cambio 1: ${toCLP(c1Cost)}</div>
            </div>
            <div className="col-span-6 grid grid-cols-2 gap-2">
              <select className="border rounded-lg px-3 py-2" value={c2From ?? ""} onChange={(e)=>setC2From((e.target.value || "") as Protein || undefined)}>
                <option value="">—</option>
                {proteins.map(p => <option key={`c2f-${p}`} value={p}>{p}</option>)}
              </select>
              <select className="border rounded-lg px-3 py-2" value={c2To ?? ""} onChange={(e)=>setC2To((e.target.value || "") as Protein || undefined)}>
                <option value="">—</option>
                {proteins.map(p => <option key={`c2t-${p}`} value={p}>{p}</option>)}
              </select>
              <div className="col-span-2 text-sm text-gray-600">Costo cambio 2: ${toCLP(c2Cost)}</div>
            </div>
          </div>
          <p className="mt-2 text-[12px] text-gray-500">
            Reglas: cambiar <b>pollo/kanikama → salmón/camarón</b> +$2.500; cambiar <b>salmón/camarón → loco/pulpo</b> +$4.000.
          </p>
        </div>

        {/* Salsas */}
        <div className="col-span-12 grid grid-cols-12 gap-3">
          <div className="col-span-4 border rounded-xl p-3">
            <div className="font-medium">Soya</div>
            <div className="text-[12px] text-gray-500 mb-2">Incluidas: 4. Extra: $300 c/u</div>
            <input className="w-full border rounded-lg px-3 py-2" type="number" min={0}
              value={soy.qty} onChange={e=>setSoy(s=>({ ...s, qty: Number(e.target.value || 0) }))}/>
            <div className="mt-1 text-sm">Extra: ${toCLP(soyExtra)}</div>
          </div>
          <div className="col-span-4 border rounded-xl p-3">
            <div className="font-medium">Jengibre</div>
            <div className="text-[12px] text-gray-500 mb-2">1 incluido. Extra: $300 c/u</div>
            <input className="w-full border rounded-lg px-3 py-2" type="number" min={0}
              value={ginger.qty} onChange={e=>setGinger(s=>({ ...s, qty: Number(e.target.value || 0) }))}/>
            <div className="mt-1 text-sm">Extra: ${toCLP(gingExtra)}</div>
          </div>
          <div className="col-span-4 border rounded-xl p-3">
            <div className="font-medium">Wasabi</div>
            <div className="text-[12px] text-gray-500 mb-2">1 incluido. Extra: $300 c/u</div>
            <input className="w-full border rounded-lg px-3 py-2" type="number" min={0}
              value={wasabi.qty} onChange={e=>setWasabi(s=>({ ...s, qty: Number(e.target.value || 0) }))}/>
            <div className="mt-1 text-sm">Extra: ${toCLP(wasabiExtra)}</div>
          </div>
        </div>

        {/* Total y acciones */}
        <div className="col-span-12 mt-1 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Extras: <b>${toCLP(extrasTotal)}</b> — Total estimado: <b>${toCLP(estimatedTotal)}</b>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="h-11 px-4 rounded-lg border">Cancelar</button>
            <button onClick={handleConfirm} className="h-11 px-5 rounded-lg bg-rose-600 text-white font-semibold">
              Agregar al carrito
            </button>
          </div>
        </div>
      </div>
    </KioskModal>
  );
};
