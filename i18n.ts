import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

// Supported locales
export const locales = ['en', 'es', 'fr', 'de', 'ja'] as const;
export type Locale = (typeof locales)[number];

// Default locale
export const defaultLocale: Locale = 'en';

// Locale display names for the language selector
export const localeNames: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  ja: '日本語',
};

// Get locale from cookie or default
export async function getLocale(): Promise<Locale> {
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
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});

