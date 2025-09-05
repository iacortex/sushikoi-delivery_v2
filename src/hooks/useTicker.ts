import { useState, useEffect } from 'react';
import { TICKER_INTERVAL_MS } from '@/lib/constants';

// Hook for creating a 1-second ticker for real-time updates
export const useTicker = (): void => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTick(tick => tick + 1);
    }, TICKER_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, []);
};