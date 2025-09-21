import { useEffect, useRef, useState } from "react";
import { TICKER_INTERVAL_MS } from "@/lib/constants";

/**
 * Hook que fuerza un re-render periódico.
 * No retorna valor; solo “relojea” la UI cada intervalo.
 */
export const useTicker = (intervalMs: number = TICKER_INTERVAL_MS): void => {
  const [, setTick] = useState(0);
  const idRef = useRef<number | null>(null);

  useEffect(() => {
    const delay = Math.max(1, Number(intervalMs) || TICKER_INTERVAL_MS);

    idRef.current = window.setInterval(() => {
      setTick((t) => t + 1);
    }, delay);

    return () => {
      if (idRef.current !== null) {
        clearInterval(idRef.current);
        idRef.current = null;
      }
    };
  }, [intervalMs]);
};
