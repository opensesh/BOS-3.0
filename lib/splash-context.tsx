'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

interface SplashContextType {
  isShowingSplash: boolean;
  completeSplash: () => void;
  skipSplash: () => void;
}

const SplashContext = createContext<SplashContextType | undefined>(undefined);

const SPLASH_STORAGE_KEY = 'bos-splash-date';

function getStoredSplashDate(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    return localStorage.getItem(SPLASH_STORAGE_KEY);
  } catch (error) {
    console.error('Error reading splash date:', error);
    return null;
  }
}

function saveSplashDate(date: string): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(SPLASH_STORAGE_KEY, date);
  } catch (error) {
    console.error('Error saving splash date:', error);
  }
}

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

function shouldShowSplash(): boolean {
  const storedDate = getStoredSplashDate();
  const today = getTodayDateString();
  return storedDate !== today;
}

interface SplashProviderProps {
  children: ReactNode;
}

export function SplashProvider({ children }: SplashProviderProps) {
  const [isShowingSplash, setIsShowingSplash] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (shouldShowSplash()) {
      setIsShowingSplash(true);
    }
  }, []);

  const completeSplash = useCallback(() => {
    saveSplashDate(getTodayDateString());
    setIsShowingSplash(false);
  }, []);

  const skipSplash = useCallback(() => {
    saveSplashDate(getTodayDateString());
    setIsShowingSplash(false);
  }, []);

  // SSR-safe default context
  if (!mounted) {
    return (
      <SplashContext.Provider
        value={{
          isShowingSplash: false,
          completeSplash: () => {},
          skipSplash: () => {}
        }}
      >
        {children}
      </SplashContext.Provider>
    );
  }

  return (
    <SplashContext.Provider value={{ isShowingSplash, completeSplash, skipSplash }}>
      {children}
    </SplashContext.Provider>
  );
}

export function useSplash() {
  const context = useContext(SplashContext);
  if (context === undefined) {
    throw new Error('useSplash must be used within a SplashProvider');
  }
  return context;
}
