/**
 * Short Link Redirect Handler
 *
 * GET /l/[shortCode] - Redirect to destination URL
 *
 * This route handles the actual short link redirects.
 * It records click analytics asynchronously and performs a 302 redirect.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLinkByShortCodeOnly, incrementClicks } from '@/lib/supabase/links-service';
import { recordClickAsync } from '@/lib/supabase/link-analytics-service';

interface RouteParams {
  params: Promise<{ shortCode: string }>;
}

/**
 * GET /l/[shortCode]
 * Handle redirect and record analytics
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { shortCode } = await params;

    // Get link from database
    const link = await getLinkByShortCodeOnly(shortCode);

    // Link not found
    if (!link) {
      return NextResponse.redirect(
        new URL('/link-not-found', request.url),
        { status: 302 }
      );
    }

    // Link is inactive
    if (!link.isActive) {
      return NextResponse.redirect(
        new URL('/link-not-found', request.url),
        { status: 302 }
      );
    }

    // Link is archived
    if (link.isArchived) {
      return NextResponse.redirect(
        new URL('/link-not-found', request.url),
        { status: 302 }
      );
    }

    // Check expiration
    if (link.expiresAt) {
      const expiresAt = new Date(link.expiresAt);
      if (expiresAt < new Date()) {
        return NextResponse.redirect(
          new URL('/link-expired', request.url),
          { status: 302 }
        );
      }
    }

    // Check password protection
    if (link.hasPassword) {
      // Redirect to password page
      const passwordUrl = new URL('/l/password', request.url);
      passwordUrl.searchParams.set('code', shortCode);
      return NextResponse.redirect(passwordUrl, { status: 302 });
    }

    // Extract analytics data from request
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';
    const referer = request.headers.get('referer') || '';

    // Extract UTM params from request URL (if visitor came with UTM)
    const { searchParams } = new URL(request.url);
    const utmSource = searchParams.get('utm_source') || undefined;
    const utmMedium = searchParams.get('utm_medium') || undefined;
    const utmCampaign = searchParams.get('utm_campaign') || undefined;

    // Record click asynchronously (don't block redirect)
    recordClickAsync({
      shortLinkId: link.id,
      ipAddress,
      userAgent,
      referer,
      utmSource,
      utmMedium,
      utmCampaign,
    });

    // Increment click counter asynchronously
    incrementClicks(link.id).catch((error) => {
      console.error('Failed to increment clicks:', error);
    });

    // Build destination URL with UTM params
    let destinationUrl = link.destinationUrl;

    // Add UTM params from link settings
    const utmParams = new URLSearchParams();
    if (link.utmSource) utmParams.set('utm_source', link.utmSource);
    if (link.utmMedium) utmParams.set('utm_medium', link.utmMedium);
    if (link.utmCampaign) utmParams.set('utm_campaign', link.utmCampaign);
    if (link.utmTerm) utmParams.set('utm_term', link.utmTerm);
    if (link.utmContent) utmParams.set('utm_content', link.utmContent);

    if (utmParams.toString()) {
      const separator = destinationUrl.includes('?') ? '&' : '?';
      destinationUrl = `${destinationUrl}${separator}${utmParams.toString()}`;
    }

    // Perform redirect
    return NextResponse.redirect(destinationUrl, { status: 302 });
  } catch (error) {
    console.error('Redirect error:', error);

    // On error, redirect to error page
    return NextResponse.redirect(
      new URL('/link-error', request.url),
      { status: 302 }
    );
  }
}
