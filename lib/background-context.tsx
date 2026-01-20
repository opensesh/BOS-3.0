'use client';

import { createContext, useContext, useState, useCallback, useRef, ReactNode, useEffect } from 'react';

/**
 * Animation Phase State Machine
 *
 * Flow:
 * - idle → separating (on focus)
 * - separating → settled (auto after 1.2s)
 * - settled → converging (on submit)
 * - converging → washing (auto when blobs merge)
 * - washing → fading (auto after 400ms hold)
 * - fading → hidden (auto after 500ms)
 * - any → reversing (on unfocus without submit)
 * - reversing → idle (auto after 1s)
 */
export type AnimationPhase =
  | 'idle'       // Two blobs floating naturally near center
  | 'separating' // Blobs drifting toward left/right edges
  | 'settled'    // Circles anchored at edges (hold while typing)
  | 'converging' // Circles move inward, merge into color wash
  | 'washing'    // Color wash highlighting chat area
  | 'fading'     // Fade out
  | 'hidden'     // Gone
  | 'reversing'; // Returning to idle (when unfocused)

// Legacy type alias for backwards compatibility
export type BackgroundState = 'default' | 'engage' | 'transition';

interface BackgroundContextType {
  // New phase-based API
  animationPhase: AnimationPhase;
  triggerFocus: () => void;      // idle → separating → settled
  triggerUnfocus: () => void;    // any → reversing → idle
  triggerSubmit: () => void;     // settled → converging → washing → fading → hidden

  // Legacy API (for backwards compatibility)
  backgroundState: BackgroundState;
  setBackgroundState: (state: BackgroundState) => void;
  triggerTransition: () => void;
  isTransitioning: boolean;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

interface BackgroundProviderProps {
  children: ReactNode;
}

// Timing constants (in milliseconds)
const TIMING = {
  IDLE_TO_SEPARATING: 800,
  SEPARATING_TO_SETTLED: 1200,
  SETTLED_TO_CONVERGING: 1000,
  CONVERGING_TO_WASHING: 600,
  WASHING_HOLD: 400,
  WASHING_TO_FADING: 500,
  REVERSING_TO_IDLE: 1000,
};

export function BackgroundProvider({ children }: BackgroundProviderProps) {
  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>('idle');
  const phaseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear any pending phase transition
  const clearPhaseTimeout = useCallback(() => {
    if (phaseTimeoutRef.current) {
      clearTimeout(phaseTimeoutRef.current);
      phaseTimeoutRef.current = null;
    }
  }, []);

  // Schedule a phase transition after a delay
  const schedulePhaseTransition = useCallback((nextPhase: AnimationPhase, delay: number) => {
    clearPhaseTimeout();
    phaseTimeoutRef.current = setTimeout(() => {
      setAnimationPhase(nextPhase);
    }, delay);
  }, [clearPhaseTimeout]);

  // Handle phase transitions with auto-progression
  useEffect(() => {
    switch (animationPhase) {
      case 'separating':
        // Auto-transition to settled
        schedulePhaseTransition('settled', TIMING.SEPARATING_TO_SETTLED);
        break;
      case 'converging':
        // Auto-transition to washing
        schedulePhaseTransition('washing', TIMING.CONVERGING_TO_WASHING);
        break;
      case 'washing':
        // Hold, then transition to fading
        schedulePhaseTransition('fading', TIMING.WASHING_HOLD);
        break;
      case 'fading':
        // Transition to hidden
        schedulePhaseTransition('hidden', TIMING.WASHING_TO_FADING);
        break;
      case 'reversing':
        // Return to idle
        schedulePhaseTransition('idle', TIMING.REVERSING_TO_IDLE);
        break;
      default:
        // idle, settled, hidden - no auto-transition
        break;
    }

    return () => clearPhaseTimeout();
  }, [animationPhase, schedulePhaseTransition, clearPhaseTimeout]);

  // Trigger focus: idle → separating → settled
  const triggerFocus = useCallback(() => {
    if (animationPhase === 'idle' || animationPhase === 'reversing') {
      clearPhaseTimeout();
      setAnimationPhase('separating');
    }
  }, [animationPhase, clearPhaseTimeout]);

  // Trigger unfocus: any → reversing → idle
  const triggerUnfocus = useCallback(() => {
    // Don't reverse if we're already hidden or in the submit flow
    if (animationPhase === 'hidden' || animationPhase === 'fading' || animationPhase === 'washing' || animationPhase === 'converging') {
      return;
    }

    // Don't reverse if already idle or reversing
    if (animationPhase === 'idle' || animationPhase === 'reversing') {
      return;
    }

    clearPhaseTimeout();
    setAnimationPhase('reversing');
  }, [animationPhase, clearPhaseTimeout]);

  // Trigger submit: settled → converging → washing → fading → hidden
  const triggerSubmit = useCallback(() => {
    clearPhaseTimeout();
    setAnimationPhase('converging');
  }, [clearPhaseTimeout]);

  // Legacy API mappings
  const backgroundState: BackgroundState =
    animationPhase === 'idle' || animationPhase === 'reversing' ? 'default' :
    animationPhase === 'hidden' ? 'default' :
    animationPhase === 'converging' || animationPhase === 'washing' || animationPhase === 'fading' ? 'transition' :
    'engage';

  const isTransitioning =
    animationPhase === 'converging' ||
    animationPhase === 'washing' ||
    animationPhase === 'fading';

  const setBackgroundState = useCallback((state: BackgroundState) => {
    // Map legacy states to new phases
    if (state === 'default') {
      if (animationPhase !== 'hidden') {
        setAnimationPhase('idle');
      }
    } else if (state === 'engage') {
      if (animationPhase === 'idle') {
        setAnimationPhase('separating');
      }
    }
    // 'transition' state is handled by triggerTransition
  }, [animationPhase]);

  const triggerTransition = useCallback(() => {
    triggerSubmit();
  }, [triggerSubmit]);

  return (
    <BackgroundContext.Provider
      value={{
        // New API
        animationPhase,
        triggerFocus,
        triggerUnfocus,
        triggerSubmit,
        // Legacy API
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
