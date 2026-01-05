// Server-side i18n configuration for next-intl
// This file uses next/headers and can only be used in Server Components

import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { locales, defaultLocale, type Locale } from './config';

// Get locale from cookie or default
async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('locale')?.value;
  
  if (localeCookie && locales.includes(localeCookie as Locale)) {
    return localeCookie as Locale;
  }
  
  return defaultLocale;
}

export default getRequestConfig(async () => {
  const locale = await getLocale();

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});

