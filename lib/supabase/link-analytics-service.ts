/**
 * Supabase service for short link analytics
 *
 * Handles click tracking and analytics aggregation.
 * Uses ip-api.com for geolocation (free tier: 45 req/min).
 */

import { createClient } from './client';
import type {
  DbShortLinkClick,
  ShortLinkClick,
  ShortLinkClickInsert,
  ShortLinkAnalytics,
  ClicksByDay,
  ClicksByCountry,
  ClicksByDevice,
  ClicksByBrowser,
  ClicksByReferer,
  DeviceType,
} from './types';
import { dbShortLinkClickToApp } from './types';

const supabase = createClient();

// ============================================
// USER AGENT PARSING
// ============================================

interface ParsedUserAgent {
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  deviceType: DeviceType;
  deviceBrand: string;
}

/**
 * Parse user agent string to extract device info
 * Simple regex-based parsing (use ua-parser-js for production)
 */
export function parseUserAgent(userAgent: string): ParsedUserAgent {
  const ua = userAgent.toLowerCase();

  // Device type detection
  let deviceType: DeviceType = 'desktop';
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) {
    deviceType = 'mobile';
  } else if (/tablet|ipad|playbook|silk/i.test(ua)) {
    deviceType = 'tablet';
  }

  // Browser detection
  let browser = 'Unknown';
  let browserVersion = '';
  if (ua.includes('firefox')) {
    browser = 'Firefox';
    const match = ua.match(/firefox\/(\d+)/);
    browserVersion = match?.[1] || '';
  } else if (ua.includes('edg/')) {
    browser = 'Edge';
    const match = ua.match(/edg\/(\d+)/);
    browserVersion = match?.[1] || '';
  } else if (ua.includes('chrome')) {
    browser = 'Chrome';
    const match = ua.match(/chrome\/(\d+)/);
    browserVersion = match?.[1] || '';
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browser = 'Safari';
    const match = ua.match(/version\/(\d+)/);
    browserVersion = match?.[1] || '';
  } else if (ua.includes('opera') || ua.includes('opr/')) {
    browser = 'Opera';
    const match = ua.match(/(?:opera|opr)\/(\d+)/);
    browserVersion = match?.[1] || '';
  }

  // OS detection
  let os = 'Unknown';
  let osVersion = '';
  if (ua.includes('windows')) {
    os = 'Windows';
    if (ua.includes('windows nt 10')) osVersion = '10';
    else if (ua.includes('windows nt 11')) osVersion = '11';
    else if (ua.includes('windows nt 6.3')) osVersion = '8.1';
    else if (ua.includes('windows nt 6.2')) osVersion = '8';
    else if (ua.includes('windows nt 6.1')) osVersion = '7';
  } else if (ua.includes('mac os x')) {
    os = 'macOS';
    const match = ua.match(/mac os x (\d+[._]\d+)/);
    osVersion = match?.[1]?.replace('_', '.') || '';
  } else if (ua.includes('iphone') || ua.includes('ipad')) {
    os = 'iOS';
    const match = ua.match(/os (\d+[._]\d+)/);
    osVersion = match?.[1]?.replace('_', '.') || '';
  } else if (ua.includes('android')) {
    os = 'Android';
    const match = ua.match(/android (\d+\.?\d*)/);
    osVersion = match?.[1] || '';
  } else if (ua.includes('linux')) {
    os = 'Linux';
  }

  // Device brand
  let deviceBrand = '';
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('mac')) {
    deviceBrand = 'Apple';
  } else if (ua.includes('samsung')) {
    deviceBrand = 'Samsung';
  } else if (ua.includes('huawei')) {
    deviceBrand = 'Huawei';
  } else if (ua.includes('xiaomi')) {
    deviceBrand = 'Xiaomi';
  } else if (ua.includes('pixel')) {
    deviceBrand = 'Google';
  }

  return {
    browser,
    browserVersion,
    os,
    osVersion,
    deviceType,
    deviceBrand,
  };
}

// ============================================
// GEOLOCATION
// ============================================

interface GeoLocation {
  country: string;
  countryCode: string;
  city: string;
  region: string;
  lat: number;
  lon: number;
}

/**
 * Get geolocation from IP address using ip-api.com
 * Free tier: 45 requests per minute
 */
