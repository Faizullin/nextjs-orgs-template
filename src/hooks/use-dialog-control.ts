"use client";

import { useState, useCallback } from "react";

export interface UseDialogControlProps<T = unknown> {
  isVisible: boolean;
  data: T | null;
  show: (data?: T) => void;
  hide: () => void;
  toggle: () => void;
}

export function useDialogControl<T = unknown>(
  initialData: T | null = null
): UseDialogControlProps<T> {
  const [isVisible, setIsVisible] = useState(false);
  const [data, setData] = useState<T | null>(initialData);

  const show = useCallback((newData?: T) => {
    if (newData !== undefined) {
      setData(newData);
    }
    setIsVisible(true);
  }, []);

  const hide = useCallback(() => {
    setIsVisible(false);
    setData(null);
  }, []);

  const toggle = useCallback(() => {
    setIsVisible((prev) => !prev);
  }, []);

  return {
    isVisible,
    data,
    show,
    hide,
    toggle,
  };
}
