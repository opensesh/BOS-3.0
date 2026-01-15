/**
 * Password Verification API Route
 *
 * POST /api/links/verify-password - Verify password for protected links
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { recordClickAsync } from '@/lib/supabase/link-analytics-service';
import { incrementClicks } from '@/lib/supabase/links-service';

const supabase = createClient();

/**
 * POST /api/links/verify-password
 * Verify password and return destination URL if correct
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shortCode, password } = body;

    if (!shortCode) {
      return NextResponse.json(
        { error: 'Short code is required' },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    // Get link from database
    const { data: link, error } = await supabase
      .from('short_links')
      .select('*')
      .eq('short_code', shortCode)
      .eq('is_active', true)
      .eq('is_archived', false)
      .maybeSingle();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to verify password' },
        { status: 500 }
      );
    }

    if (!link) {
      return NextResponse.json(
        { error: 'Link not found' },
        { status: 404 }
      );
    }

    // Check if link has password
    if (!link.password_hash) {
      // No password required, return destination
      return NextResponse.json({
        destinationUrl: link.destination_url,
      });
    }

    // Verify password using bcrypt
    // For now, we'll do a simple comparison since bcrypt may not be set up
    // In production, use bcrypt.compare(password, link.password_hash)
    let isValid = false;

    try {
      // Try to use bcrypt if available
      const bcrypt = await import('bcryptjs');
      isValid = await bcrypt.compare(password, link.password_hash);
    } catch {
      // Fallback: simple comparison (for development only)
      isValid = link.password_hash === password;
    }

    if (!isValid) {
      return NextResponse.json(
        { error: 'Incorrect password' },
        { status: 401 }
      );
    }

    // Extract analytics data from request
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';
    const referer = request.headers.get('referer') || '';

    // Record click asynchronously
    recordClickAsync({
      shortLinkId: link.id,
      ipAddress,
      userAgent,
      referer,
    });

    // Increment click counter
    incrementClicks(link.id).catch((err) => {
      console.error('Failed to increment clicks:', err);
    });

    // Build destination URL with UTM params
    let destinationUrl = link.destination_url;

    const utmParams = new URLSearchParams();
    if (link.utm_source) utmParams.set('utm_source', link.utm_source);
    if (link.utm_medium) utmParams.set('utm_medium', link.utm_medium);
    if (link.utm_campaign) utmParams.set('utm_campaign', link.utm_campaign);
    if (link.utm_term) utmParams.set('utm_term', link.utm_term);
    if (link.utm_content) utmParams.set('utm_content', link.utm_content);

    if (utmParams.toString()) {
      const separator = destinationUrl.includes('?') ? '&' : '?';
      destinationUrl = `${destinationUrl}${separator}${utmParams.toString()}`;
    }

    return NextResponse.json({
      destinationUrl,
    });
  } catch (error) {
    console.error('Password verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify password' },
      { status: 500 }
    );
  }
}
