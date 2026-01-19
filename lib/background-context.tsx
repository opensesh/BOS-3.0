'use client';

import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';

export type BackgroundState = 'default' | 'engage' | 'transition';

interface BackgroundContextType {
  backgroundState: BackgroundState;
  setBackgroundState: (state: BackgroundState) => void;
  triggerTransition: () => void;
  isTransitioning: boolean;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

interface BackgroundProviderProps {
  children: ReactNode;
}

export function BackgroundProvider({ children }: BackgroundProviderProps) {
  const [backgroundState, setBackgroundStateInternal] = useState<BackgroundState>('default');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setBackgroundState = useCallback((state: BackgroundState) => {
    // Don't override transition state while it's active
    if (isTransitioning && state !== 'transition') return;
    setBackgroundStateInternal(state);
  }, [isTransitioning]);

  const triggerTransition = useCallback(() => {
    // Clear any existing timeout
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }

    // Set transition state
    setIsTransitioning(true);
    setBackgroundStateInternal('transition');

    // Auto-reset after 400ms (the transition duration)
    transitionTimeoutRef.current = setTimeout(() => {
      setIsTransitioning(false);
      // Don't auto-set back to default - let the component control this
    }, 400);
  }, []);

  return (
    <BackgroundContext.Provider
      value={{
        backgroundState,
        setBackgroundState,
        triggerTransition,
        isTransitioning,
      }}
    >
      {children}
    </BackgroundContext.Provider>
  );
}

export function useBackgroundContext() {
  const context = useContext(BackgroundContext);
  if (context === undefined) {
    throw new Error('useBackgroundContext must be used within a BackgroundProvider');
  }
  return context;
}

/**
 * Optional hook that returns undefined if used outside provider.
 * Useful for components that may be rendered without the provider.
 */
export function useBackgroundContextOptional() {
  return useContext(BackgroundContext);
}
