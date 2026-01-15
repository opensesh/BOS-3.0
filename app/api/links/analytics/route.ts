/**
 * Link Analytics API Route
 *
 * GET /api/links/analytics - Get analytics for a link or brand
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getAnalytics,
  getClicksByDay,
  getClicksByCountry,
  getClicksByDevice,
  getClicksByBrowser,
  getClicksByReferer,
  getRecentClicks,
  getClickTrend,
  getTotalClicksByBrand,
} from '@/lib/supabase/link-analytics-service';

// Default brand ID (demo mode - no auth)
const DEFAULT_BRAND_ID = '00000000-0000-0000-0000-000000000001';

/**
 * GET /api/links/analytics
 * Get analytics data
 *
 * Query params:
 * - linkId: Get analytics for a specific link
 * - brandId: Get analytics for all links in a brand
 * - period: 7d, 30d, 90d, or all (default: 30d)
 * - type: full, daily, country, device, browser, referer, recent (default: full)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const linkId = searchParams.get('linkId');
    const brandId = searchParams.get('brandId') || DEFAULT_BRAND_ID;
    const period =
      (searchParams.get('period') as '7d' | '30d' | '90d' | 'all') || '30d';
    const type = searchParams.get('type') || 'full';

    // Link-specific analytics
    if (linkId) {
      switch (type) {
        case 'daily':
          const days =
            period === '7d' ? 7 : period === '90d' ? 90 : period === 'all' ? 365 : 30;
          const dailyData = await getClicksByDay(linkId, days);
          return NextResponse.json({ clicksByDay: dailyData });

        case 'country':
          const countryData = await getClicksByCountry(linkId);
          return NextResponse.json({ clicksByCountry: countryData });

        case 'device':
          const deviceData = await getClicksByDevice(linkId);
          return NextResponse.json({ clicksByDevice: deviceData });

        case 'browser':
          const browserData = await getClicksByBrowser(linkId);
          return NextResponse.json({ clicksByBrowser: browserData });

        case 'referer':
          const refererData = await getClicksByReferer(linkId);
          return NextResponse.json({ clicksByReferer: refererData });

        case 'recent':
          const limit = parseInt(searchParams.get('limit') || '50');
          const recentClicks = await getRecentClicks(linkId, limit);
          return NextResponse.json({ recentClicks });

        case 'full':
        default:
          const analytics = await getAnalytics(linkId, period);
          return NextResponse.json(analytics);
      }
    }

    // Brand-wide analytics
    const days =
      period === '7d' ? 7 : period === '90d' ? 90 : period === 'all' ? 365 : 30;

    const [totalClicks, clickTrend] = await Promise.all([
      getTotalClicksByBrand(brandId),
      getClickTrend(brandId, days),
    ]);

    return NextResponse.json({
      totalClicks,
      clickTrend,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
