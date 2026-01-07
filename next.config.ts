import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      // Google favicon service
      {
        protocol: 'https',
        hostname: 'www.google.com',
        pathname: '/s2/favicons/**',
      },
      // Allow all external images for og:image thumbnails
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  typescript: {
    // Temporarily ignore build errors to work around next/types.js issue
    ignoreBuildErrors: true,
  },
  // Rewrites for OAuth discovery and MCP endpoints
  async rewrites() {
    return [
      {
        source: '/.well-known/oauth-authorization-server',
        destination: '/api/mcp/oauth-metadata',
      },
      {
        source: '/register',
        destination: '/api/mcp/register',
      },
    ];
  },
};

export default withNextIntl(nextConfig);
