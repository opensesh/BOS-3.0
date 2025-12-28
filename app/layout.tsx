import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { ThemeProvider } from '@/lib/theme-provider';
import { ChatProvider } from '@/lib/chat-context';
import { MobileMenuProvider } from '@/lib/mobile-menu-context';
import { BreadcrumbProvider } from '@/lib/breadcrumb-context';
import { SidebarProvider } from '@/lib/sidebar-context';
import { SplashProvider } from '@/lib/splash-context';
import { DailySplash } from '@/components/DailySplash';
import { VercelAnalytics } from '@/components/VercelAnalytics';

const neueHaas = localFont({
  src: [
    {
      path: '../public/fonts/NeueHaasDisplayRoman.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/NeueHaasDisplayMedium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/NeueHaasDisplayBold.woff2',
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${neueHaas.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          <ChatProvider>
            <MobileMenuProvider>
              <BreadcrumbProvider>
                <SidebarProvider>
                  <SplashProvider>
                    {children}
                    <DailySplash />
                  </SplashProvider>
                </SidebarProvider>
              </BreadcrumbProvider>
            </MobileMenuProvider>
          </ChatProvider>
        </ThemeProvider>
        <VercelAnalytics />
      </body>
    </html>
  );
}
