import React, { useEffect } from "react";
import { X } from "lucide-react";
import { useAutoScale } from "@/hooks/useAutoScale";

interface KioskModalProps {
  open: boolean;
  title?: string;
  subtitle?: string;
  onClose: () => void;
  designWidth?: number;   // ancho base del contenido (sin escalar)
  designHeight?: number;  // alto base del contenido (sin escalar)
  children: React.ReactNode;
}

/**
 * Modal full-screen tipo tótem — SIN SCROLL.
 * Auto-escala el contenido para que SIEMPRE quepa en pantalla.
 */
export const KioskModal: React.FC<KioskModalProps> = ({
  open,
  title,
  subtitle,
  onClose,
  designWidth = 1100,
  designHeight = 720,
  children
}) => {
  const { ref, scale } = useAutoScale(designWidth, designHeight);

  // Bloquear scroll del body mientras está abierto
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center">
      {/* Panel sin overflow */}
      <div
        className="bg-white rounded-2xl shadow-xl border border-gray-200"
        style={{
          width: "min(98vw, 1120px)",
          height: "min(94vh, 760px)",
          overflow: "hidden",
          display: "grid",
          gridTemplateRows: "auto 1fr",
        }}
      >
        {/* Header compacto */}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="min-w-0">
            {title && <h3 className="text-[clamp(16px,2vw,20px)] font-semibold text-gray-900 truncate">{title}</h3>}
            {subtitle && <p className="text-[12px] text-gray-500 truncate">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 active:scale-[0.98] transition"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Lienzo auto-escalado (SIN scroll) */}
        <div className="grid place-items-center">
          <div
            ref={ref}
            style={{
              width: designWidth,
              height: designHeight,
              transform: `scale(${scale})`,
              transformOrigin: "top center",
            }}
          >
            <div className="p-4 md:p-6 [--fs:14px] text-[var(--fs)] leading-tight">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