export async function getGeoLocation(
  ipAddress: string
): Promise<GeoLocation | null> {
  // Skip local/private IPs
  if (
    ipAddress === '127.0.0.1' ||
    ipAddress === 'localhost' ||
    ipAddress.startsWith('192.168.') ||
    ipAddress.startsWith('10.') ||
    ipAddress.startsWith('172.')
  ) {
    return null;
  }

  try {
    // MEMORY OPTIMIZATION: Reduced cache TTL from 24h to 1h to limit cache bloat
    // Each unique IP creates a cache entry, which can grow to tens of MB with high traffic
    const response = await fetch(
      `http://ip-api.com/json/${ipAddress}?fields=country,countryCode,city,region,lat,lon`,
      { next: { revalidate: 3600 } } // Cache for 1 hour (was 24 hours)
    );

    if (!response.ok) {
      console.warn('Geolocation API error:', response.status);
      return null;
    }

    const data = await response.json();

    if (data.status === 'fail') {
      return null;
    }

    return {
      country: data.country || '',
      countryCode: data.countryCode || '',
      city: data.city || '',
      region: data.region || '',
      lat: data.lat || 0,
      lon: data.lon || 0,
    };
  } catch (error) {
    console.warn('Geolocation lookup failed:', error);
    return null;
  }
}

// ============================================
// REFERRER PARSING
// ============================================

/**
 * Extract domain from referrer URL
 */
export function parseReferer(referer: string): {
  referer: string;
  refererDomain: string;
} {
  if (!referer) {
    return { referer: '', refererDomain: '' };
  }

  try {
    const url = new URL(referer);
    return {
      referer,
      refererDomain: url.hostname,
    };
  } catch {
    return { referer, refererDomain: '' };
  }
}

// ============================================
// CLICK RECORDING
// ============================================

export interface ClickEventData {
  shortLinkId: string;
  ipAddress?: string;
  userAgent?: string;
  referer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

/**
 * Record a click event with full analytics
 */
export async function recordClick(data: ClickEventData): Promise<void> {
  const { shortLinkId, ipAddress, userAgent, referer } = data;

  // Parse user agent
  const parsedUA = userAgent ? parseUserAgent(userAgent) : null;

  // Parse referrer
  const parsedReferer = parseReferer(referer || '');

  // Get geolocation (async, non-blocking if it fails)
  let geo: GeoLocation | null = null;
  if (ipAddress) {
    try {
      geo = await getGeoLocation(ipAddress);
    } catch {
      // Don't fail on geo lookup
    }
  }

  const clickData: ShortLinkClickInsert = {
    short_link_id: shortLinkId,
    ip_address: ipAddress,
    user_agent: userAgent,
    browser: parsedUA?.browser,
    browser_version: parsedUA?.browserVersion,
    os: parsedUA?.os,
    os_version: parsedUA?.osVersion,
    device_type: parsedUA?.deviceType,
    device_brand: parsedUA?.deviceBrand,
    referer: parsedReferer.referer,
    referer_domain: parsedReferer.refererDomain,
    country: geo?.country,
    country_code: geo?.countryCode,
    city: geo?.city,
    region: geo?.region,
    latitude: geo?.lat,
    longitude: geo?.lon,
    utm_source: data.utmSource,
    utm_medium: data.utmMedium,
    utm_campaign: data.utmCampaign,
  };

  const { error } = await supabase.from('short_link_clicks').insert(clickData);

  if (error) {
    console.error('Error recording click:', error);
    // Don't throw - click recording should not block redirect
  }
}

/**
 * Record click without waiting (fire and forget)
 */
export function recordClickAsync(data: ClickEventData): void {
  recordClick(data).catch((error) => {
    console.error('Async click recording failed:', error);
  });
}

// ============================================
// ANALYTICS QUERIES
// ============================================

/**
 * Get full analytics for a link
 */
export async function getAnalytics(
  linkId: string,
  period: '7d' | '30d' | '90d' | 'all' = '30d'
): Promise<ShortLinkAnalytics> {
  // Calculate date range
  let startDate: Date | null = null;
  const now = new Date();

  switch (period) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case 'all':
    default:
      startDate = null;
  }

