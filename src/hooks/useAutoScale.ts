import { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * Autoescala un contenedor para que su contenido entre en el viewport sin scroll.
 * targetW/targetH: tamaño “diseñado” del contenido (p.ej., 1100x720).
 */
export function useAutoScale(targetW = 1100, targetH = 720) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  const recalc = () => {
    const vw = Math.max(320, window.innerWidth);
    const vh = Math.max(400, window.innerHeight);
    const k = Math.min(vw / targetW, vh / targetH);
    setScale(Math.max(0.6, Math.min(1, k * 0.995))); // margen de seguridad
  };

  useLayoutEffect(() => { recalc(); }, []);
  useEffect(() => {
    const handler = () => recalc();
    window.addEventListener("resize", handler);
    window.addEventListener("orientationchange", handler);
    return () => {
      window.removeEventListener("resize", handler);
      window.removeEventListener("orientationchange", handler);
    };
  }, []);

  return { ref, scale };
}
