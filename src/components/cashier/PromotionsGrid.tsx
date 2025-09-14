// src/components/cashier/PromotionsGrid.tsx
import React, { useMemo, useState } from "react";
import { listMenu, getMenuItem } from "../../features/menu/catalog";
import { PromotionDetailModal } from "./PromotionDetailModal";

/** Tipos compartidos con CashierPanel / PromotionDetailModal */
type ServiceType = "delivery" | "local";
type Protein = "pollo" | "salmon" | "camaron" | "kanikama" | "loco" | "pulpo";

interface ChangeLine { from?: Protein; to?: Protein; fee: number; }
interface SauceLine  { qty: number; included?: number; extraFee?: number; feeTotal?: number; }

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

interface PromotionsGridProps {
  promotions?: unknown;
  onAddToCart: (promotionId: number, basePrice?: number) => void;      // compra rápida
  onAddToCartDetailed?: (payload: AddToCartPayload) => void;           // desde el modal
}

const formatCLP = (n: number) => new Intl.NumberFormat("es-CL").format(n);

export const PromotionsGrid: React.FC<PromotionsGridProps> = ({
  onAddToCart,
  onAddToCartDetailed,
}) => {
  const items = listMenu();

  // Estado del modal de detalle (tótem)
  const [openId, setOpenId] = useState<number | null>(null);
  const promo = useMemo(() => (openId ? getMenuItem(openId) : undefined), [openId]);

  const close = () => setOpenId(null);

  return (
    <div className="mx-auto max-w-7xl p-4">
      <h2 className="mb-5 text-2xl font-semibold text-gray-900">Promociones y más vendidos</h2>

      {/* Grid de productos */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((p) => (
          <div
            key={p.id}
            className="group h-full rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex h-full flex-col">
              {/* Imagen / Emoji */}
              <div className="px-5 pt-5">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-rose-100 to-rose-200 text-3xl">
                  {p.img}
                </div>
              </div>

              {/* Texto + acciones */}
              <div className="flex flex-1 flex-col p-5 pt-3">
                <h3 className="text-[15px] font-semibold leading-snug text-gray-900 line-clamp-2">
                  {p.name}
                </h3>
                <p className="mt-1 text-sm leading-snug text-gray-600 line-clamp-2">
                  {p.desc}
                </p>

                <div className="mt-auto">
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <span className="text-xl font-bold text-rose-600">${formatCLP(p.price)}</span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      className="inline-flex w-full items-center justify-center rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      onClick={() => onAddToCart(p.id, p.price)}
                      title="Compra rápida sin personalizar"
                    >
                      Compra rápida
                    </button>
                    <button
                      className="inline-flex w-full items-center justify-center rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                      onClick={() => setOpenId(p.id)}
                      title="Personaliza tu promo"
                    >
                      Arma tu promo (recomendado)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal tipo tótem SIN SCROLL */}
      {openId && promo && (
        <PromotionDetailModal
          open
          onClose={close}
          promotionId={promo.id}
          title={promo.name}
          subtitle={promo.desc}
          basePrice={promo.price}
          onConfirm={(payload) => onAddToCartDetailed?.(payload)}
        />
      )}
    </div>
  );
};

export default PromotionsGrid;
