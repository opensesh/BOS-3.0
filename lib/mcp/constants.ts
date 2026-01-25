/**
 * MCP Constants
 *
 * Centralized constants for MCP server responses including
 * BOS application routes and URLs.
 */

// ============================================
// BOS Application Routes
// ============================================

/**
 * Routes for the BOS web application.
 * Used to provide navigation URLs in MCP tool responses.
 */
export const BOS_APP_ROUTES = {
  brandHub: '/brand-hub',
  logos: '/brand-hub/logo',
  colors: '/brand-hub/colors',
  fonts: '/brand-hub/fonts',
  artDirection: '/brand-hub/art-direction',
  textures: '/brand-hub/textures',
  guidelines: '/brand-hub/guidelines',
  designTokens: '/brand-hub/design-tokens',
  voice: '/brand-hub/voice',
  dashboard: '/dashboard',
} as const;

export type BosAppRoute = keyof typeof BOS_APP_ROUTES;

// ============================================
// API Routes
// ============================================

/**
 * API routes for brand-related resources.
 */
export const BOS_API_ROUTES = {
  stylesBundle: '/api/styles/bundle',
  tokensJson: '/api/styles/tokens.json',
  tailwindConfig: '/api/styles/tailwind.config.ts',
  brandCss: '/api/styles/brand.css',
  readme: '/api/styles/README.md',
  aiContext: '/api/styles/AI-CONTEXT.md',
  logosBundle: '/api/brand/assets/bundle/logos',
} as const;

// ============================================
// URL Helpers
// ============================================

/**
 * Get the base URL for the application.
 * Uses NEXT_PUBLIC_APP_URL, VERCEL_URL, or falls back to localhost.
 */
export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
}

/**
 * Generate a full BOS application URL from a route key.
 */
export function getBosAppUrl(route: BosAppRoute): string {
  return `${getBaseUrl()}${BOS_APP_ROUTES[route]}`;
}

/**
 * Generate app URLs object for MCP tool responses.
 * Pass an array of route keys to include in the response.
 */
export function getAppUrls<T extends BosAppRoute>(routes: T[]): Record<T, string> {
  return routes.reduce((acc, route) => {
    acc[route] = getBosAppUrl(route);
    return acc;
  }, {} as Record<T, string>);
}

/**
 * Get the bundle download URL for design tokens.
 */
export function getBundleUrl(includeFonts = false): string {
  const base = getBaseUrl();
  const fontParam = includeFonts ? '?include_fonts=true' : '';
  return `${base}${BOS_API_ROUTES.stylesBundle}${fontParam}`;
}

/**
 * Get the bundle download URL for all logos.
 * Optionally filter by color variant (vanilla, charcoal, glass).
 */
export function getLogosBundleUrl(variant?: string): string {
  const base = getBaseUrl();
  const variantParam = variant ? `?variant=${encodeURIComponent(variant)}` : '';
  return `${base}${BOS_API_ROUTES.logosBundle}${variantParam}`;
}

/**
 * Get individual file URLs for design tokens.
 */
export function getDesignTokenFileUrls() {
  const base = getBaseUrl();
  return {
    tokens: `${base}${BOS_API_ROUTES.tokensJson}`,
    tailwind: `${base}${BOS_API_ROUTES.tailwindConfig}`,
    css: `${base}${BOS_API_ROUTES.brandCss}`,
    readme: `${base}${BOS_API_ROUTES.readme}`,
    aiContext: `${base}${BOS_API_ROUTES.aiContext}`,
  };
}
