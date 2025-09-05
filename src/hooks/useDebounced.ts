import { useState, useEffect } from 'react';

// Hook for debouncing values to reduce API calls
export const useDebounced = <T>(value: T, delay = 600): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};