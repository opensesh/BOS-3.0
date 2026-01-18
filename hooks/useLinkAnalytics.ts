'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  ShortLinkAnalytics,
  ClicksByDay,
  ClicksByCountry,
  ClicksByDevice,
  ClicksByBrowser,
  ClicksByReferer,
} from '@/lib/supabase/types';

export type AnalyticsPeriod = '7d' | '30d' | '90d' | 'all';

export interface UseLinkAnalyticsOptions {
  linkId: string;
  autoFetch?: boolean;
  initialPeriod?: AnalyticsPeriod;
}

export interface UseLinkAnalyticsReturn {
  analytics: ShortLinkAnalytics | null;
  isLoading: boolean;
  error: Error | null;
  period: AnalyticsPeriod;
  setPeriod: (period: AnalyticsPeriod) => void;
  refresh: () => Promise<void>;

  // Individual data fetchers
  fetchClicksByDay: (days?: number) => Promise<ClicksByDay[]>;
  fetchClicksByCountry: () => Promise<ClicksByCountry[]>;
  fetchClicksByDevice: () => Promise<ClicksByDevice[]>;
  fetchClicksByBrowser: () => Promise<ClicksByBrowser[]>;
  fetchClicksByReferer: () => Promise<ClicksByReferer[]>;
}

/**
 * React hook for fetching link analytics
 */
export function useLinkAnalytics(
  options: UseLinkAnalyticsOptions
): UseLinkAnalyticsReturn {
  const { linkId, autoFetch = true, initialPeriod = '30d' } = options;

  const [analytics, setAnalytics] = useState<ShortLinkAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [period, setPeriod] = useState<AnalyticsPeriod>(initialPeriod);

  // Fetch full analytics
  const fetchAnalytics = useCallback(async () => {
    if (!linkId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/links/analytics?linkId=${linkId}&period=${period}&type=full`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(
        err instanceof Error ? err : new Error('Failed to fetch analytics')
      );
    } finally {
      setIsLoading(false);
    }
  }, [linkId, period]);

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchAnalytics();
    }
  }, [autoFetch, fetchAnalytics]);

  // Fetch clicks by day
  const fetchClicksByDay = useCallback(
    async (days?: number): Promise<ClicksByDay[]> => {
      try {
        const periodParam = days
          ? days <= 7
            ? '7d'
            : days <= 30
            ? '30d'
            : '90d'
          : period;

        const response = await fetch(
          `/api/links/analytics?linkId=${linkId}&period=${periodParam}&type=daily`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch daily clicks');
        }

        const data = await response.json();
        return data.clicksByDay;
      } catch (err) {
        console.error('Error fetching daily clicks:', err);
        throw err;
      }
    },
    [linkId, period]
  );

  // Fetch clicks by country
  const fetchClicksByCountry = useCallback(async (): Promise<
    ClicksByCountry[]
  > => {
    try {
      const response = await fetch(
        `/api/links/analytics?linkId=${linkId}&type=country`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch country data');
      }

      const data = await response.json();
      return data.clicksByCountry;
    } catch (err) {
      console.error('Error fetching country data:', err);
      throw err;
    }
  }, [linkId]);

  // Fetch clicks by device
  const fetchClicksByDevice = useCallback(async (): Promise<
    ClicksByDevice[]
  > => {
    try {
      const response = await fetch(
        `/api/links/analytics?linkId=${linkId}&type=device`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch device data');
      }

      const data = await response.json();
      return data.clicksByDevice;
    } catch (err) {
      console.error('Error fetching device data:', err);
      throw err;
    }
  }, [linkId]);

  // Fetch clicks by browser
  const fetchClicksByBrowser = useCallback(async (): Promise<
    ClicksByBrowser[]
  > => {
    try {
      const response = await fetch(
        `/api/links/analytics?linkId=${linkId}&type=browser`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch browser data');
      }

      const data = await response.json();
      return data.clicksByBrowser;
    } catch (err) {
      console.error('Error fetching browser data:', err);
      throw err;
    }
  }, [linkId]);

  // Fetch clicks by referrer
  const fetchClicksByReferer = useCallback(async (): Promise<
    ClicksByReferer[]
  > => {
    try {
      const response = await fetch(
        `/api/links/analytics?linkId=${linkId}&type=referer`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch referrer data');
      }

      const data = await response.json();
      return data.clicksByReferer;
    } catch (err) {
      console.error('Error fetching referrer data:', err);
      throw err;
    }
  }, [linkId]);

  return {
    analytics,
    isLoading,
    error,
    period,
    setPeriod,
    refresh: fetchAnalytics,
    fetchClicksByDay,
    fetchClicksByCountry,
    fetchClicksByDevice,
    fetchClicksByBrowser,
    fetchClicksByReferer,
  };
}

// Default brand ID for Open Session
const OPEN_SESSION_BRAND_ID = '16aa5681-c792-45cf-bf65-9f9cbc3197af';
const DEFAULT_BRAND_ID =
  process.env.NEXT_PUBLIC_DEFAULT_BRAND_ID || OPEN_SESSION_BRAND_ID;

export interface UseBrandAnalyticsOptions {
  brandId?: string;
  autoFetch?: boolean;
  initialPeriod?: AnalyticsPeriod;
}

export interface UseBrandAnalyticsReturn {
  totalClicks: number;
  clickTrend: ClicksByDay[];
  isLoading: boolean;
  error: Error | null;
  period: AnalyticsPeriod;
  setPeriod: (period: AnalyticsPeriod) => void;
  refresh: () => Promise<void>;
}

/**
 * React hook for fetching brand-wide analytics
 */
export function useBrandAnalytics(
  options: UseBrandAnalyticsOptions = {}
): UseBrandAnalyticsReturn {
  const {
    brandId = DEFAULT_BRAND_ID,
    autoFetch = true,
    initialPeriod = '30d',
  } = options;

  const [totalClicks, setTotalClicks] = useState(0);
  const [clickTrend, setClickTrend] = useState<ClicksByDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [period, setPeriod] = useState<AnalyticsPeriod>(initialPeriod);

  // Fetch brand analytics
  const fetchAnalytics = useCallback(async () => {
    if (!brandId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/links/analytics?brandId=${brandId}&period=${period}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch brand analytics');
      }

      const data = await response.json();
      setTotalClicks(data.totalClicks);
      setClickTrend(data.clickTrend);
    } catch (err) {
      console.error('Error fetching brand analytics:', err);
      setError(
        err instanceof Error ? err : new Error('Failed to fetch brand analytics')
      );
    } finally {
      setIsLoading(false);
    }
  }, [brandId, period]);

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchAnalytics();
    }
  }, [autoFetch, fetchAnalytics]);

  return {
    totalClicks,
    clickTrend,
    isLoading,
    error,
    period,
    setPeriod,
    refresh: fetchAnalytics,
  };
}
