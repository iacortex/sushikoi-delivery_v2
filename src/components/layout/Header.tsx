// src/components/layout/Header.tsx
import React from "react";
import { MapPin } from "lucide-react";
import { ORIGIN } from "@/lib/constants";

type HeaderProps = {
  title?: string;
  subtitle?: string;
  /** "hero" (panel centrado blanco) o "bar" (sticky glass) */
  variant?: "hero" | "bar";
  /** Mostrar logo del /public */
  showLogo?: boolean;
  /** Clase extra si la necesitas */
  className?: string;
};

export const Header: React.FC<HeaderProps> = ({
  title = "SUSHIKOI DELIVERY",
  subtitle = "Sistema de gestión con roles, geocodificación exacta y pagos",
  variant = "hero",
  showLogo = true,
  className,
}) => {
  const originName = ORIGIN?.name ?? "Sushikoi — Puerto Montt";
  const originUrl = (ORIGIN as any)?.url as string | undefined;

  const OriginPill = (
    <a
      href={originUrl || "#"}
      target={originUrl ? "_blank" : undefined}
      rel={originUrl ? "noopener noreferrer" : undefined}
      className="inline-flex items-center gap-2 text-sm text-blue-600 bg-blue-50 rounded-full px-4 py-2 hover:bg-blue-100 transition"
      title={originUrl ? "Ver en el mapa" : undefined}
    >
      <MapPin size={16} />
      <span className="font-medium">Origen:</span>
      <span className="truncate">{originName}</span>
    </a>
  );

  if (variant === "bar") {
    // Barra glass sticky arriba
    return (
      <header className={`koi-header ${className || ""}`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {showLogo && (
              <img
                src="/sushikoi.png"
                alt="Sushikoi"
                className="h-8 w-auto select-none"
                draggable={false}
              />
            )}
            <div className="leading-tight">
              <h1 className="font-extrabold text-white text-lg">{title}</h1>
              <p className="text-white/60 text-xs">{subtitle}</p>
            </div>
          </div>
          <div className="hidden sm:block">{OriginPill}</div>
        </div>
      </header>
    );
  }

  // Variante HERO (panel blanco, centrado)
  return (
    <header className={`koi-panel ${className || ""}`}>
      <div className="max-w-5xl mx-auto px-4 py-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-1">
          {showLogo && (
            <img
              src="/sushikoi.png"
              alt="Sushikoi"
              className="h-10 w-auto select-none"
              draggable={false}
            />
          )}
          <h1 className="text-3xl md:text-4xl font-black text-gray-900">
            {title}
          </h1>
        </div>
        <p className="text-gray-600 mb-4">{subtitle}</p>
        {OriginPill}
      </div>
    </header>
  );
};
