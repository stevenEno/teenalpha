'use client';

import { useState, useEffect, useCallback } from 'react';

const MINI_MAP_KEY = 'ta_mini_map_visible';

interface UseMiniMapReturn {
  isVisible: boolean;
  toggle: () => void;
  show: () => void;
  hide: () => void;
}

export function useMiniMap(): UseMiniMapReturn {
  const [isVisible, setIsVisible] = useState(false);

  // Load preference from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(MINI_MAP_KEY);
      // Default to visible if no preference set
      setIsVisible(stored === null ? true : stored === 'true');
    }
  }, []);

  const toggle = useCallback(() => {
    setIsVisible((prev) => {
      const newValue = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem(MINI_MAP_KEY, String(newValue));
      }
      return newValue;
    });
  }, []);

  const show = useCallback(() => {
    setIsVisible(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(MINI_MAP_KEY, 'true');
    }
  }, []);

  const hide = useCallback(() => {
    setIsVisible(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(MINI_MAP_KEY, 'false');
    }
  }, []);

  return {
    isVisible,
    toggle,
    show,
    hide,
  };
}
