'use server';

import { cookies } from 'next/headers';
import { locales, type Locale } from '@/i18n/config';

/**
 * Server action to set the user's preferred locale.
 * Stores the preference in a cookie for SSR compatibility.
 */
export async function setLocale(locale: Locale) {
  // Validate the locale
  if (!locales.includes(locale)) {
    throw new Error(`Invalid locale: ${locale}`);
  }

  const cookieStore = await cookies();
  
  // Set cookie with 1 year expiry
  cookieStore.set('locale', locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
  });
}