  // Build base query
  // MEMORY OPTIMIZATION: Limit clicks to prevent unbounded data fetching
  const MAX_CLICKS_FOR_ANALYTICS = 10000;
  let query = supabase
    .from('short_link_clicks')
    .select('*')
    .eq('short_link_id', linkId)
    .order('clicked_at', { ascending: false })
    .limit(MAX_CLICKS_FOR_ANALYTICS);

  if (startDate) {
    query = query.gte('clicked_at', startDate.toISOString());
  }

  const { data: clicks, error } = await query;

  if (error) {
    console.error('Error fetching analytics:', error);
    throw error;
  }

  const clickData = clicks as DbShortLinkClick[];

  // Aggregate data
  const totalClicks = clickData.length;

  // Unique clicks (by IP)
  const uniqueIps = new Set(clickData.map((c) => c.ip_address).filter(Boolean));
  const uniqueClicks = uniqueIps.size;

  // Clicks by day
  const clicksByDayMap = new Map<string, number>();
  clickData.forEach((click) => {
    const date = click.clicked_at.split('T')[0];
    clicksByDayMap.set(date, (clicksByDayMap.get(date) || 0) + 1);
  });
  const clicksByDay: ClicksByDay[] = Array.from(clicksByDayMap.entries())
    .map(([date, clicks]) => ({ date, clicks }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Clicks by country
  const clicksByCountryMap = new Map<string, { code?: string; count: number }>();
  clickData.forEach((click) => {
    if (click.country) {
      const existing = clicksByCountryMap.get(click.country) || {
        code: click.country_code || undefined,
        count: 0,
      };
      existing.count++;
      clicksByCountryMap.set(click.country, existing);
    }
  });
  const clicksByCountry: ClicksByCountry[] = Array.from(
    clicksByCountryMap.entries()
  )
    .map(([country, data]) => ({
      country,
      countryCode: data.code,
      clicks: data.count,
    }))
    .sort((a, b) => b.clicks - a.clicks);

  // Clicks by device
  const clicksByDeviceMap = new Map<DeviceType, number>();
  clickData.forEach((click) => {
    if (click.device_type) {
      clicksByDeviceMap.set(
        click.device_type,
        (clicksByDeviceMap.get(click.device_type) || 0) + 1
      );
    }
  });
  const clicksByDevice: ClicksByDevice[] = Array.from(
    clicksByDeviceMap.entries()
  )
    .map(([deviceType, clicks]) => ({ deviceType, clicks }))
    .sort((a, b) => b.clicks - a.clicks);

  // Clicks by browser
  const clicksByBrowserMap = new Map<string, number>();
  clickData.forEach((click) => {
    if (click.browser) {
      clicksByBrowserMap.set(
        click.browser,
        (clicksByBrowserMap.get(click.browser) || 0) + 1
      );
    }
  });
  const clicksByBrowser: ClicksByBrowser[] = Array.from(
    clicksByBrowserMap.entries()
  )
    .map(([browser, clicks]) => ({ browser, clicks }))
    .sort((a, b) => b.clicks - a.clicks);

  // Clicks by referrer
  const clicksByRefererMap = new Map<string, number>();
  clickData.forEach((click) => {
    if (click.referer_domain) {
      clicksByRefererMap.set(
        click.referer_domain,
        (clicksByRefererMap.get(click.referer_domain) || 0) + 1
      );
    }
  });
  const clicksByReferer: ClicksByReferer[] = Array.from(
    clicksByRefererMap.entries()
  )
    .map(([refererDomain, clicks]) => ({ refererDomain, clicks }))
    .sort((a, b) => b.clicks - a.clicks);

  return {
    totalClicks,
    uniqueClicks,
    clicksByDay,
    clicksByCountry,
    clicksByDevice,
    clicksByBrowser,
    clicksByReferer,
  };
}

/**
 * Get recent clicks for a link
 */
export async function getRecentClicks(
  linkId: string,
  limit = 50
): Promise<ShortLinkClick[]> {
  const { data, error } = await supabase
    .from('short_link_clicks')
    .select('*')
    .eq('short_link_id', linkId)
    .order('clicked_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent clicks:', error);
    throw error;
  }

  return (data as DbShortLinkClick[]).map(dbShortLinkClickToApp);
}

/**
 * Get clicks by day using the database view
 */
export async function getClicksByDay(
  linkId: string,
  days = 30
): Promise<ClicksByDay[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('short_link_clicks_by_day')
    .select('*')
    .eq('short_link_id', linkId)
    .gte('click_date', startDate.toISOString().split('T')[0])
    .order('click_date', { ascending: true });

  if (error) {
    console.error('Error fetching clicks by day:', error);
    throw error;
  }

  return (data || []).map((row) => ({
    date: row.click_date,
    clicks: row.click_count,
  }));
}

/**
 * Get clicks by country using the database view
 */
export async function getClicksByCountry(
  linkId: string
): Promise<ClicksByCountry[]> {
  const { data, error } = await supabase
    .from('short_link_clicks_by_country')
    .select('*')
    .eq('short_link_id', linkId)
    .order('click_count', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching clicks by country:', error);
    throw error;
  }

  return (data || []).map((row) => ({
    country: row.country,
    countryCode: row.country_code,
    clicks: row.click_count,
  }));
}

/**
 * Get clicks by device using the database view
 */
export async function getClicksByDevice(
  linkId: string
): Promise<ClicksByDevice[]> {
  const { data, error } = await supabase
    .from('short_link_clicks_by_device')
    .select('*')
    .eq('short_link_id', linkId)
    .order('click_count', { ascending: false });

  if (error) {
    console.error('Error fetching clicks by device:', error);
    throw error;
  }

  return (data || []).map((row) => ({
    deviceType: row.device_type as DeviceType,
    clicks: row.click_count,
  }));
}

/**
 * Get clicks by browser using the database view
 */
export async function getClicksByBrowser(
  linkId: string
): Promise<ClicksByBrowser[]> {
  const { data, error } = await supabase
    .from('short_link_clicks_by_browser')
    .select('*')
    .eq('short_link_id', linkId)
    .order('click_count', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching clicks by browser:', error);
    throw error;
  }

  return (data || []).map((row) => ({
    browser: row.browser,
    clicks: row.click_count,
  }));
}

/**
 * Get clicks by referrer using the database view
 */
export async function getClicksByReferer(
  linkId: string
): Promise<ClicksByReferer[]> {
  const { data, error } = await supabase
    .from('short_link_clicks_by_referer')
    .select('*')
    .eq('short_link_id', linkId)
    .order('click_count', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching clicks by referrer:', error);
    throw error;
  }

  return (data || []).map((row) => ({
    refererDomain: row.referer_domain,
    clicks: row.click_count,
  }));
}

// ============================================
// AGGREGATE STATS
// ============================================

/**
 * Get total clicks across all links for a brand
 */
export async function getTotalClicksByBrand(brandId: string): Promise<number> {
  const { data, error } = await supabase
    .from('short_links')
    .select('clicks')
    .eq('brand_id', brandId);

  if (error) {
    console.error('Error fetching total clicks:', error);
    throw error;
  }

  return (data || []).reduce((sum, link) => sum + (link.clicks || 0), 0);
}

/**
 * Get click trend for a brand (total clicks per day)
 */
export async function getClickTrend(
  brandId: string,
  days = 30
): Promise<ClicksByDay[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get all link IDs for brand
  const { data: links, error: linksError } = await supabase
    .from('short_links')
    .select('id')
    .eq('brand_id', brandId);

  if (linksError) {
    console.error('Error fetching links for trend:', linksError);
    throw linksError;
  }

  const linkIds = (links || []).map((l) => l.id);
  if (linkIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('short_link_clicks')
    .select('clicked_at')
    .in('short_link_id', linkIds)
    .gte('clicked_at', startDate.toISOString());

  if (error) {
    console.error('Error fetching click trend:', error);
    throw error;
  }

  // Aggregate by day
  const clicksByDayMap = new Map<string, number>();
  (data || []).forEach((click) => {
    const date = click.clicked_at.split('T')[0];
    clicksByDayMap.set(date, (clicksByDayMap.get(date) || 0) + 1);
  });

  // Fill in missing days with 0
  const result: ClicksByDay[] = [];
  const currentDate = new Date(startDate);
  const today = new Date();
  while (currentDate <= today) {
    const dateStr = currentDate.toISOString().split('T')[0];
    result.push({
      date: dateStr,
      clicks: clicksByDayMap.get(dateStr) || 0,
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return result;
}
