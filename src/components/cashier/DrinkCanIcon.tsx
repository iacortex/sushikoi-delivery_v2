import React from "react";
import type { DrinkBrand } from "@/features/menu/brand";

interface Props { brand: DrinkBrand; size?: number; }

const COLORS: Record<DrinkBrand, { body: string; top: string; stripe: string }> = {
  cocacola:   { body: "#D50000", top: "#B71C1C", stripe: "#FFFFFF" },
  fanta:      { body: "#FF6A00", top: "#E65100", stripe: "#FFFFFF" },
  sprite:     { body: "#0DA34E", top: "#0B7D3B", stripe: "#FFFFFF" },
  inca:       { body: "#F2C200", top: "#C79A00", stripe: "#173F5F" },
  monster:    { body: "#121212", top: "#1F1F1F", stripe: "#95C11F" },
  vital:      { body: "#1976D2", top: "#0D47A1", stripe: "#FFFFFF" },
  elvalle:    { body: "#FF9800", top: "#F57C00", stripe: "#2E2E2E" },
  guallarauco:{ body: "#00796B", top: "#00695C", stripe: "#E0F2F1" },
  agua:       { body: "#42A5F5", top: "#1E88E5", stripe: "#E3F2FD" },
  jugo:       { body: "#FB8C00", top: "#EF6C00", stripe: "#FFF3E0" },
  default:    { body: "#6B7280", top: "#4B5563", stripe: "#E5E7EB" },
};

export default function DrinkCanIcon({ brand, size = 24 }: Props) {
  const c = COLORS[brand] || COLORS.default;
  const w = size; const h = Math.round(size * 1.6);
  const r = Math.max(4, Math.round(size * 0.25));
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden>
      {/* cuerpo */}
      <rect x={2} y={Math.round(size * 0.2)} width={w-4} height={h - Math.round(size * 0.25)} rx={r} fill={c.body} />
      {/* tapa */}
      <rect x={4} y={Math.round(size * 0.08)} width={w-8} height={Math.round(size * 0.18)} rx={r/2} fill={c.top} />
      {/* franja central */}
      <rect x={4} y={Math.round(h/2 - size*0.12)} width={w-8} height={Math.round(size * 0.22)} rx={r/2} fill={c.stripe} opacity={0.9} />
      {/* brillo lateral */}
      <rect x={Math.round(w*0.15)} y={Math.round(size*0.28)} width={Math.max(1, Math.round(size*0.12))} height={Math.round(h*0.55)} rx={2} fill="#ffffff" opacity={0.25} />
    </svg>
  );
}
