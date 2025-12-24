'use client';

import { useCallback, useEffect, useState, type RefObject } from 'react';

interface Size {
  width: number;
  height: number;
}

interface UseResizeObserverOptions<T extends HTMLElement = HTMLElement> {
  ref: RefObject<T | null>;
  onResize?: (size?: Size) => void;
  box?: ResizeObserverBoxOptions;
}

/**
 * Hook to observe element resize using ResizeObserver
 * Used by UUI Combobox and MultiSelect components
 *
 * @param options.ref - The ref of the element to observe
 * @param options.onResize - Callback when the element resizes
 * @param options.box - Box model to observe (content-box, border-box, device-pixel-content-box)
 */
export function useResizeObserver<T extends HTMLElement = HTMLElement>(
  options: UseResizeObserverOptions<T>
): Size {
  const { ref, onResize, box = 'content-box' } = options;
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  const handleResize = useCallback(
    (entries: ResizeObserverEntry[]) => {
      if (!entries[0]) return;

      const { width, height } = entries[0].contentRect;
      const newSize = { width, height };

      setSize(newSize);
      onResize?.(newSize);
    },
    [onResize]
  );

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver(handleResize);
    observer.observe(element, { box });

    return () => {
      observer.disconnect();
    };
  }, [ref, handleResize, box]);

  return size;
}

export default useResizeObserver;

