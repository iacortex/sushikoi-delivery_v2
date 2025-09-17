import React, { useMemo, useRef } from "react";
import type { DrinkItem } from "@/features/menu/drinksCatalog";
import DrinkCanIcon from "./DrinkCanIcon";
import { brandFromName } from "@/features/menu/brand";

interface Props {
  items: DrinkItem[];
  value: Record<string, number>;
  onChange: (next: Record<string, number>) => void;
  title?: string;
}
const CLP = (n: number) => new Intl.NumberFormat("es-CL").format(n);

export default function DrinksCarousel({ items, value, onChange, title }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const add = (id: string) => onChange({ ...value, [id]: Math.min(99, (value[id] || 0) + 1) });
  const sub = (id: string) => onChange({ ...value, [id]: Math.max(0, (value[id] || 0) - 1) });
  const scrollBy = (dx: number) => scroller.current?.scrollBy({ left: dx, behavior: "smooth" });
  const list = useMemo(() => items, [items]);

  return (
    <div className="w-full">
      {title && <div className="mb-2 font-semibold text-[13px] sm:text-sm text-gray-700">{title}</div>}
      <div className="relative">
        {/* flechas sólo >= sm */}
        <button onClick={() => scrollBy(-320)} className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full border bg-white/90">‹</button>
        <div ref={scroller} className="flex gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar scroll-smooth pr-1">
          {list.map((it) => {
            const n = value[it.id] || 0;
            const brand = brandFromName(it.name);
            return (
              <div key={it.id} className="min-w-[138px] max-w-[148px] sm:min-w-[150px] sm:max-w-[160px] md:min-w-[165px] md:max-w-[175px] flex-shrink-0">
                <div className="h-full bg-white rounded-xl border shadow-sm p-2 sm:p-2.5 flex flex-col">
                  <div className="flex items-start gap-2">
                    <DrinkCanIcon brand={brand} size={22} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium leading-tight line-clamp-2 text-[12.5px] sm:text-[13px]">{it.name}</div>
                      <div className="text-[12px] sm:text-[12.5px] text-gray-500 mt-0.5">${CLP(it.price)}</div>
                    </div>
                  </div>
                  {it.tags?.length ? (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {it.tags.slice(0,3).map((t) => (
                        <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full border bg-gray-50">{t}</span>
                      ))}
                    </div>
                  ) : null}
                  <div className="mt-2 flex items-center justify-between">
                    <button onClick={() => sub(it.id)} className="w-7 h-7 sm:w-7 sm:h-7 rounded-full border text-base">−</button>
                    <div className="w-7 text-center select-none text-[12.5px]">{n}</div>
                    <button onClick={() => add(it.id)} className="w-7 h-7 sm:w-7 sm:h-7 rounded-full border text-base">＋</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <button onClick={() => scrollBy(320)} className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full border bg-white/90">›</button>
      </div>
    </div>
  );
}
