// src/components/cashier/PromotionsGrid.tsx
import React, { useMemo, useState } from "react";
import PromotionDetailModal from "./PromotionDetailModal";

type ServiceType = "delivery" | "local";
interface AddToCartPayload {
  promotionId: number;
  chopsticks: number;
  service: ServiceType;
  deliveryZone?: string;
  deliveryFee?: number;
  changes: { from?: any; to?: any; fee: number }[];
  soy?: { qty: number; included?: number; extraFee?: number; feeTotal?: number };
  ginger?: { qty: number; included?: number; extraFee?: number; feeTotal?: number };
  wasabi?: { qty: number; included?: number; extraFee?: number; feeTotal?: number };
  agridulce?: { qty: number; feeTotal?: number; extraFee?: number; included?: number };
  acevichada?: { qty: number; feeTotal?: number; extraFee?: number; included?: number };
  extrasTotal: number;
  estimatedTotal: number;
}

const PromotionsGrid: React.FC<{
  onAddToCart: (promotionId: number, basePrice?: number) => void;
  onAddToCartDetailed?: (payload: AddToCartPayload) => void;
}> = ({ onAddToCart, onAddToCartDetailed }) => {
  const promotions = useMemo(() => [
    { id: 1001, name: "KOI 1 (35 Bocados fríos)", price: 21990, time: 18, desc: "Selección fría con salmón, camarón y kanikama", img: "🍣" },
    { id: 1002, name: "PROMOCIÓN 1 (36 Bocados mixtos)", price: 21990, time: 22, desc: "Mix frío + frito (panko)", img: "🥢" },
    { id: 1003, name: "KOI MIX (45 Bocados mixtos)", price: 25990, time: 24, desc: "Envueltos + fritos panko", img: "🍱" },
    { id: 1004, name: "KOI 54 (54 Bocados mixtos)", price: 28990, time: 28, desc: "6 variedades entre envueltos y fritos", img: "🧧" },
    { id: 1101, name: "ACEVICHADO ROLL PREMIUM", price: 9680, time: 10, desc: "Envuelto palta + ceviche, salsa acevichada", img: "🔥" },
    { id: 1201, name: "AVOCADO (ENV PALTA)", price: 5990, time: 9, desc: "Queso crema, salmón", img: "🥑" },
    { id: 1202, name: "FURAY (Panko)", price: 6390, time: 11, desc: "Salmón, queso, cebollín", img: "🍤" },
    { id: 1203, name: "PANKO POLLO QUESO PALTA", price: 6200, time: 10, desc: "Pollo panko, queso, palta", img: "🍗" },
  ], []);

  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState<{ id: number; name: string; price: number; time: number } | null>(null);

  const openDetail = (p: { id: number; name: string; price: number; time: number }) => {
    setSel(p);
    setOpen(true);
  };

  return (
    <div className="mx-auto max-w-7xl p-4">
      <h2 className="mb-5 text-2xl font-semibold text-gray-900">Promociones y más vendidos</h2>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {promotions.map((p) => (
          <div key={p.id} className="group h-full rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md">
            <div className="flex h-full flex-col">
              <div className="px-5 pt-5">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-rose-100 to-rose-200 text-3xl">
                  {p.img}
                </div>
              </div>
              <div className="flex flex-1 flex-col p-5 pt-3">
                <h3 className="text-[15px] font-semibold leading-snug text-gray-900 line-clamp-2">{p.name}</h3>
                <p className="mt-1 text-sm leading-snug text-gray-600 line-clamp-2">{p.desc}</p>
                <div className="mt-auto">
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <span className="text-xl font-bold text-rose-600">${new Intl.NumberFormat("es-CL").format(p.price)}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      className="inline-flex w-full items-center justify-center rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                      onClick={() => onAddToCart(p.id, p.price)}
                      title="Agregar al carrito"
                    >
                      Agregar
                    </button>
                    <button
                      className="inline-flex w-full items-center justify-center rounded-lg bg-white border px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                      onClick={() => openDetail(p)}
                      title="Personalizar y agregar"
                    >
                      Personalizar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {sel && (
        <PromotionDetailModal
          open={open}
          onClose={() => setOpen(false)}
          promotionId={sel.id}
          basePrice={sel.price}
          baseTime={sel.time}
          name={sel.name}
          onConfirm={(payload) => onAddToCartDetailed?.(payload)}
        />
      )}
    </div>
  );
};

export default PromotionsGrid;
