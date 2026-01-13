import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import './globals.css';
import { ThemeProvider } from '@/lib/theme-provider';
import { ChatProvider } from '@/lib/chat-context';
import { CanvasProvider } from '@/lib/canvas-context';
import { MobileMenuProvider } from '@/lib/mobile-menu-context';
import { BreadcrumbProvider } from '@/lib/breadcrumb-context';
import { SidebarProvider } from '@/lib/sidebar-context';
import { VercelAnalytics } from '@/components/VercelAnalytics';
import { CanvasPanel } from '@/components/canvas';
import { Toaster } from 'sonner';

const neueHaas = localFont({
  src: [
    {
      path: '../lib/brand-styles/fonts/NeueHaasDisplayRoman.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../lib/brand-styles/fonts/NeueHaasDisplayMedium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../lib/brand-styles/fonts/NeueHaasDisplayBold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Brand Operating System',
  description: 'Your AI-powered brand management platform built with Next.js and BRAND-OS styling',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${neueHaas.variable} font-sans antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
          >
            <ChatProvider>
              <CanvasProvider>
                <MobileMenuProvider>
                  <BreadcrumbProvider>
                    <SidebarProvider>
                      {children}
                      {/* Canvas Panel - Global overlay for collaborative editing */}
                      <CanvasPanel />
                    </SidebarProvider>
                  </BreadcrumbProvider>
                </MobileMenuProvider>
              </CanvasProvider>
            </ChatProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
        <VercelAnalytics />
        <Toaster 
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-secondary)',
              color: 'var(--fg-primary)',
            },
          }}
        />
      </body>
    </html>
  );
}
