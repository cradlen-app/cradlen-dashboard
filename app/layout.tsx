import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';
import { ServiceWorkerManager } from '@/components/ServiceWorkerManager';

export const metadata: Metadata = {
  applicationName: 'Cradlen Admin',
  title: 'Cradlen Admin',
  description: 'Platform administration for Cradlen',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Cradlen Admin',
  },
  icons: {
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#11604c',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-slate-50 text-slate-900">
        <Providers>{children}</Providers>
        <ServiceWorkerManager />
      </body>
    </html>
  );
}
