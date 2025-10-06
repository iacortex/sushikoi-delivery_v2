// src/components/cashier/PromotionsGrid.tsx
import React from "react";
import { Search, Layers, Filter, X } from "lucide-react";
import { groupMenu, MenuItem } from "@/features/menu/catalog";
import PromotionDetailModal, { AddToCartPayload } from "./PromotionDetailModal";

type ServiceType = "delivery" | "local";

export default function PromotionsGrid(props: {
  onAddToCart: (promotionId: number, hintedBasePrice?: number) => void;
  onAddToCartDetailed: (p: AddToCartPayload) => void;
  onAfterConfirm?: () => void;
}) {
  const { onAddToCartDetailed, onAfterConfirm } = props;

  // === búsqueda y vista
  const [q, setQ] = React.useState("");
  const [view, setView] = React.useState<"PROMOCIONES" | "PRODUCTOS INDIVIDUALES">("PROMOCIONES");

  // === filtros rápidos (multiselección)
  type ChipKey = "fritos" | "salmon" | "veggie" | "sinArroz" | "premium";
  const [chips, setChips] = React.useState<ChipKey[]>([]);
  const toggleChip = (k: ChipKey) =>
    setChips((prev) => (prev.includes(k) ? prev.filter((c) => c !== k) : [...prev, k]));

  const sectionsRaw = groupMenu(q);

  const preds: Record<ChipKey, (m: MenuItem) => boolean> = {
    fritos: (m) => /frito|furay|panko|hot/i.test(m.name) || /frito|furay|panko/i.test(m.subgroup || ""),
    salmon: (m) => /salm[oó]n|sake/i.test(m.name) || /SALM[OÓ]N/i.test(m.subgroup || ""),
    veggie: (m) => /vege|veggie|yasai|palta/i.test(m.name) || /VEGETA|VEGETARIANO/i.test(m.subgroup || ""),
    sinArroz: (m) => /sin\s*arroz/i.test(m.name) || /SIN ARROZ/i.test(m.subgroup || ""),
    premium: (m) => /premium|3\.0|2\.5|especial|full/i.test(m.name) || /PREMIUM/i.test(m.subgroup || ""),
  };

  const applyChips = React.useCallback(
    (cat: "PROMOCIONES" | "PRODUCTOS INDIVIDUALES") => {
      const groups = sectionsRaw[cat];
      if (!groups) return null;
      if (chips.length === 0) return groups;

      const next: Record<string, MenuItem[]> = {};
      for (const sub of Object.keys(groups)) {
        const items = groups[sub].filter((m) => chips.every((ck) => preds[ck](m)));
        if (items.length) next[sub] = items;
      }
      return next;
    },
    [chips, sectionsRaw]
  );

  // ===== Modal (usa tu PromotionDetailModal existente)
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalData, setModalData] = React.useState<{
    id: number;
    name: string;
    price: number;
    time?: number;
    isLarge?: boolean;
  } | null>(null);

  const openCustomize = (m: MenuItem) => {
    setModalData({
      id: m.id,
      name: m.name,
      price: m.price,
      time: m.time,
      isLarge: /(\b62|\b63|\b82|\b100|\b110)\b|3\.0|2\.5|Especial|Full/i.test(m.name),
    });
    setModalOpen(true);
  };

  const SectionBlock: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Layers size={16} className="text-rose-600" />
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  );

  const clp = (n: number) => new Intl.NumberFormat("es-CL").format(Math.round(n || 0));

  // ✅ Tarjeta completa clickeable: NO muestra botones “Agregar/Personalizar”
  const Card: React.FC<{ m: MenuItem }> = ({ m }) => {
    return (
      <button
        onClick={() => openCustomize(m)}
        className="border rounded-xl p-3 hover:shadow-sm transition flex flex-col text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500"
        title="Toca para configurar y agregar"
      >
        <div className="flex items-center justify-between">
          <div className="text-2xl">{m.emoji || (m.type === "promo" ? "🎉" : "🍣")}</div>
          {m.time ? (
            <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full" title="Tiempo estimado">
              ~{m.time} min
            </span>
          ) : null}
        </div>
        <div className="mt-2 font-semibold text-gray-900">{m.name}</div>
        {m.desc ? <div className="text-sm text-gray-500">{m.desc}</div> : null}
        <div className="mt-2 text-rose-600 font-bold">${clp(m.price)}</div>
        <div className="mt-2 text-[11px] text-gray-500">Toca para elegir extras (servicio se define al cliente)</div>
      </button>
    );
  };

  const renderCategory = (cat: "PROMOCIONES" | "PRODUCTOS INDIVIDUALES") => {
    const groups = applyChips(cat);
    if (!groups) return <div className="bg-white rounded-xl border p-6 text-gray-500">Sin resultados</div>;
    const subNames = Object.keys(groups).sort();

    return (
      <div className="space-y-6">
        {subNames.map((sub) => (
          <SectionBlock key={sub} title={sub}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {groups[sub].map((m) => (
                <Card key={m.id} m={m} />
              ))}
            </div>
          </SectionBlock>
        ))}
      </div>
    );
  };

  const ChipBtn: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({
    active,
    onClick,
    children,
  }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm border ${
        active ? "bg-rose-600 text-white border-rose-600" : "bg-white text-gray-700 hover:bg-gray-50"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">MENÚ SushiKoi</h2>
            <p className="text-sm text-gray-600">
              Ordenado por <b>Promociones</b> e <b>Individuales</b>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView("PROMOCIONES")}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                view === "PROMOCIONES" ? "bg-rose-600 text-white" : "bg-gray-100 text-gray-700"
              }`}
            >
              🎉 Promociones
            </button>
            <button
              onClick={() => setView("PRODUCTOS INDIVIDUALES")}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                view === "PRODUCTOS INDIVIDUALES" ? "bg-rose-600 text-white" : "bg-gray-100 text-gray-700"
              }`}
            >
              🍱 Individuales
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              className="w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              placeholder="Buscar por nombre o categoría (ej: 'fritos', 'handroll', 'california', 'torta')"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            {q && (
              <button
                className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                onClick={() => setQ("")}
                title="Limpiar"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600 inline-flex items-center gap-1">
              <Filter size={14} /> Filtros:
            </span>
            <ChipBtn active={chips.includes("fritos")} onClick={() => toggleChip("fritos")}>
              Fritos
            </ChipBtn>
            <ChipBtn active={chips.includes("salmon")} onClick={() => toggleChip("salmon")}>
              Salmón
            </ChipBtn>
            <ChipBtn active={chips.includes("veggie")} onClick={() => toggleChip("veggie")}>
              Vegetarianos
            </ChipBtn>
            <ChipBtn active={chips.includes("sinArroz")} onClick={() => toggleChip("sinArroz")}>
              Sin arroz
            </ChipBtn>
            <ChipBtn active={chips.includes("premium")} onClick={() => toggleChip("premium")}>
              Premium
            </ChipBtn>
            {chips.length > 0 && (
              <button className="ml-1 text-sm text-gray-500 hover:text-gray-700" onClick={() => setChips([])}>
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="space-y-6">
        {view === "PROMOCIONES" ? renderCategory("PROMOCIONES") : renderCategory("PRODUCTOS INDIVIDUALES")}
      </div>

      {/* Modal de detalle: mantiene tu flujo de personalización (servicio se decide luego en CustomerForm/ServiceTypeModal) */}
      {modalData && (
        <PromotionDetailModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          promotionId={modalData.id}
          basePrice={modalData.price}
          baseTime={modalData.time || 15}
          name={modalData.name}
          isLargePromo={modalData.isLarge}
          onConfirm={(payload) => {
            // Importante: aquí no forzamos delivery/local.
            // El cálculo final de delivery va en CustomerForm (según km) y/o ServiceTypeModal.
            onAddToCartDetailed(payload);
          }}
          onAfterConfirm={onAfterConfirm}
        />
      )}
    </div>
  );
}
